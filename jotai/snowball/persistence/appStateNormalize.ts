import { defaultYieldFormValues, isCalendarDateInput, toDerivedDividendGrowthPercent } from '@/shared/lib/snowball';
import type { PortfolioPersistedState, TickerProfile } from '@/shared/types/snowball';
import type { YearlySeriesKey } from '@/shared/constants';
import type { PersistedAppStatePayload, PersistedInvestmentSettings, PersistedScenarioState } from '../types';
import {
  DEFAULT_SCENARIO_TAB_ID,
  DEFAULT_SCENARIO_TAB_NAME,
  EMPTY_INVESTMENT_SETTINGS,
  EMPTY_PORTFOLIO_STATE
} from '../atoms';

/** IndexedDB 레코드에 저장되는 값 형태 (scenarios/activeScenarioId는 구버전 페이로드에서 없을 수 있다). */
export type PersistedAppState = {
  portfolio: PortfolioPersistedState;
  investmentSettings: PersistedInvestmentSettings;
  scenarios?: PersistedScenarioState[];
  activeScenarioId?: string;
  savedName?: string;
};

const DEFAULT_VISIBLE_YEARLY_SERIES: Record<YearlySeriesKey, boolean> = {
  totalContribution: true,
  assetValue: true,
  annualDividend: false,
  monthlyDividend: false,
  cumulativeDividend: false
};

const DEFAULT_PERSISTED_INVESTMENT_SETTINGS: PersistedInvestmentSettings = {
  initialInvestment: defaultYieldFormValues.initialInvestment,
  monthlyContribution: defaultYieldFormValues.monthlyContribution,
  targetMonthlyDividend: defaultYieldFormValues.targetMonthlyDividend,
  investmentStartDate: defaultYieldFormValues.investmentStartDate,
  durationYears: defaultYieldFormValues.durationYears,
  reinvestDividends: defaultYieldFormValues.reinvestDividends,
  reinvestDividendPercent: defaultYieldFormValues.reinvestDividendPercent,
  taxRate: defaultYieldFormValues.taxRate,
  reinvestTiming: defaultYieldFormValues.reinvestTiming,
  dpsGrowthMode: defaultYieldFormValues.dpsGrowthMode,
  showQuickEstimate: false,
  showSplitGraphs: false,
  isResultCompact: false,
  isYearlyAreaFillOn: true,
  showPortfolioDividendCenter: true,
  visibleYearlySeries: DEFAULT_VISIBLE_YEARLY_SERIES
};

const DEFAULT_PERSISTED_PORTFOLIO_STATE = EMPTY_PORTFOLIO_STATE;
const DEFAULT_PERSISTED_INVESTMENT_SETTINGS_FOR_NEW_STATE = EMPTY_INVESTMENT_SETTINGS;

/**
 * 정합 모델 마이그레이션.
 *
 * 구버전 저장 데이터/공유 링크는 `dividendYield` / `dividendGrowth` / `expectedTotalReturn` 3개를
 * 모두 들고 있는데, 셋이 서로 모순이었다(엔진이 `priceGrowth = etr - dy` 로 가격을, `dividendGrowth` 로
 * 배당을 따로 굴렸기 때문). 정합 모델은 자유도가 2뿐이라 하나를 버려야 한다.
 *
 * **사용자가 튜닝한 헤드라인 숫자인 `expectedTotalReturn` 과 `dividendYield` 를 보존하고
 * `dividendGrowth := expectedTotalReturn - dividendYield` 로 재계산한다.** (프리셋과 같은 규칙)
 *
 * 신버전이 쓴 데이터는 `expectedTotalReturn === dividendYield + dividendGrowth` 라서 이 변환의
 * 고정점(fixed point)이 된다 — 즉 재적용해도 값이 바뀌지 않는다.
 */
const migrateToCoherentGrowth = (dividendYield: number, expectedTotalReturn: number): number =>
  Math.max(-100, Math.min(100, toDerivedDividendGrowthPercent(expectedTotalReturn, dividendYield)));

