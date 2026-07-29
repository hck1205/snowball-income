import { DIVIDEND_UNIVERSE } from '@/shared/constants/presets';

/**
 * **"내 포트폴리오" → 시뮬레이터 프리필 계약** (보내는 쪽·받는 쪽 공용).
 *
 * 내 포트폴리오 화면은 시뮬레이터의 전역 atom·저장 payload·클라우드에 **직접 쓰지 않는다**
 * (Main 밖 쓰기는 자동저장·동기화가 안 도는 3경로 전부 위험 판정 — pitfalls 2026-07-27 🔴).
 * 안전한 유일 계약은 목표 프리필(`shared/constants/targets`)과 같다:
 *
 *   1. 보내는 쪽이 `buildPortfolioSimulationPrefillState`로 `location.state`를 만들어 이동한다.
 *   2. 시뮬레이터가 **하이드레이션 게이트 하위**에서 한 번 읽어 기존 setter(setField·시나리오 API)로
 *      커밋하고 state를 지운다(`PortfolioPrefillRequest`).
 *
 * `location.state`는 히스토리를 조작하면 아무 값이나 될 수 있는 **신뢰 불가 입력**이라 양쪽이
 * `sanitizePortfolioSimulationPrefill` **하나**를 공유한다(규칙 이원화 금지). 보내는 쪽도 sanitize를
 * 통과한 값만 싣기 때문에, 정상 경로에서는 받는 쪽 sanitize가 값을 바꾸지 않는다(멱등).
 *
 * ⚠ 영속 payload·공유 URL·클라우드 스키마와는 **무관하다** — 이 값은 라우터 state로만 살고,
 * 저장은 커밋 이후 기존 자동저장 경로가 알아서 한다. 여기에 새 필드를 늘려도 저장 스키마는 안 바뀐다.
 */

/** 프리필에 실을 수 있는 최대 종목 수. 유니버스(약 70종)보다 넉넉하되 적대적 거대 배열은 막는다. */
export const PORTFOLIO_PREFILL_MAX_HOLDINGS = 100;

/**
 * 초기 투자금 상한(원, 1조).
 *
 * 폼 스키마(`SnowballForm`)는 `finite && >= 0`만 요구하지만, 상한이 필요한 이유는 UI 미관이 아니라
 * **영속 안전**이다 — `setField`는 클램프하지 않고, 비정상 값이 저장되면 정규화가 조용히 기본값으로
 * 바꿔치기해(사용자에겐 "내가 넣은 값이 사라졌다") 원인을 못 찾는다. 개인 포트폴리오 평가금액이
 * 이 값을 넘는 일은 환산 사고(잘못된 환율·단위)일 가능성이 훨씬 크다.
 */
export const PORTFOLIO_PREFILL_MAX_INITIAL_INVESTMENT_KRW = 1_000_000_000_000;

/** 비중 합(%). sanitize를 통과한 `holdings`는 항상 이 합으로 정규화돼 있다. */
export const PORTFOLIO_PREFILL_WEIGHT_TOTAL = 100;

/**
 * "합이 이미 100"으로 볼 허용 오차.
 *
 * 비중은 평가금액 나눗셈에서 나오므로 합이 `99.99999999999999`처럼 떨어지는 게 정상이다. 이걸
 * 재정규화하면 값이 마지막 자리에서 미세하게 바뀌어 **보내는 쪽 출력과 받는 쪽 출력이 달라진다**
 * (같은 sanitize를 공유한다는 계약이 float 때문에 깨져 보인다). 오차 안이면 원값을 그대로 둔다.
 */
const WEIGHT_TOTAL_EPSILON = 1e-9;

/** 프리필 1종목. **수량·세율은 싣지 않는다** — 시뮬레이터는 비중 도메인이다(PRD AC5-3). */
export type PortfolioSimulationPrefillHolding = {
  /** 대문자 심볼. */
  ticker: string;
  /** 평가금액 비중(%). 합은 `PORTFOLIO_PREFILL_WEIGHT_TOTAL`(sanitize가 보장). */
  weightPercent: number;
};

export type PortfolioSimulationPrefill = {
  /**
   * 초기 투자금(원). 포트폴리오 평가금액(USD)을 **클릭 시점 환율**로 환산한 값이다.
   * 환율이 없으면(조회 실패) 보내는 쪽이 아예 프리필을 만들지 않는다 — 가짜 환율로 위장하지 않는다.
   */
  initialInvestmentKrw: number;
  holdings: PortfolioSimulationPrefillHolding[];
};

/** 이동에 실는 `location.state`. 키 하나로 감싸 다른 요청(목표 포커스)과 섞이지 않게 한다. */
export type PortfolioSimulationPrefillState = {
  portfolioSimulationPrefill: PortfolioSimulationPrefill;
};

