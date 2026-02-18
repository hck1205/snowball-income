import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';
import { EMPTY_INVESTMENT_SETTINGS, normalizePersistedAppState, type PersistedScenarioState } from '@/jotai';

export const SHARE_QUERY_PARAM = 'share';
export const SHARE_VERSION_QUERY_PARAM = 'sv';
export const SHARE_SCHEMA_VERSION = 3;
export const SHARE_LENGTH_LIMIT = 4000;

type SharedScenarioEnvelopeV1 = {
  v: 1;
  scenario: PersistedScenarioState;
};

type CompactTickerTuple = [
  ticker: string,
  initialPrice: number,
  dividendYield: number,
  dividendGrowth: number,
  expectedTotalReturn: number,
  frequencyCode: 0 | 1 | 2 | 3,
  name?: string
];

type CompactPortfolio = {
  t: CompactTickerTuple[];
  i?: number[];
  w?: Array<[number, number]>;
  f?: number[];
  s?: number;
};

type CompactInvestmentSettings = {
  a?: number;
  b?: number;
  c?: number;
  d?: string;
  e?: number;
  f?: 1;
  g?: number;
  h?: number;
  i?: 1;
  j?: 1;
  k?: 1;
  l?: 1;
  m?: 1;
  n?: 0;
  o?: 1;
  p?: number;
};

type SharedScenarioEnvelopeV2 = {
  v: 2;
  p: CompactPortfolio;
  i?: CompactInvestmentSettings;
};

type CompactInvestmentSettingsV3 = {
  a: number;
  b: number;
  c: number;
  d: string;
  e: number;
  f: 0 | 1;
  g: number;
  h: number | null;
  i: 0 | 1;
  j: 0 | 1;
  k: 0 | 1;
  l: 0 | 1;
  m: 0 | 1;
  n: 0 | 1;
  o: 0 | 1;
  p: number;
};

type SharedScenarioEnvelopeV3 = {
  v: 3;
  p: CompactPortfolio;
  i: CompactInvestmentSettingsV3;
};

type SharedScenarioEnvelope = {
  v: number;
};

const isObject = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object';

const encodeFrequency = (frequency: string): 0 | 1 | 2 | 3 => {
  if (frequency === 'monthly') return 0;
  if (frequency === 'quarterly') return 1;
  if (frequency === 'semiannual') return 2;
  return 3;
};

const decodeFrequency = (value: unknown): 'monthly' | 'quarterly' | 'semiannual' | 'annual' => {
  if (value === 0) return 'monthly';
  if (value === 1) return 'quarterly';
  if (value === 2) return 'semiannual';
  return 'annual';
};

const DEFAULT_VISIBLE_YEARLY_SERIES = EMPTY_INVESTMENT_SETTINGS.visibleYearlySeries;

const encodeVisibleYearlySeriesMask = (source: PersistedScenarioState['investmentSettings']['visibleYearlySeries']) => {
  return (
    (source.totalContribution ? 1 : 0) |
    (source.assetValue ? 2 : 0) |
    (source.annualDividend ? 4 : 0) |
    (source.monthlyDividend ? 8 : 0) |
    (source.cumulativeDividend ? 16 : 0)
  );
};

const decodeVisibleYearlySeriesMask = (mask: number) => ({
  totalContribution: Boolean(mask & 1),
  assetValue: Boolean(mask & 2),
  annualDividend: Boolean(mask & 4),
  monthlyDividend: Boolean(mask & 8),
  cumulativeDividend: Boolean(mask & 16)
});