export const sanitizeTickerProfile = (input: unknown): TickerProfile | null => {
  if (!input || typeof input !== 'object') return null;

  const parsed = input as Record<string, unknown>;
  const ticker = typeof parsed.ticker === 'string' ? parsed.ticker.trim() : '';
  const name = typeof parsed.name === 'string' ? parsed.name.trim() : '';
  const id = typeof parsed.id === 'string' ? parsed.id.trim() : '';
  const initialPrice = Number(parsed.initialPrice);
  const dividendYield = Number(parsed.dividendYield);
  const dividendGrowthRaw = Number(parsed.dividendGrowth);
  const expectedTotalReturnRaw = Number(parsed.expectedTotalReturn);
  const frequency = parsed.frequency;

  if (!id || !ticker) return null;
  if (!Number.isFinite(initialPrice) || initialPrice <= 0) return null;
  if (!Number.isFinite(dividendYield) || dividendYield < 0) return null;
  // 배당 성장률은 이제 음수를 허용한다 (커버드콜의 NAV 침식). 유한하기만 하면 받는다.
  if (!Number.isFinite(dividendGrowthRaw)) return null;
  if (frequency !== 'monthly' && frequency !== 'quarterly' && frequency !== 'semiannual' && frequency !== 'annual') return null;

  const expectedTotalReturn = Number.isFinite(expectedTotalReturnRaw) ? expectedTotalReturnRaw : dividendYield;
  const dividendGrowth = migrateToCoherentGrowth(dividendYield, expectedTotalReturn);

  return {
    id,
    ticker,
    name,
    initialPrice,
    dividendYield,
    dividendGrowth,
    expectedTotalReturn,
    frequency
  };
};

export const sanitizePortfolioState = (input: unknown): PortfolioPersistedState => {
  if (!input || typeof input !== 'object') return EMPTY_PORTFOLIO_STATE;
  const parsed = input as PortfolioPersistedState;
  const profiles = (Array.isArray(parsed.tickerProfiles) ? parsed.tickerProfiles : [])
    .map((profile) => sanitizeTickerProfile(profile))
    .filter((profile): profile is TickerProfile => profile !== null);
  const idSet = new Set(profiles.map((profile) => profile.id));
  const includedTickerIds = (Array.isArray(parsed.includedTickerIds) ? parsed.includedTickerIds : []).filter((id) => idSet.has(id));
  const weightByTickerId = Object.entries(parsed.weightByTickerId ?? {}).reduce<Record<string, number>>((acc, [id, value]) => {
    if (!idSet.has(id)) return acc;
    const next = Number(value);
    if (!Number.isFinite(next) || next < 0) return acc;
    acc[id] = next;
    return acc;
  }, {});
  const fixedByTickerId = Object.entries(parsed.fixedByTickerId ?? {}).reduce<Record<string, boolean>>((acc, [id, value]) => {
    if (!idSet.has(id)) return acc;
    acc[id] = Boolean(value);
    return acc;
  }, {});
  const selectedTickerId = parsed.selectedTickerId && idSet.has(parsed.selectedTickerId) ? parsed.selectedTickerId : null;

  return {
    tickerProfiles: profiles,
    includedTickerIds,
    weightByTickerId,
    fixedByTickerId,
    selectedTickerId
  };
};