/** 대문자·트림된 심볼(`normalizePortfolioTicker`와 같은 규칙). 비문자열은 `''`(= 매칭 실패). */
const normalizePrefillTicker = (ticker: unknown): string =>
  typeof ticker === 'string' ? ticker.trim().toUpperCase() : '';

/** 심볼 모양 검증 — 영숫자·점·하이픈 1~10자(BRK.B·GOOG 같은 실제 표기 허용). */
const TICKER_PATTERN = /^[A-Z0-9][A-Z0-9.-]{0,9}$/;

/**
 * 시뮬레이터가 아는 티커인가(= 프리셋 유니버스에 있는가).
 *
 * 보내는 쪽이 "비중에서 제외한 종목"을 사용자에게 알릴 때도 **같은 판정**을 써야 화면 설명과 실제
 * 프리필이 어긋나지 않는다. 수동 입력 종목·유니버스 밖 종목이 여기서 걸린다.
 */
export const isSimulationKnownTicker = (
  ticker: string,
  universe: Readonly<Record<string, unknown>> = DIVIDEND_UNIVERSE
): boolean => {
  const symbol = normalizePrefillTicker(ticker);
  return symbol.length > 0 && Object.prototype.hasOwnProperty.call(universe, symbol);
};

/** 초기 투자금(원)으로 받아들일 수 있는 값인가. 아니면 `null`. */
const sanitizeInitialInvestmentKrw = (value: unknown): number | null =>
  typeof value === 'number'
  && Number.isFinite(value)
  && value >= 0
  && value <= PORTFOLIO_PREFILL_MAX_INITIAL_INVESTMENT_KRW
    ? value
    : null;

/**
 * 비중 목록 정규화. 같은 티커가 여러 번 오면 **합산**한다(버리면 그만큼 비중이 증발한다).
 * 유효한 항목이 하나도 없으면 `null`.
 */
const sanitizePrefillHoldings = (value: unknown): PortfolioSimulationPrefillHolding[] | null => {
  // 길이부터 막는다 — 거대 배열을 순회하는 것 자체가 비용이고, 우리 화면은 이만큼 만들지 않는다.
  if (!Array.isArray(value) || value.length === 0 || value.length > PORTFOLIO_PREFILL_MAX_HOLDINGS) return null;

  const weightByTicker = new Map<string, number>();
  for (const entry of value) {
    if (!entry || typeof entry !== 'object') continue;
    const { ticker, weightPercent } = entry as { ticker?: unknown; weightPercent?: unknown };

    const symbol = normalizePrefillTicker(ticker);
    if (!TICKER_PATTERN.test(symbol)) continue;
    // 0·음수·NaN·Infinity는 비중이 될 수 없다. 100 초과 단일 항목도 받지 않는다(재정규화 전 기준).
    if (typeof weightPercent !== 'number' || !Number.isFinite(weightPercent) || weightPercent <= 0) continue;
    if (weightPercent > PORTFOLIO_PREFILL_WEIGHT_TOTAL) continue;

    weightByTicker.set(symbol, (weightByTicker.get(symbol) ?? 0) + weightPercent);
  }

  if (weightByTicker.size === 0) return null;

  let total = 0;
  for (const weight of weightByTicker.values()) total += weight;
  if (!Number.isFinite(total) || total <= 0) return null;

  /*
   * 합이 (오차 안에서) 이미 100이면 값을 그대로 둔다 — 나누고 곱하면 부동소수 잡음만 생긴다
   * (`buildPresetPortfolio`와 같은 관례). 합이 다르면(누락·조작) 비율을 유지한 채 100으로 맞춘다.
   */
  const isAlreadyNormalized = Math.abs(total - PORTFOLIO_PREFILL_WEIGHT_TOTAL) <= WEIGHT_TOTAL_EPSILON;
  const scale = isAlreadyNormalized ? 1 : PORTFOLIO_PREFILL_WEIGHT_TOTAL / total;

  return [...weightByTicker.entries()].map(([ticker, weight]) => ({
    ticker,
    weightPercent: weight * scale
  }));
};

/**
 * 프리필로 받아들일 수 있는 값인가. 아니면 `null`.
 *
 * **전부 아니면 전무**다: 금액이 이상하면 종목만 커밋하지 않고, 종목이 하나도 없으면 금액만 커밋하지
 * 않는다. 절반만 반영하면 사용자는 "왜 이 숫자가 여기 들어왔지"를 추적할 수 없다.
 */
export const sanitizePortfolioSimulationPrefill = (value: unknown): PortfolioSimulationPrefill | null => {
  if (!value || typeof value !== 'object') return null;
  const record = value as { initialInvestmentKrw?: unknown; holdings?: unknown };

  const initialInvestmentKrw = sanitizeInitialInvestmentKrw(record.initialInvestmentKrw);
  if (initialInvestmentKrw === null) return null;

  const holdings = sanitizePrefillHoldings(record.holdings);
  if (holdings === null) return null;

  return { initialInvestmentKrw, holdings };
};