const toCompactPortfolio = (scenario: PersistedScenarioState): CompactPortfolio => {
  const { portfolio } = scenario;
  const indexById = new Map<string, number>();
  const tickers: CompactTickerTuple[] = portfolio.tickerProfiles.map((profile, index) => {
    indexById.set(profile.id, index);
    const base: CompactTickerTuple = [
      profile.ticker,
      profile.initialPrice,
      profile.dividendYield,
      profile.dividendGrowth,
      profile.expectedTotalReturn,
      encodeFrequency(profile.frequency)
    ];
    if (profile.name.trim()) base.push(profile.name);
    return base;
  });

  const defaultIncluded = portfolio.tickerProfiles.map((_, index) => index);
  const included = portfolio.includedTickerIds
    .map((id) => indexById.get(id))
    .filter((index): index is number => Number.isInteger(index));
  const isDefaultIncluded =
    included.length === defaultIncluded.length && included.every((index, position) => index === defaultIncluded[position]);

  const weights = Object.entries(portfolio.weightByTickerId)
    .map(([id, weight]) => [indexById.get(id), Number(weight)] as const)
    .filter((entry): entry is readonly [number, number] => {
      const [index, weight] = entry;
      return Number.isInteger(index) && Number.isFinite(weight) && weight >= 0;
    })
    .map(([index, weight]) => [index, weight] as [number, number]);

  const fixed = Object.entries(portfolio.fixedByTickerId)
    .filter(([, value]) => Boolean(value))
    .map(([id]) => indexById.get(id))
    .filter((index): index is number => Number.isInteger(index));

  const selected = portfolio.selectedTickerId ? indexById.get(portfolio.selectedTickerId) : undefined;

  return {
    t: tickers,
    ...(isDefaultIncluded ? null : { i: included }),
    ...(weights.length ? { w: weights } : null),
    ...(fixed.length ? { f: fixed } : null),
    ...(Number.isInteger(selected) ? { s: selected } : null)
  };
};

const toCompactInvestmentSettingsV3 = (scenario: PersistedScenarioState): CompactInvestmentSettingsV3 => {
  const source = scenario.investmentSettings;
  return {
    a: source.initialInvestment,
    b: source.monthlyContribution,
    c: source.targetMonthlyDividend,
    d: source.investmentStartDate,
    e: source.durationYears,
    f: source.reinvestDividends ? 1 : 0,
    g: source.reinvestDividendPercent,
    h: source.taxRate ?? null,
    i: source.reinvestTiming === 'nextMonth' ? 1 : 0,
    j: source.dpsGrowthMode === 'annualStep' ? 1 : 0,
    k: source.showQuickEstimate ? 1 : 0,
    l: source.showSplitGraphs ? 1 : 0,
    m: source.isResultCompact ? 1 : 0,
    n: source.isYearlyAreaFillOn ? 1 : 0,
    o: source.showPortfolioDividendCenter ? 1 : 0,
    p: encodeVisibleYearlySeriesMask(source.visibleYearlySeries)
  };
};

export const encodeSharedScenario = (scenario: PersistedScenarioState): string => {
  const envelope: SharedScenarioEnvelopeV3 = {
    v: SHARE_SCHEMA_VERSION,
    p: toCompactPortfolio(scenario),
    i: toCompactInvestmentSettingsV3(scenario)
  };
  return compressToEncodedURIComponent(JSON.stringify(envelope));
};

const decodeV1Scenario = (parsed: SharedScenarioEnvelopeV1): PersistedScenarioState | null => {
  if (!isObject(parsed.scenario)) return null;

  const rawScenario = parsed.scenario;
  const scenarioId = typeof rawScenario.id === 'string' && rawScenario.id.trim() ? rawScenario.id.trim() : 'shared-tab';
  const scenarioName = typeof rawScenario.name === 'string' && rawScenario.name.trim() ? rawScenario.name.trim() : '공유 탭';

  const normalized = normalizePersistedAppState({
    portfolio: rawScenario.portfolio,
    investmentSettings: rawScenario.investmentSettings,
    scenarios: [
      {
        id: scenarioId,
        name: scenarioName,
        portfolio: rawScenario.portfolio,
        investmentSettings: rawScenario.investmentSettings
      }
    ],
    activeScenarioId: scenarioId
  });

  return normalized.scenarios[0] ?? null;
};