export const sanitizeInvestmentSettings = (input: unknown): PersistedInvestmentSettings => {
  if (!input || typeof input !== 'object') return DEFAULT_PERSISTED_INVESTMENT_SETTINGS;
  const parsed = input as Partial<PersistedInvestmentSettings>;
  const initialInvestment = Number(parsed.initialInvestment);
  const monthlyContribution = Number(parsed.monthlyContribution);
  const targetMonthlyDividend = Number(parsed.targetMonthlyDividend);
  const durationYears = Number(parsed.durationYears);
  const reinvestDividendPercent = Number(parsed.reinvestDividendPercent);
  const taxRate = parsed.taxRate === undefined ? undefined : Number(parsed.taxRate);
  const investmentStartDate = typeof parsed.investmentStartDate === 'string' ? parsed.investmentStartDate : '';
  const rawVisibleYearlySeries = parsed.visibleYearlySeries as Record<string, unknown> | undefined;
  const visibleYearlySeries: Record<YearlySeriesKey, boolean> = {
    totalContribution:
      typeof rawVisibleYearlySeries?.totalContribution === 'boolean'
        ? rawVisibleYearlySeries.totalContribution
        : DEFAULT_VISIBLE_YEARLY_SERIES.totalContribution,
    assetValue:
      typeof rawVisibleYearlySeries?.assetValue === 'boolean'
        ? rawVisibleYearlySeries.assetValue
        : DEFAULT_VISIBLE_YEARLY_SERIES.assetValue,
    annualDividend:
      typeof rawVisibleYearlySeries?.annualDividend === 'boolean'
        ? rawVisibleYearlySeries.annualDividend
        : DEFAULT_VISIBLE_YEARLY_SERIES.annualDividend,
    monthlyDividend:
      typeof rawVisibleYearlySeries?.monthlyDividend === 'boolean'
        ? rawVisibleYearlySeries.monthlyDividend
        : DEFAULT_VISIBLE_YEARLY_SERIES.monthlyDividend,
    cumulativeDividend:
      typeof rawVisibleYearlySeries?.cumulativeDividend === 'boolean'
        ? rawVisibleYearlySeries.cumulativeDividend
        : DEFAULT_VISIBLE_YEARLY_SERIES.cumulativeDividend
  };

  return {
    initialInvestment: Number.isFinite(initialInvestment) ? Math.max(0, initialInvestment) : DEFAULT_PERSISTED_INVESTMENT_SETTINGS.initialInvestment,
    monthlyContribution: Number.isFinite(monthlyContribution) ? Math.max(0, monthlyContribution) : DEFAULT_PERSISTED_INVESTMENT_SETTINGS.monthlyContribution,
    targetMonthlyDividend: Number.isFinite(targetMonthlyDividend) ? Math.max(0, targetMonthlyDividend) : DEFAULT_PERSISTED_INVESTMENT_SETTINGS.targetMonthlyDividend,
    // 저장된 상태/공유 링크에는 2026-02-31 같은 "형식은 맞지만 실재하지 않는" 날짜가 들어 있을 수 있다
    // (예전 폼 검증이 정규식만 봤기 때문). 엔진이 던지지 않도록 여기서 결정론적 기본값으로 대체한다.
    investmentStartDate: isCalendarDateInput(investmentStartDate)
      ? investmentStartDate
      : DEFAULT_PERSISTED_INVESTMENT_SETTINGS.investmentStartDate,
    durationYears: Number.isFinite(durationYears) ? Math.max(1, Math.trunc(durationYears)) : DEFAULT_PERSISTED_INVESTMENT_SETTINGS.durationYears,
    reinvestDividends:
      typeof parsed.reinvestDividends === 'boolean'
        ? parsed.reinvestDividends
        : DEFAULT_PERSISTED_INVESTMENT_SETTINGS.reinvestDividends,
    reinvestDividendPercent:
      Number.isFinite(reinvestDividendPercent)
        ? Math.max(0, Math.min(100, reinvestDividendPercent))
        : DEFAULT_PERSISTED_INVESTMENT_SETTINGS.reinvestDividendPercent,
    taxRate: taxRate !== undefined && Number.isFinite(taxRate) ? Math.max(0, Math.min(100, taxRate)) : DEFAULT_PERSISTED_INVESTMENT_SETTINGS.taxRate,
    reinvestTiming:
      parsed.reinvestTiming === 'sameMonth' || parsed.reinvestTiming === 'nextMonth'
        ? parsed.reinvestTiming
        : DEFAULT_PERSISTED_INVESTMENT_SETTINGS.reinvestTiming,
    dpsGrowthMode:
      parsed.dpsGrowthMode === 'annualStep' || parsed.dpsGrowthMode === 'monthlySmooth'
        ? parsed.dpsGrowthMode
        : DEFAULT_PERSISTED_INVESTMENT_SETTINGS.dpsGrowthMode,
    showQuickEstimate:
      typeof parsed.showQuickEstimate === 'boolean' ? parsed.showQuickEstimate : DEFAULT_PERSISTED_INVESTMENT_SETTINGS.showQuickEstimate,
    showSplitGraphs: typeof parsed.showSplitGraphs === 'boolean' ? parsed.showSplitGraphs : DEFAULT_PERSISTED_INVESTMENT_SETTINGS.showSplitGraphs,
    isResultCompact:
      typeof parsed.isResultCompact === 'boolean' ? parsed.isResultCompact : DEFAULT_PERSISTED_INVESTMENT_SETTINGS.isResultCompact,
    isYearlyAreaFillOn:
      typeof parsed.isYearlyAreaFillOn === 'boolean' ? parsed.isYearlyAreaFillOn : DEFAULT_PERSISTED_INVESTMENT_SETTINGS.isYearlyAreaFillOn,
    showPortfolioDividendCenter:
      typeof parsed.showPortfolioDividendCenter === 'boolean'
        ? parsed.showPortfolioDividendCenter
        : DEFAULT_PERSISTED_INVESTMENT_SETTINGS.showPortfolioDividendCenter,
    visibleYearlySeries
  };
};

