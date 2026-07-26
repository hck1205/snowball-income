import type {
  YearMonth,
  CurrentMonthlyDividend,
  PortfolioMonthlyPoint,
  SimulationOutput,
  TargetMonthReached
} from '@/shared/types';

/**
 * **목표 달성(월 해상도) 계산 — 전부 순수 함수.**
 *
 * 기존 연 해상도 경로(`aggregateYearly` → `findTargetYear`)는 12개월을 한 행으로 접어
 * "몇 년차에 도달"까지만 답한다. 이 모듈은 같은 원본(`SimulationOutput.monthly`)을 월 해상도로
 * 유지해 "몇 년 몇 월에 도달", "오늘 기준 현재 월배당"을 답한다.
 *
 * ## 세 숫자의 정의를 하나로 묶는 규칙 (중요)
 * 현재값 · 달성률 · 예상 달성월은 **모두 같은 식**에서 나온다:
 *
 *     월배당(m) = (m월을 포함한 직전 12개월 `dividendPaid` 합) ÷ 12
 *
 * - `dividendPaid` 는 엔진에서 이미 **세후(net)** 다(`computeMonthlyPayout.net`). 여기서 세금을
 *   다시 곱하지 않는다 — 이중 반영 금지.
 * - 분모는 창에 든 개월 수가 아니라 **언제나 12**다. 연 해상도 `monthlyDividend = annualDividend / 12`
 *   와 같은 정의를 쓰기 위함이고, 덕분에 12·24·36…개월째의 월 해상도 값은 연 해상도 행과 **정확히**
 *   일치한다(부동소수 합산 순서까지 동일하진 않으므로 완전 일치가 아니라 근사 일치다).
 *
 * ## 연 해상도와의 관계
 * `SimulationResult[k].monthlyDividend` 는 이 롤링 평균을 `monthIndex = 12(k+1)` 에서 표본추출한 것과
 * 같다. 따라서 "연 도달 ⇒ 월 도달"은 무조건 성립하고, 월 도달 monthIndex 는 연 도달 연차의
 * 마지막 달(12k)보다 크지 않다. 반대 방향("월 도달 ⇒ 연 도달")은 롤링 평균이 감소하지 않는 한
 * 성립한다 — 감액(배당 성장 음수 + 재투자·적립 없음) 시나리오에서만 이론적으로 갈릴 수 있다.
 *
 * ⚠ **달력 연도 비교 주의**: 연 해상도 행의 `year` 는 달력 연도가 아니라 `시작연도 + 경과연차`
 * 라벨이다(`MonthContext.simulationYearLabel`). 1월이 아닌 달에 시작하면 1년차의 후반부가 다음
 * 달력 연도로 넘어가므로, **월 도달의 달력 연도가 연 라벨보다 1 클 수 있다**(예: 2024-07 시작,
 * 1년차 = 2024-07~2025-06, 라벨 2024). 두 값을 그대로 비교하지 말 것.
 */

/** 롤링 평균에 필요한 최소 계약. `MonthlySnapshot`(단일 종목)과 `PortfolioMonthlyPoint`(합산) 둘 다 만족한다. */
export type MonthlyDividendPoint = {
  monthIndex: number;
  year: number;
  month: number;
  /** 세후 배당 */
  dividendPaid: number;
};

/** 창 길이 — "직전 12개월". 분모로도 쓰인다(연 해상도 `annualDividend / 12` 와 동일 정의). */
const TRAILING_WINDOW_MONTHS = 12;

const toCalendarKey = (year: number, month: number): number => (year * 12) + (month - 1);

/**
 * `endIndex` 를 **포함**하는 직전 12개월 세후 배당합 ÷ 12.
 * 창이 12개월을 못 채우면(초반부) 있는 만큼만 더하되 분모는 12로 유지한다.
 */
const trailingMonthlyDividend = (points: readonly MonthlyDividendPoint[], endIndex: number): number => {
  const startIndex = Math.max(0, endIndex - TRAILING_WINDOW_MONTHS + 1);
  let sum = 0;
  for (let i = startIndex; i <= endIndex; i += 1) {
    sum += points[i].dividendPaid;
  }

  return sum / TRAILING_WINDOW_MONTHS;
};

/**
 * 종목별 월 스냅샷을 **달력 연·월 기준**으로 합산한다 — `aggregateYearly`(SnowballScenarioRun)의 월 해상도 대응물.
 *
 * 합산 순서는 연 해상도와 같다(같은 달에 대해 `outputs` 순서대로 더한다). 종목마다 시작일·기간이
 * 같으므로 실제로는 인덱스 정렬과 동치지만, 달력 키로 묶어 두면 길이가 다른 입력에서도 깨지지 않는다.
 * `shares`/`price`/`dividendPerShare` 는 종목 간 단위가 달라 합산 대상이 아니라 제외한다.
 */