const decodeV2Scenario = (parsed: SharedScenarioEnvelopeV2): PersistedScenarioState | null => {
  if (!isObject(parsed.p)) return null;
  if (!Array.isArray(parsed.p.t)) return null;

  const tickerProfiles = parsed.p.t
    .map((tuple, index) => {
      if (!Array.isArray(tuple)) return null;
      const [ticker, initialPrice, dividendYield, dividendGrowth, expectedTotalReturn, frequencyCode, name] = tuple;
      if (typeof ticker !== 'string' || !ticker.trim()) return null;
      if (!Number.isFinite(initialPrice) || initialPrice <= 0) return null;
      if (!Number.isFinite(dividendYield) || dividendYield < 0) return null;
      if (!Number.isFinite(dividendGrowth) || dividendGrowth < 0) return null;
      if (!Number.isFinite(expectedTotalReturn)) return null;

      return {
        id: `shared-${index}`,
        ticker: ticker.trim(),
        name: typeof name === 'string' ? name : '',
        initialPrice: Number(initialPrice),
        dividendYield: Number(dividendYield),
        dividendGrowth: Number(dividendGrowth),
        expectedTotalReturn: Number(expectedTotalReturn),
        frequency: decodeFrequency(frequencyCode)
      };
    })
    .filter((profile): profile is NonNullable<typeof profile> => profile !== null);

  const maxIndex = tickerProfiles.length - 1;
  const indexToId = tickerProfiles.map((profile) => profile.id);

  const includedTickerIds = Array.isArray(parsed.p.i)
    ? parsed.p.i
        .filter((index): index is number => Number.isInteger(index) && index >= 0 && index <= maxIndex)
        .map((index) => indexToId[index])
    : indexToId;

  const weightByTickerId = Array.isArray(parsed.p.w)
    ? parsed.p.w.reduce<Record<string, number>>((acc, entry) => {
        if (!Array.isArray(entry) || entry.length < 2) return acc;
        const [index, weight] = entry;
        if (!Number.isInteger(index) || index < 0 || index > maxIndex) return acc;
        if (!Number.isFinite(weight) || weight < 0) return acc;
        acc[indexToId[index]] = Number(weight);
        return acc;
      }, {})
    : {};

  const fixedByTickerId = Array.isArray(parsed.p.f)
    ? parsed.p.f.reduce<Record<string, boolean>>((acc, index) => {
        if (!Number.isInteger(index) || index < 0 || index > maxIndex) return acc;
        acc[indexToId[index]] = true;
        return acc;
      }, {})
    : {};

  const selectedIndexRaw = parsed.p.s;
  const selectedTickerId =
    typeof selectedIndexRaw === 'number' &&
    Number.isInteger(selectedIndexRaw) &&
    selectedIndexRaw >= 0 &&
    selectedIndexRaw <= maxIndex
      ? indexToId[selectedIndexRaw]
      : null;

  const investmentSettings = {
    ...EMPTY_INVESTMENT_SETTINGS,
    visibleYearlySeries: { ...DEFAULT_VISIBLE_YEARLY_SERIES }
  };

  if (isObject(parsed.i)) {
    const compact = parsed.i;
    if (Number.isFinite(compact.a)) investmentSettings.initialInvestment = Number(compact.a);
    if (Number.isFinite(compact.b)) investmentSettings.monthlyContribution = Number(compact.b);
    if (Number.isFinite(compact.c)) investmentSettings.targetMonthlyDividend = Number(compact.c);
    if (typeof compact.d === 'string' && compact.d) investmentSettings.investmentStartDate = compact.d;
    if (Number.isFinite(compact.e)) investmentSettings.durationYears = Number(compact.e);
    if (compact.f === 1) investmentSettings.reinvestDividends = true;
    if (Number.isFinite(compact.g)) investmentSettings.reinvestDividendPercent = Number(compact.g);
    if (Number.isFinite(compact.h)) investmentSettings.taxRate = Number(compact.h);
    if (compact.i === 1) investmentSettings.reinvestTiming = 'nextMonth';
    if (compact.j === 1) investmentSettings.dpsGrowthMode = 'annualStep';
    if (compact.k === 1) investmentSettings.showQuickEstimate = true;
    if (compact.l === 1) investmentSettings.showSplitGraphs = true;
    if (compact.m === 1) investmentSettings.isResultCompact = true;
    if (compact.n === 0) investmentSettings.isYearlyAreaFillOn = false;
    if (compact.o === 1) investmentSettings.showPortfolioDividendCenter = true;
    if (Number.isFinite(compact.p)) investmentSettings.visibleYearlySeries = decodeVisibleYearlySeriesMask(Number(compact.p));
  }

  const normalized = normalizePersistedAppState({
    scenarios: [
      {
        id: 'shared-tab',
        name: '공유 탭',
        portfolio: {
          tickerProfiles,
          includedTickerIds,
          weightByTickerId,
          fixedByTickerId,
          selectedTickerId
        },
        investmentSettings
      }
    ],
    activeScenarioId: 'shared-tab'
  });

  return normalized.scenarios[0] ?? null;
};