/** 프리필 요청이 실려 왔는가. `location.state`는 아무 값이나 올 수 있으므로 좁혀서 읽는다. */
export const hasPortfolioSimulationPrefillRequest = (state: unknown): boolean => {
  if (!state || typeof state !== 'object') return false;
  const payload = (state as { portfolioSimulationPrefill?: unknown }).portfolioSimulationPrefill;
  return Boolean(payload) && typeof payload === 'object';
};

/** 실려 온 프리필(검증 통과분). 요청이 없거나 값이 이상하면 `null`. */
export const readPortfolioSimulationPrefillRequest = (state: unknown): PortfolioSimulationPrefill | null =>
  hasPortfolioSimulationPrefillRequest(state)
    ? sanitizePortfolioSimulationPrefill((state as { portfolioSimulationPrefill: unknown }).portfolioSimulationPrefill)
    : null;

/**
 * 보내는 쪽이 넘기는 **최소 정보**. `PortfolioSummary`(shared/lib/portfolio)가 구조적으로 만족하므로
 * 그대로 넘기면 된다 — 이 계약이 Portfolio 도메인 타입을 직접 import하지 않는 이유는, 계산 계층이
 * 커져도(지급월·세후 등) 프리필 계약은 "평가금액과 티커"만 알면 되기 때문이다.
 */
export type PortfolioPrefillSourceHolding = {
  ticker: string;
  /** 평가금액(USD). */
  valueUsd: number;
  /** 합계(#1)에 반영된 행인가. 수량 미입력·시장데이터 없음이면 false. */
  includedInTotals: boolean;
};

export type PortfolioPrefillSource = {
  /** #1 현재 자산 가치(USD) — 유니버스 밖 종목까지 포함한 **총액**. */
  totalValueUsd: number;
  holdings: readonly PortfolioPrefillSourceHolding[];
};

export type BuildPortfolioSimulationPrefillStateInput = {
  summary: PortfolioPrefillSource;
  /**
   * 1 USD = N KRW. **클릭 시점** 환율(`useFxRateValueAtomValue()`)을 그대로 넣는다.
   * 값이 없거나(조회 실패·로딩) 0 이하면 프리필을 만들지 않는다 — CTA를 비활성화할 신호로도 쓴다.
   */
  fxRateKrwPerUsd: number | null;
  /** 시뮬레이터가 아는 티커 집합. 기본값은 앱 유니버스(테스트에서만 주입). */
  universe?: Readonly<Record<string, unknown>>;
};

/**
 * 이동에 실을 `location.state`를 만든다. 프리필할 게 없으면 `null`(값 없이 이동하거나 CTA 비활성).
 *
 * - 비중은 **평가금액 기준**이라 USD/KRW가 분자·분모에서 소거된다 → 환율과 무관하다.
 * - **유니버스 밖·수동 입력·합계 제외 종목은 빼고 남은 비중을 100으로 재정규화**한다(AC5-2).
 * - 초기 투자금은 **총 평가금액** 기준이다. 제외 종목이 있으면 그 금액까지 남은 종목에 실리므로,
 *   화면은 `isSimulationKnownTicker`로 제외 종목을 함께 안내해야 한다(무음 왜곡 금지).
 * - 마지막에 반드시 `sanitizePortfolioSimulationPrefill`을 통과시킨다 — 받는 쪽과 **같은 함수**를
 *   거친 값만 실려 나가므로 양쪽 판정이 갈릴 수 없다.
 */
export const buildPortfolioSimulationPrefillState = (
  input: BuildPortfolioSimulationPrefillStateInput
): PortfolioSimulationPrefillState | null => {
  const { summary, fxRateKrwPerUsd, universe = DIVIDEND_UNIVERSE } = input;

  if (typeof fxRateKrwPerUsd !== 'number' || !Number.isFinite(fxRateKrwPerUsd) || fxRateKrwPerUsd <= 0) return null;
  if (!summary || !Array.isArray(summary.holdings)) return null;

  const covered = summary.holdings.filter(
    (holding) =>
      holding.includedInTotals
      && Number.isFinite(holding.valueUsd)
      && holding.valueUsd > 0
      && isSimulationKnownTicker(holding.ticker, universe)
  );
  if (covered.length === 0) return null;

  let coveredValueUsd = 0;
  for (const holding of covered) coveredValueUsd += holding.valueUsd;
  if (coveredValueUsd <= 0) return null;

  const holdings = covered.map((holding) => ({
    ticker: normalizePrefillTicker(holding.ticker),
    weightPercent: (holding.valueUsd * PORTFOLIO_PREFILL_WEIGHT_TOTAL) / coveredValueUsd
  }));

  const sanitized = sanitizePortfolioSimulationPrefill({
    initialInvestmentKrw: summary.totalValueUsd * fxRateKrwPerUsd,
    holdings
  });

  return sanitized === null ? null : { portfolioSimulationPrefill: sanitized };
};
