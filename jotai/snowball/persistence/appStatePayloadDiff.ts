import type { PortfolioPersistedState } from '@/shared/types/snowball';
import type { PersistedAppStatePayload, PersistedInvestmentSettings } from '../types';

/**
 * 영속 payload 구조 비교 — 로컬/클라우드/JSON이 **하나의 스키마**라는 전제 위에서, 두 payload가
 * 내용상 같은지(키 순서 무관) 판정한다. 클라우드 no-op 게이트(중복 저장 스킵)와 조용한 로드
 * (클라우드가 현재와 같으면 재적용 안 함)가 공유한다.
 *
 * ⚠ supabase를 import하지 않는다 — persistence 배럴(→ `@/jotai`)로 노출되므로 초기 번들 격리 유지.
 */

/**
 * 키 순서에 흔들리지 않는 구조적 직렬화. 로컬 buildPayload와 클라우드 normalize 결과의 키 순서가
 * 달라도 **내용이 같으면 같은 문자열**이 되게 한다(스퍼리어스 diff 방지).
 */
export const stableStringify = (value: unknown): string => {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null';
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  const record = value as Record<string, unknown>;
  const entries = Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`);
  return `{${entries.join(',')}}`;
};

/** 두 payload가 (뷰 상태 포함) 완전히 같은지. 조용한 로드가 "적용 불필요"를 판단할 때 쓴다. */
export const isSamePersistedPayload = (a: PersistedAppStatePayload, b: PersistedAppStatePayload): boolean =>
  stableStringify(a) === stableStringify(b);

/**
 * "의미있는" 투자 설정 필드 화이트리스트 — 값이 계산 결과에 영향을 주는 것만.
 *
 * 제외(뷰 전용): showQuickEstimate / showSplitGraphs / isResultCompact / isYearlyAreaFillOn /
 * showPortfolioDividendCenter / visibleYearlySeries. 이 토글들은 화면 표시만 바꾸므로 클라우드
 * 저장을 유발하면 안 된다(무료 티어·쓰기 증폭 보호). 로컬 write는 뷰 상태 복원을 위해 전체를 계속 저장한다.
 *
 * ⚠ 새 투자 설정 필드를 추가할 때: 계산에 영향을 주면 여기에 등록해야 클라우드에 반영된다.
 */
const MEANINGFUL_INVESTMENT_KEYS = [
  'initialInvestment',
  'monthlyContribution',
  'targetMonthlyDividend',
  'investmentStartDate',
  'durationYears',
  'reinvestDividends',
  'reinvestDividendPercent',
  'taxRate',
  'reinvestTiming',
  'dpsGrowthMode'
] as const satisfies readonly (keyof PersistedInvestmentSettings)[];

const pickMeaningfulInvestmentSettings = (settings: PersistedInvestmentSettings): Record<string, unknown> => {
  const result: Record<string, unknown> = {};
  for (const key of MEANINGFUL_INVESTMENT_KEYS) result[key] = settings[key];
  return result;
};

/**
 * 포트폴리오의 의미있는 부분 — selectedTickerId는 "지금 편집/강조 중인 티커"라는 순수 뷰 포커스라
 * 제외한다(엔진 runSimulation이 쓰지 않는다). 티커 선택만 바뀌었다고 클라우드 저장을 유발하지 않는다.
 */
const pickMeaningfulPortfolio = (portfolio: PortfolioPersistedState): Record<string, unknown> => ({
  tickerProfiles: portfolio.tickerProfiles,
  includedTickerIds: portfolio.includedTickerIds,
  weightByTickerId: portfolio.weightByTickerId,
  fixedByTickerId: portfolio.fixedByTickerId
});

/**
 * payload에서 "의미있는 액션"만 남긴 부분집합을 뽑는다. 클라우드 no-op 비교의 기준.
 *
 * 제외: activeScenarioId(탭 전환은 뷰 상태) · 최상위 portfolio/investmentSettings(활성 탭의 미러라
 * 탭 전환 시 함께 바뀐다) · savedName · 각 시나리오의 뷰 전용 설정 · selectedTickerId.
 * 포함: 시나리오 목록(추가/삭제/이름) · 각 시나리오의 포트폴리오 데이터 · 의미있는 투자 설정.
 */
export const extractMeaningfulPayload = (payload: PersistedAppStatePayload): { scenarios: unknown[] } => ({
  scenarios: payload.scenarios.map((scenario) => ({
    id: scenario.id,
    name: scenario.name,
    portfolio: pickMeaningfulPortfolio(scenario.portfolio),
    investmentSettings: pickMeaningfulInvestmentSettings(scenario.investmentSettings)
  }))
});

/** 의미있는 부분집합의 안정 직렬화 — no-op 게이트가 ref에 담아 직전 저장과 비교한다. */
export const serializeMeaningfulPayload = (payload: PersistedAppStatePayload): string =>
  stableStringify(extractMeaningfulPayload(payload));

/** 두 payload가 "의미있는" 관점에서 같은지(탭 전환·뷰 토글은 같다고 본다). */
export const isSameMeaningfulPayload = (a: PersistedAppStatePayload, b: PersistedAppStatePayload): boolean =>
  serializeMeaningfulPayload(a) === serializeMeaningfulPayload(b);