const decodeV3Scenario = (parsed: SharedScenarioEnvelopeV3): PersistedScenarioState | null => {
  if (!isObject(parsed.p)) return null;
  if (!Array.isArray(parsed.p.t)) return null;
  if (!isObject(parsed.i)) return null;

  const tickerProfiles = parsed.p.t
    .map((tuple, index) => {
      if (!Array.isArray(tuple)) return null;
      const [ticker, initialPrice, dividendYield, dividendGrowth, expectedTotalReturn, frequencyCode, name] = tuple;
      if (typeof ticker !== 'string' || !ticker.trim()) return null;
      if (!Number.isFinite(initialPrice) || initialPrice <= 0) return null;
      if (!Number.isFinite(dividendYield) || dividendYield < 0) return null;
      if (!Number.isFinite(dividendGrowth) || dividendGrowth < 0) return null;
      if (!Number.isFinite(expectedTotalReturn)) return null;

      return {
        id: `shared-${index}`,
        ticker: ticker.trim(),
        name: typeof name === 'string' ? name : '',
        initialPrice: Number(initialPrice),
        dividendYield: Number(dividendYield),
        dividendGrowth: Number(dividendGrowth),
        expectedTotalReturn: Number(expectedTotalReturn),
        frequency: decodeFrequency(frequencyCode)
      };
    })
    .filter((profile): profile is NonNullable<typeof profile> => profile !== null);

  const maxIndex = tickerProfiles.length - 1;
  const indexToId = tickerProfiles.map((profile) => profile.id);

  const includedTickerIds = Array.isArray(parsed.p.i)
    ? parsed.p.i
        .filter((index): index is number => Number.isInteger(index) && index >= 0 && index <= maxIndex)
        .map((index) => indexToId[index])
    : indexToId;

  const weightByTickerId = Array.isArray(parsed.p.w)
    ? parsed.p.w.reduce<Record<string, number>>((acc, entry) => {
        if (!Array.isArray(entry) || entry.length < 2) return acc;
        const [index, weight] = entry;
        if (!Number.isInteger(index) || index < 0 || index > maxIndex) return acc;
        if (!Number.isFinite(weight) || weight < 0) return acc;
        acc[indexToId[index]] = Number(weight);
        return acc;
      }, {})
    : {};

  const fixedByTickerId = Array.isArray(parsed.p.f)
    ? parsed.p.f.reduce<Record<string, boolean>>((acc, index) => {
        if (!Number.isInteger(index) || index < 0 || index > maxIndex) return acc;
        acc[indexToId[index]] = true;
        return acc;
      }, {})
    : {};

  const selectedIndexRaw = parsed.p.s;
  const selectedTickerId =
    typeof selectedIndexRaw === 'number' &&
    Number.isInteger(selectedIndexRaw) &&
    selectedIndexRaw >= 0 &&
    selectedIndexRaw <= maxIndex
      ? indexToId[selectedIndexRaw]
      : null;

  const compact = parsed.i;
  const investmentSettings = {
    ...EMPTY_INVESTMENT_SETTINGS,
    initialInvestment: Number.isFinite(compact.a) ? Number(compact.a) : EMPTY_INVESTMENT_SETTINGS.initialInvestment,
    monthlyContribution: Number.isFinite(compact.b) ? Number(compact.b) : EMPTY_INVESTMENT_SETTINGS.monthlyContribution,
    targetMonthlyDividend: Number.isFinite(compact.c) ? Number(compact.c) : EMPTY_INVESTMENT_SETTINGS.targetMonthlyDividend,
    investmentStartDate: typeof compact.d === 'string' && compact.d ? compact.d : EMPTY_INVESTMENT_SETTINGS.investmentStartDate,
    durationYears: Number.isFinite(compact.e) ? Number(compact.e) : EMPTY_INVESTMENT_SETTINGS.durationYears,
    reinvestDividends: compact.f === 1,
    reinvestDividendPercent:
      Number.isFinite(compact.g) ? Number(compact.g) : EMPTY_INVESTMENT_SETTINGS.reinvestDividendPercent,
    taxRate: compact.h === null ? undefined : Number.isFinite(compact.h) ? Number(compact.h) : EMPTY_INVESTMENT_SETTINGS.taxRate,
    reinvestTiming: compact.i === 1 ? 'nextMonth' : 'sameMonth',
    dpsGrowthMode: compact.j === 1 ? 'annualStep' : 'monthlySmooth',
    showQuickEstimate: compact.k === 1,
    showSplitGraphs: compact.l === 1,
    isResultCompact: compact.m === 1,
    isYearlyAreaFillOn: compact.n === 1,
    showPortfolioDividendCenter: compact.o === 1,
    visibleYearlySeries: Number.isFinite(compact.p)
      ? decodeVisibleYearlySeriesMask(Number(compact.p))
      : { ...DEFAULT_VISIBLE_YEARLY_SERIES }
  };

  const normalized = normalizePersistedAppState({
    scenarios: [
      {
        id: 'shared-tab',
        name: '공유 탭',
        portfolio: {
          tickerProfiles,
          includedTickerIds,
          weightByTickerId,
          fixedByTickerId,
          selectedTickerId
        },
        investmentSettings
      }
    ],
    activeScenarioId: 'shared-tab'
  });

  return normalized.scenarios[0] ?? null;
};

export const decodeSharedScenario = (encoded: string): PersistedScenarioState | null => {
  const decodedText = decompressFromEncodedURIComponent(encoded);
  if (!decodedText) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(decodedText);
  } catch {
    return null;
  }

  if (!isObject(parsed)) return null;
  const envelope = parsed as SharedScenarioEnvelope;
  if (Number(envelope.v) === 1 && isObject((parsed as SharedScenarioEnvelopeV1).scenario)) {
    return decodeV1Scenario(parsed as SharedScenarioEnvelopeV1);
  }
  if (Number(envelope.v) === 2 && isObject((parsed as SharedScenarioEnvelopeV2).p)) {
    return decodeV2Scenario(parsed as SharedScenarioEnvelopeV2);
  }
  if (Number(envelope.v) === 3 && isObject((parsed as SharedScenarioEnvelopeV3).p) && isObject((parsed as SharedScenarioEnvelopeV3).i)) {
    return decodeV3Scenario(parsed as SharedScenarioEnvelopeV3);
  }
  return null;
};