export const aggregateMonthly = (outputs: readonly SimulationOutput[]): PortfolioMonthlyPoint[] => {
  const byCalendarKey = new Map<number, PortfolioMonthlyPoint>();

  for (const output of outputs) {
    for (const snapshot of output.monthly) {
      const key = toCalendarKey(snapshot.year, snapshot.month);
      const existing = byCalendarKey.get(key);

      if (!existing) {
        byCalendarKey.set(key, {
          monthIndex: snapshot.monthIndex,
          year: snapshot.year,
          month: snapshot.month,
          dividendPaid: snapshot.dividendPaid,
          contributionPaid: snapshot.contributionPaid,
          taxPaid: snapshot.taxPaid,
          portfolioValue: snapshot.portfolioValue,
          cumulativeDividend: snapshot.cumulativeDividend
        });
        continue;
      }

      existing.dividendPaid += snapshot.dividendPaid;
      existing.contributionPaid += snapshot.contributionPaid;
      existing.taxPaid += snapshot.taxPaid;
      existing.portfolioValue += snapshot.portfolioValue;
      existing.cumulativeDividend += snapshot.cumulativeDividend;
    }
  }

  return [...byCalendarKey.entries()].sort(([a], [b]) => a - b).map(([, point]) => point);
};

/**
 * 목표 월배당에 **처음 도달하는 달**(달력 연·월). 도달하지 않으면 `null`.
 *
 * 판정식: `직전 12개월 세후 배당합 ÷ 12 >= monthlyTarget` (위 모듈 주석의 단일 정의).
 * `monthlyTarget = 0`(목표 미설정)이면 첫 달에 즉시 성립한다 — 연 해상도 `findTargetYear(rows, 0)`이
 * 1년차를 반환하는 것과 같은 동작이다(호출부가 "목표 미설정"을 따로 분기해야 한다).
 */
export const findTargetMonth = (
  monthly: readonly MonthlyDividendPoint[],
  monthlyTarget: number
): TargetMonthReached | null => {
  for (let index = 0; index < monthly.length; index += 1) {
    const monthlyDividend = trailingMonthlyDividend(monthly, index);
    if (monthlyDividend >= monthlyTarget) {
      const point = monthly[index];

      return {
        monthIndex: point.monthIndex,
        year: point.year,
        month: point.month,
        monthlyDividend
      };
    }
  }

  return null;
};

export type CurrentMonthlyDividendParams = {
  /** 월 해상도 시계열 (단일 종목 `output.monthly` 또는 `aggregateMonthly` 결과). */
  monthly: readonly MonthlyDividendPoint[];
  /** "오늘". 테스트 가능하도록 **주입**한다 — 엔진은 절대 `new Date()` 를 부르지 않는다. */
  now: Date | YearMonth;
};

const toYearMonth = (now: Date | YearMonth): YearMonth =>
  now instanceof Date ? { year: now.getFullYear(), month: now.getMonth() + 1 } : now;

/**
 * "오늘" 기준 **현재 예상 월배당(세후)**.
 *
 * - 기본: 오늘이 속한 달까지의 **직전 12개월** 세후 배당합 ÷ 12 (`mode: 'trailing12m'`).
 * - 폴백: 투자 시작 후 12개월이 안 지났거나 오늘이 투자 시작 **이전**이면 **1년차 월평균**
 *   (첫 12개월 합 ÷ 12, `mode: 'firstYearAverage'`, `isFallback: true`).
 *   UI 힌트 카피를 "최근 12개월 세후 평균" ↔ "투자 첫 해 세후 평균"으로 가르는 신호다.
 * - 오늘이 시뮬레이션 **종료 이후**면 마지막 달까지의 직전 12개월을 쓴다(`asOf` 가 실제 창 끝을 알려준다).
 *   시계열 밖을 0으로 채우면 현재값이 근거 없이 줄어들기 때문이다.
 *
 * 반환 `amount` 는 `findTargetMonth` 의 판정값과 **완전히 같은 식**이다 — 도달월에서
 * `amount === target 판정에 쓰인 monthlyDividend` 가 성립하므로 달성률(amount / target)과
 * 예상 달성월이 서로 어긋나지 않는다.
 */
export const currentMonthlyDividend = ({ monthly, now }: CurrentMonthlyDividendParams): CurrentMonthlyDividend => {
  if (monthly.length === 0) {
    return { amount: 0, mode: 'firstYearAverage', isFallback: true, monthsCovered: 0 };
  }

  const buildFallback = (): CurrentMonthlyDividend => {
    const endIndex = Math.min(TRAILING_WINDOW_MONTHS, monthly.length) - 1;
    const point = monthly[endIndex];

    return {
      amount: trailingMonthlyDividend(monthly, endIndex),
      mode: 'firstYearAverage',
      isFallback: true,
      asOf: { year: point.year, month: point.month },
      monthsCovered: endIndex + 1
    };
  };

  const { year, month } = toYearMonth(now);
  const nowKey = toCalendarKey(year, month);

  // 오늘 이하의 마지막 달. 오늘이 종료 이후면 마지막 달로 클램프된다.
  let endIndex = -1;
  for (let index = 0; index < monthly.length; index += 1) {
    if (toCalendarKey(monthly[index].year, monthly[index].month) <= nowKey) endIndex = index;
    else break;
  }

  // 투자 시작 전 / 12개월 미경과 → 1년차 평균 폴백.
  if (endIndex < TRAILING_WINDOW_MONTHS - 1) return buildFallback();

  const point = monthly[endIndex];

  return {
    amount: trailingMonthlyDividend(monthly, endIndex),
    mode: 'trailing12m',
    isFallback: false,
    asOf: { year: point.year, month: point.month },
    monthsCovered: TRAILING_WINDOW_MONTHS
  };
};
