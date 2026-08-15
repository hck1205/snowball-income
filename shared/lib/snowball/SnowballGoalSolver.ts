/**
 * **목표 → 필요 월 적립금 역산 (순수 함수).**
 *
 * 앱의 기존 목표 계산은 한 방향뿐이다: 입력을 다 채우면 `findTargetYear`/`findTargetMonth` 가
 * **"언제 도달하는가"** 를 답한다. 도달하지 못하면 화면은 `미도달` 한 단어에서 끝나고, 무엇을
 * 얼마나 바꿔야 하는지는 사용자가 슬라이더를 흔들어 스스로 찾아야 했다. 이 모듈이 그 반대 방향을
 * 답한다 — **"이 조건에서 목표를 채우려면 월 얼마를 넣어야 하는가"**.
 *
 * ## 왜 배당률이 아니라 적립금을 역산하는가 (2026-08-15 사용자 결정)
 * 처음에는 "필요 배당률"을 풀었다. 하지만 배당률은 **종목이 정하는 값**이라 답을 들어도 사용자가
 * 할 수 있는 일이 "그런 종목을 찾아본다" 뿐이다. 반면 월 적립금은 **사용자가 직접 정하는 유일한
 * 축**이라 답이 곧 행동이 된다. 같은 이분탐색 구조라 비용도 같다.
 *
 * ## 왜 닫힌 식이 아니라 이분탐색인가
 * 엔진에는 닫힌 해가 없다. 지급 주기별 이산 지급, 재투자 타이밍(`sameMonth`/`nextMonth`), 주식수
 * 정수 여부, 세율, DPS 성장 모드가 전부 얽혀 있어서 "월 적립금 → 최종 월배당"을 대수적으로 뒤집을
 * 수 없다. **엔진을 그대로 여러 번 돌려** 답을 좁히는 편이 정확하고, 무엇보다 화면이 보여주는
 * 숫자와 어긋날 수 없다.
 *
 * ## 🔴 전제: 판정 함수는 월 적립금에 대해 단조여야 한다
 * 월 적립금이 늘면 매달 사는 주식수가 늘고, 그러면 모든 달의 세후 배당이 줄지 않는다 — 따라서
 * "도달했다"도 뒤집히지 않는다. 이 단조성이 이분탐색의 정당성 전부다.
 * ⚠ 배당 성장률이 음수인 시나리오에서도 **적립금 방향의 단조성은 유지된다**(성장률은 적립금과
 *   무관하게 곱해지는 항이다). 단조성이 깨질 수 있는 축은 배당률·성장률이지 적립금이 아니다.
 *
 * ## 결과의 보증
 * 돌려준 값을 실제로 넣으면 **반드시 도달한다**. 이분탐색이 좁힌 상한(=도달하는 쪽)을 쓰고,
 * 읽기 좋게 다듬을 때도 **올림**만 하기 때문이다 — 내림은 "앱이 알려준 금액을 넣었는데 미도달"
 * 이라는 최악의 실패를 만든다.
 */

/**
 * 상한을 두 배씩 넓히는 최대 횟수. 기준값의 2^40(≈1.1조 배)까지 올려 보고도 도달하지 못하면
 * 포기한다 — 무배당 종목처럼 **어떤 금액으로도 도달할 수 없는** 경우가 실제로 있고, 그때는
 * 무한 루프 대신 `null` 로 정직하게 모른다고 답해야 한다.
 */
const MAX_DOUBLINGS = 40;

/**
 * 이분탐색 종료 조건(상대 오차). 결과를 유효숫자 3자리로 올림하므로 그보다 두 자리 촘촘하면
 * 반올림 결과가 흔들리지 않는다. 판정 1회가 시뮬레이션 1회라 필요 이상으로 좁히지 않는다.
 */
const RELATIVE_TOLERANCE = 1e-4;

/** 결과를 다듬는 유효숫자. `1,234,567원` 보다 `1,240,000원` 이 읽히고, 통화 단위를 가정하지 않는다. */
const SIGNIFICANT_DIGITS = 3;

/**
 * 유효숫자 `digits` 자리로 **올림**. 통화·자릿수를 가정하지 않으려고 크기(자릿수)에서 눈금을 만든다.
 * 예) 1,234,567 → 1,240,000 · 987,654 → 988,000
 */
const roundUpToSignificantDigits = (value: number, digits: number): number => {
  if (!(value > 0)) return 0;

  const step = Math.pow(10, Math.floor(Math.log10(value)) - digits + 1);
  return Math.ceil(value / step) * step;
};

export type RequiredMonthlyContributionParams = {
  /**
   * 후보 월 적립금으로 목표에 도달하는가.
   *
   * 🔴 **화면이 쓰는 계산 경로를 그대로 넘겨야 한다.** 여기에 비슷하지만 다른 식을 넣으면
   * "앱이 알려준 금액을 넣었는데 미도달"이 된다 — 이 기능의 유일한 치명적 실패 모드다.
   * 그래서 이 모듈은 엔진을 직접 부르지 않고 판정을 **주입받는다**(포트폴리오 배분·계좌 유형·
   * 세율 같은 맥락은 호출부만 온전히 안다).
   */
  reachesTarget: (monthlyContribution: number) => boolean;
  /**
   * 상한 탐색을 시작할 기준 눈금. 정답의 자릿수에 가까울수록 판정 호출이 줄어든다.
   * 호출부는 보통 `max(현재 월 적립금, 목표 월배당)` 을 넘긴다 — 필요한 적립금은 대개 그
   * 언저리의 자릿수다. 0 이하·비유한이면 1 로 본다(탐색은 여전히 성립하고 몇 번 더 돌 뿐이다).
   */
  probeStart: number;
};

/**
 * 목표에 도달하는 **최소 월 적립금**. 어떤 금액으로도 도달할 수 없으면 `null`.
 *
 * `0` 을 돌려줄 수 있다 — 초기 투자금만으로 이미 목표가 채워지는 경우다(적립 없이도 도달).
 * 판정 호출 횟수는 보통 15~20회이고, 상한 탐색이 길어져도 `MAX_DOUBLINGS + 15` 를 넘지 않는다.
 */
export const solveRequiredMonthlyContribution = ({
  reachesTarget,
  probeStart
}: RequiredMonthlyContributionParams): number | null => {
  // 적립 0으로도 도달하면 그게 최소값이다. (이 확인을 건너뛰면 아래 이분탐색이 0을 못 돌려준다.)
  if (reachesTarget(0)) return 0;

  /** 항상 "도달 못 하는" 쪽. */
  let low = 0;
  /** 도달하는 쪽을 찾을 때까지 넓힌다. */
  let high = Number.isFinite(probeStart) && probeStart > 0 ? probeStart : 1;

  for (let doubling = 0; !reachesTarget(high); doubling += 1) {
    if (doubling >= MAX_DOUBLINGS) return null;

    low = high;
    high *= 2;
  }

  while (high - low > high * RELATIVE_TOLERANCE) {
    const mid = (low + high) / 2;
    // 부동소수 해상도가 바닥나면 mid 가 양 끝 중 하나와 같아진다 — 더 좁힐 수 없으니 멈춘다.
    if (mid <= low || mid >= high) break;

    if (reachesTarget(mid)) high = mid;
    else low = mid;
  }

  // 도달하는 쪽(high)을 올림한다 — 단조성 덕분에 올림한 값도 반드시 도달한다.
  return roundUpToSignificantDigits(high, SIGNIFICANT_DIGITS);
};
