export const TARGET_MONTHLY_DIVIDENDS = {
  oneMillion: 1_000_000,
  twoMillion: 2_000_000
} as const;

/**
 * 목표 월배당 입력 필드의 **고정 DOM id**.
 *
 * 이 입력의 id는 원래 라벨에서 파생됐다(`toInputId('목표 월배당 (원)')`) — 라벨 카피를 한 글자만
 * 고쳐도 id가 조용히 바뀌는 구조라, 다른 화면에서 이 필드로 스크롤·포커스를 옮기기 시작한
 * 순간부터는 상수로 못 박는다. 실소비처는 `TargetFocusRequest`(pages/Main) — 라우터 state 로 들어온
 * 포커스 요청을 받아 이 id 로 필드를 찾는다. id를 바꾸면 그 경로가 무음으로 아무것도 안 하게 된다.
 */
export const TARGET_MONTHLY_DIVIDEND_INPUT_ID = 'target-monthly-dividend-input';

/**
 * 라우터 `location.state` 로 넘기는 **목표 입력 포커스 요청**.
 *
 * 내 포트폴리오(`/dividend/portfolio`)의 목표 달성 카드는 목표 값을 직접 쓰지 않는다(시뮬레이터 밖에는
 * 자동저장·클라우드 동기화가 없어 조용히 유실된다). 대신 시뮬레이터로 이동하면서 이 state를 실어 보내고,
 * 결과 패널이 한 번 읽어 목표 입력으로 포커스를 옮긴 뒤 state를 지운다.
 *
 * ⚠ 해시(`#`)나 쿼리로 옮기지 말 것 — 경로 기반 라우팅 유지(해시 라우팅 자제) + 공유 URL 오염 방지.
 */
export const FOCUS_TARGET_MONTHLY_DIVIDEND_STATE = { focusTargetMonthlyDividend: true } as const;

/** 위 state가 실려 왔는가. `location.state`는 아무 값이나 올 수 있으므로 좁혀서 읽는다. */
export const hasFocusTargetMonthlyDividendRequest = (state: unknown): boolean =>
  typeof state === 'object' && state !== null && (state as { focusTargetMonthlyDividend?: unknown }).focusTargetMonthlyDividend === true;

/**
 * 목표 월배당 **빠른 선택 값**(원) — 로드맵 v2 확정: 50 / 100 / 200 / 300만원.
 *
 * 현재 제품 코드의 소비처는 목표 달성 카드의 설정 패널(`GoalSetupPanel`) 하나다 — 결과 카드
 * (`SimulationResult`)의 목표 칩·CTA 가 걷힌 뒤 남은 유일한 칩 표면이다. **다른 화면에 칩을 다시
 * 두게 되면 리터럴을 새로 적지 말고 이 상수를 읽는다**(두 화면이 각자 값을 들고 있으면 "여기서 고른
 * 100만원"과 "저기서 고른 100만원"이 언젠가 갈린다).
 * 값은 GA `value_bucket` 경계(`useSnowballForm`의 `targetMonthlyDividend`)와 정확히 겹쳐 두어,
 * 칩으로 정한 목표가 분포 분석에서 경계에 걸치지 않는다.
 */
export const TARGET_MONTHLY_DIVIDEND_QUICK_VALUES = [500_000, 1_000_000, 2_000_000, 3_000_000] as const;

/**
 * 목표 월배당 상한(원, 월 1억).
 *
 * 두 곳에서 같은 상수로 검증한다: ①목표 달성 카드의 직접 입력 ②시뮬레이터가 받은 `location.state`.
 * 상한이 필요한 이유는 UI 미관이 아니라 **영속 안전**이다 — `setField`는 클램프하지 않고, 비정상 값이
 * 저장되면 정규화가 조용히 기본값으로 바꿔치기해(사용자에겐 "내가 넣은 값이 사라졌다") 원인을 못 찾는다.
 */
export const TARGET_MONTHLY_DIVIDEND_MAX = 100_000_000;

/**
 * 위 상한의 **만원 표기**(= 10,000만원). 목표 입력은 0을 여섯 개 세지 않으려고 만원 단위로 받는데,
 * 안내 문구의 상한(`GoalCard`)과 입력 필드의 `max`(`GoalSetupPanel`)가 각자 `MAX / 10_000` 을
 * 계산하면 한쪽만 바뀌는 날 "N까지 됩니다"라 안내하고 입력은 거부하는 화면이 된다 — 나누기는 여기 한 번만.
 */
export const TARGET_MONTHLY_DIVIDEND_MAX_MAN_WON = TARGET_MONTHLY_DIVIDEND_MAX / 10_000;

/**
 * 목표 월배당으로 **받아들일 수 있는 값인가**. 아니면 `null`.
 *
 * `location.state`는 사용자가 히스토리를 조작하면 아무 값이나 될 수 있는 **신뢰 불가 입력**이고,
 * 직접 입력도 마찬가지다. 그래서 보내는 쪽·받는 쪽 모두 이 함수 하나만 쓴다(규칙 이원화 금지).
 */
export const sanitizeTargetMonthlyDividend = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= TARGET_MONTHLY_DIVIDEND_MAX
    ? value
    : null;

/** 칩 라벨(`월 100만원`) — 두 화면이 같은 문자열을 쓰도록 포맷도 공유한다. */
export const formatTargetMonthlyDividendChipLabel = (won: number): string =>
  `월 ${(won / 10_000).toLocaleString()}만원`;

/**
 * 포커스 요청 state. `targetMonthlyDividend`가 붙어 있으면 **시뮬레이터가 그 값을 커밋**한 뒤 포커스한다.
 * (쓰기는 언제나 시뮬레이터 안에서 — 목표 달성 카드는 값을 저장하지 않는다.)
 */
export type FocusTargetMonthlyDividendState = {
  focusTargetMonthlyDividend: true;
  targetMonthlyDividend?: number;
};

/**
 * 이동에 실을 state를 만든다. 값이 없거나 검증에 실패하면 **값 없는 기존 state 그대로**(포커스만) —
 * 하위 호환이 유지되고, 잘못된 값이 라우터 히스토리에 실리지 않는다.
 */
export const buildFocusTargetMonthlyDividendState = (value?: number): FocusTargetMonthlyDividendState => {
  const sanitized = value === undefined ? null : sanitizeTargetMonthlyDividend(value);
  return sanitized === null
    ? FOCUS_TARGET_MONTHLY_DIVIDEND_STATE
    : { focusTargetMonthlyDividend: true, targetMonthlyDividend: sanitized };
};

/** 실려 온 목표 값(검증 통과분). 요청 자체가 없거나 값이 없거나 값이 이상하면 `null`(= 포커스만). */
export const readTargetMonthlyDividendRequestValue = (state: unknown): number | null =>
  hasFocusTargetMonthlyDividendRequest(state)
    ? sanitizeTargetMonthlyDividend((state as { targetMonthlyDividend?: unknown }).targetMonthlyDividend)
    : null;