export const sanitizeScenarioState = (input: unknown): PersistedScenarioState | null => {
  if (!input || typeof input !== 'object') return null;
  const parsed = input as PersistedScenarioState;
  const id = typeof parsed.id === 'string' ? parsed.id.trim() : '';
  const name = typeof parsed.name === 'string' ? parsed.name.trim() : '';
  if (!id || !name) return null;

  return {
    id,
    name,
    portfolio: sanitizePortfolioState(parsed.portfolio),
    investmentSettings: sanitizeInvestmentSettings(parsed.investmentSettings)
  };
};

export const sanitizeScenarios = (
  rawScenarios: unknown,
  fallbackPortfolio: PortfolioPersistedState,
  fallbackInvestmentSettings: PersistedInvestmentSettings
): PersistedScenarioState[] => {
  const parsedScenarios = (Array.isArray(rawScenarios) ? rawScenarios : [])
    .map((scenario) => sanitizeScenarioState(scenario))
    .filter((scenario): scenario is PersistedScenarioState => scenario !== null);

  if (parsedScenarios.length > 0) return parsedScenarios;

  return [
    {
      id: DEFAULT_SCENARIO_TAB_ID,
      name: DEFAULT_SCENARIO_TAB_NAME,
      portfolio: fallbackPortfolio,
      investmentSettings: fallbackInvestmentSettings
    }
  ];
};

export const sanitizeSavedName = (input: unknown): string | undefined => {
  if (typeof input !== 'string') return undefined;
  const trimmed = input.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

export const normalizePersistedAppState = (rawValue: unknown): PersistedAppStatePayload => {
  const parsed = rawValue as PersistedAppState | undefined;
  const fallbackPortfolio = sanitizePortfolioState(parsed?.portfolio);
  const fallbackInvestmentSettings = sanitizeInvestmentSettings(parsed?.investmentSettings);
  const scenarios = sanitizeScenarios(parsed?.scenarios, fallbackPortfolio, fallbackInvestmentSettings);
  const activeScenarioId =
    typeof parsed?.activeScenarioId === 'string' && scenarios.some((scenario) => scenario.id === parsed.activeScenarioId)
      ? parsed.activeScenarioId
      : scenarios[0]?.id ?? DEFAULT_SCENARIO_TAB_ID;
  const activeScenario = scenarios.find((scenario) => scenario.id === activeScenarioId) ?? scenarios[0];
  return {
    portfolio: activeScenario?.portfolio ?? fallbackPortfolio,
    investmentSettings: activeScenario?.investmentSettings ?? fallbackInvestmentSettings,
    scenarios,
    activeScenarioId,
    savedName: sanitizeSavedName(parsed?.savedName)
  };
};

export const parsePersistedAppStateJson = (jsonText: string): PersistedAppStatePayload => {
  const parsed = JSON.parse(jsonText);
  return normalizePersistedAppState(parsed);
};

export const buildDefaultPayload = (): PersistedAppStatePayload => ({
  portfolio: DEFAULT_PERSISTED_PORTFOLIO_STATE,
  investmentSettings: DEFAULT_PERSISTED_INVESTMENT_SETTINGS_FOR_NEW_STATE,
  scenarios: [
    {
      id: DEFAULT_SCENARIO_TAB_ID,
      name: DEFAULT_SCENARIO_TAB_NAME,
      portfolio: DEFAULT_PERSISTED_PORTFOLIO_STATE,
      investmentSettings: DEFAULT_PERSISTED_INVESTMENT_SETTINGS_FOR_NEW_STATE
    }
  ],
  activeScenarioId: DEFAULT_SCENARIO_TAB_ID,
  savedName: undefined
});
