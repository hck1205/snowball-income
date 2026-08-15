import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';
import { EMPTY_INVESTMENT_SETTINGS, normalizePersistedAppState, type PersistedInvestmentSettings, type PersistedScenarioState } from '@/jotai';
import { toDerivedDividendGrowthPercent } from '@/shared/lib/snowball';
import { DEFAULT_ACCOUNT_TYPE } from '@/shared/constants/tax';
import type { Frequency } from '@/shared/types';
import type { PortfolioPersistedState, TickerProfile } from '@/shared/types/snowball';

export const SHARE_SCHEMA_VERSION = 3;
export const SHARE_LENGTH_LIMIT = 4000;

/** 공유 링크로 들어온 시나리오가 사용하는 탭 id. */
export const SHARED_SCENARIO_ID = 'shared-tab';
/** 디코더가 시나리오 이름을 채울 때 쓰는 기본 이름. */
export const SHARED_SCENARIO_DECODED_NAME = '공유 탭';

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
  frequencyCode: 0 | 1 | 2 | 3 | 4,
  name?: string,
  /**
   * 계좌 유형(2026-08-15 추가). **기본값(과세계좌)이면 아예 넣지 않는다** — 그래서 옛 링크와
   * 새 링크가 바이트까지 같고, 링크 길이도 안 늘어난다.
   *
   * 🔴 `name` 이 **조건부**라 자리를 세는 방식이 위험하다(`name` 이 비면 6칸, 있으면 7칸). 그래서
   *    이 칸을 쓸 때는 `name` 자리를 반드시 채운다(빈 문자열이라도). 그러지 않으면 계좌 값이
   *    `name` 자리로 밀려 들어가 **종목 이름이 'isa' 로 열린다.**
   */
  accountType?: 'taxable' | 'isa'
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

/**
 * 주기 ↔ 공유 URL 코드.
 *
 * 🔴 **코드 0~3 의 의미는 영구 고정이다** — 이미 발행된 공유 링크가 그 숫자를 담고 있다.
 * `none`(무배당)은 **뒤에 4 를 덧붙여** 추가했다: 옛 링크는 4 를 담을 수 없으므로 해석이 바뀌지 않고,
 * 옛 코드가 새 링크의 4 를 만나면 폴백(`annual`)으로 읽힌다 — 프리셋 무배당 종목은 배당률도 0 이라
 * 결과가 그대로 0 이지만, **사용자가 배당률을 남긴 채 주기만 `none` 으로 바꾼 링크**라면 구버전
 * 클라이언트에서는 배당이 있는 종목으로 열린다. 이 조합 자체를 만들지 않는 것이 방어선이고
 * (간편 추정도 같은 이유로 지급 0 을 명시적으로 끊는다 — `SnowballQuickEstimate.ts`),
 * 코드 재배치는 그것과 무관하게 **절대 금지**다 — 남의 저장·링크가 다른 종목으로 열린다.
 */
export const encodeFrequency = (frequency: string): 0 | 1 | 2 | 3 | 4 => {
  if (frequency === 'monthly') return 0;
  if (frequency === 'quarterly') return 1;
  if (frequency === 'semiannual') return 2;
  if (frequency === 'none') return 4;
  return 3;
};

export const decodeFrequency = (value: unknown): Frequency => {
  if (value === 0) return 'monthly';
  if (value === 1) return 'quarterly';
  if (value === 2) return 'semiannual';
  if (value === 4) return 'none';
  return 'annual';
};

const DEFAULT_VISIBLE_YEARLY_SERIES = EMPTY_INVESTMENT_SETTINGS.visibleYearlySeries;

export const encodeVisibleYearlySeriesMask = (source: PersistedInvestmentSettings['visibleYearlySeries']): number => {
  return (
    (source.totalContribution ? 1 : 0) |
    (source.assetValue ? 2 : 0) |
    (source.annualDividend ? 4 : 0) |
    (source.monthlyDividend ? 8 : 0) |
    (source.cumulativeDividend ? 16 : 0)
  );
};

export const decodeVisibleYearlySeriesMask = (mask: number): PersistedInvestmentSettings['visibleYearlySeries'] => ({
  totalContribution: Boolean(mask & 1),
  assetValue: Boolean(mask & 2),
  annualDividend: Boolean(mask & 4),
  monthlyDividend: Boolean(mask & 8),
  cumulativeDividend: Boolean(mask & 16)
});

export const toCompactPortfolio = (scenario: PersistedScenarioState): CompactPortfolio => {
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
    /*
     * 🔴 자리를 세는 튜플이라 **뒤 칸을 쓰면 앞 칸을 반드시 채운다.** 계좌 유형을 실을 때만
     *    이름 자리를 강제로 채우고(빈 문자열 허용), 기본값이면 종전과 완전히 같은 모양을 유지한다.
     */
    const hasNonDefaultAccount = profile.accountType !== undefined && profile.accountType !== DEFAULT_ACCOUNT_TYPE;
    if (profile.name.trim() || hasNonDefaultAccount) base.push(profile.name);
    if (hasNonDefaultAccount) base.push(profile.accountType as 'isa');
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

/**
 * v2/v3가 공유하는 압축 포트폴리오 디코더. 인덱스 참조를 `shared-N` id로 되돌린다.
 *
 * 정합 모델 마이그레이션: 기존 공유 URL 은 세 값(dy/dg/etr)이 서로 모순인 채로 인코딩돼 있다.
 * `dividendYield` 와 `expectedTotalReturn` 을 보존하고 `dividendGrowth` 를 재계산한다
 * (저장 데이터 sanitize 와 동일 규칙). **인코딩 포맷은 그대로라 기존 링크가 계속 열린다.**
 */
export const decodeCompactPortfolio = (compact: CompactPortfolio): PortfolioPersistedState => {
  const tickerProfiles = compact.t
    .map((tuple, index): TickerProfile | null => {
      if (!Array.isArray(tuple)) return null;
      const [ticker, initialPrice, dividendYield, dividendGrowth, expectedTotalReturn, frequencyCode, name, accountType] =
        tuple;
      if (typeof ticker !== 'string' || !ticker.trim()) return null;
      if (!Number.isFinite(initialPrice) || initialPrice <= 0) return null;
      if (!Number.isFinite(dividendYield) || dividendYield < 0) return null;
      // 음수 배당 성장률(커버드콜 NAV 침식)을 허용한다. 유한하기만 하면 받는다.
      if (!Number.isFinite(dividendGrowth)) return null;
      if (!Number.isFinite(expectedTotalReturn)) return null;

      return {
        id: `shared-${index}`,
        ticker: ticker.trim(),
        name: typeof name === 'string' ? name : '',
        initialPrice: Number(initialPrice),
        dividendYield: Number(dividendYield),
        dividendGrowth: toDerivedDividendGrowthPercent(Number(expectedTotalReturn), Number(dividendYield)),
        expectedTotalReturn: Number(expectedTotalReturn),
        frequency: decodeFrequency(frequencyCode),
        /* 모르는 값·부재는 전부 기본값이다 — 남의 링크를 못 여는 것보다 낫다. */
        accountType: accountType === 'isa' ? 'isa' : DEFAULT_ACCOUNT_TYPE
      };
    })
    .filter((profile): profile is TickerProfile => profile !== null);

  const maxIndex = tickerProfiles.length - 1;
  const indexToId = tickerProfiles.map((profile) => profile.id);

  const includedTickerIds = Array.isArray(compact.i)
    ? compact.i
        .filter((index): index is number => Number.isInteger(index) && index >= 0 && index <= maxIndex)
        .map((index) => indexToId[index])
    : indexToId;

  const weightByTickerId = Array.isArray(compact.w)
    ? compact.w.reduce<Record<string, number>>((acc, entry) => {
        if (!Array.isArray(entry) || entry.length < 2) return acc;
        const [index, weight] = entry;
        if (!Number.isInteger(index) || index < 0 || index > maxIndex) return acc;
        if (!Number.isFinite(weight) || weight < 0) return acc;
        acc[indexToId[index]] = Number(weight);
        return acc;
      }, {})
    : {};

  const fixedByTickerId = Array.isArray(compact.f)
    ? compact.f.reduce<Record<string, boolean>>((acc, index) => {
        if (!Number.isInteger(index) || index < 0 || index > maxIndex) return acc;
        acc[indexToId[index]] = true;
        return acc;
      }, {})
    : {};

  const selectedIndexRaw = compact.s;
  const selectedTickerId =
    typeof selectedIndexRaw === 'number' &&
    Number.isInteger(selectedIndexRaw) &&
    selectedIndexRaw >= 0 &&
    selectedIndexRaw <= maxIndex
      ? indexToId[selectedIndexRaw]
      : null;

  return {
    tickerProfiles,
    includedTickerIds,
    weightByTickerId,
    fixedByTickerId,
    selectedTickerId
  };
};

/** v2 압축 투자 설정 디코더. 존재하는 필드만 기본값 위에 덮어쓴다. */
export const decodeCompactInvestmentSettingsV2 = (compact: unknown): PersistedInvestmentSettings => {
  const investmentSettings: PersistedInvestmentSettings = {
    ...EMPTY_INVESTMENT_SETTINGS,
    visibleYearlySeries: { ...DEFAULT_VISIBLE_YEARLY_SERIES }
  };

  if (isObject(compact)) {
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

  return investmentSettings;
};

/** v3 압축 투자 설정 디코더. 모든 필드가 존재한다고 보고 결정적으로 되돌린다. */
export const decodeCompactInvestmentSettingsV3 = (compact: CompactInvestmentSettingsV3): PersistedInvestmentSettings => ({
  ...EMPTY_INVESTMENT_SETTINGS,
  initialInvestment: Number.isFinite(compact.a) ? Number(compact.a) : EMPTY_INVESTMENT_SETTINGS.initialInvestment,
  monthlyContribution: Number.isFinite(compact.b) ? Number(compact.b) : EMPTY_INVESTMENT_SETTINGS.monthlyContribution,
  targetMonthlyDividend: Number.isFinite(compact.c) ? Number(compact.c) : EMPTY_INVESTMENT_SETTINGS.targetMonthlyDividend,
  investmentStartDate: typeof compact.d === 'string' && compact.d ? compact.d : EMPTY_INVESTMENT_SETTINGS.investmentStartDate,
  durationYears: Number.isFinite(compact.e) ? Number(compact.e) : EMPTY_INVESTMENT_SETTINGS.durationYears,
  reinvestDividends: compact.f === 1,
  reinvestDividendPercent: Number.isFinite(compact.g) ? Number(compact.g) : EMPTY_INVESTMENT_SETTINGS.reinvestDividendPercent,
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
});

const toSharedScenario = (
  id: string,
  name: string,
  portfolio: PortfolioPersistedState,
  investmentSettings: PersistedInvestmentSettings
): PersistedScenarioState | null => {
  const normalized = normalizePersistedAppState({
    portfolio,
    investmentSettings,
    scenarios: [
      {
        id,
        name,
        portfolio,
        investmentSettings
      }
    ],
    activeScenarioId: id
  });

  return normalized.scenarios[0] ?? null;
};

const decodeV1Scenario = (parsed: SharedScenarioEnvelopeV1): PersistedScenarioState | null => {
  if (!isObject(parsed.scenario)) return null;

  const rawScenario = parsed.scenario;
  const scenarioId =
    typeof rawScenario.id === 'string' && rawScenario.id.trim() ? rawScenario.id.trim() : SHARED_SCENARIO_ID;
  const scenarioName =
    typeof rawScenario.name === 'string' && rawScenario.name.trim() ? rawScenario.name.trim() : SHARED_SCENARIO_DECODED_NAME;

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

  return toSharedScenario(
    SHARED_SCENARIO_ID,
    SHARED_SCENARIO_DECODED_NAME,
    decodeCompactPortfolio(parsed.p),
    decodeCompactInvestmentSettingsV2(parsed.i)
  );
};

const decodeV3Scenario = (parsed: SharedScenarioEnvelopeV3): PersistedScenarioState | null => {
  if (!isObject(parsed.p)) return null;
  if (!Array.isArray(parsed.p.t)) return null;
  if (!isObject(parsed.i)) return null;

  return toSharedScenario(
    SHARED_SCENARIO_ID,
    SHARED_SCENARIO_DECODED_NAME,
    decodeCompactPortfolio(parsed.p),
    decodeCompactInvestmentSettingsV3(parsed.i)
  );
};

/**
 * 공유 코드 디코드 실패 사유. **사용자에게는 결과가 같지만(빈 시나리오) 계측은 갈린다.**
 *  - `malformed`  — 문자열 단계에서 실패. 잘린 링크·손으로 자른 주소·lz-string이 아닌 값.
 *  - `unsupported` — 압축·JSON 은 풀렸지만 봉투가 우리 스키마가 아님(미래 버전·변조·결손).
 */
export type ShareDecodeFailureReason = 'malformed' | 'unsupported';

export type ShareDecodeResult =
  | { ok: true; scenario: PersistedScenarioState }
  | { ok: false; reason: ShareDecodeFailureReason };

/**
 * 공유 코드 → 시나리오. **이 함수가 공유 문자열 파싱의 유일한 경계이고, 절대 던지지 않는다.**
 *
 * 🔴 `decompressFromEncodedURIComponent` 는 순수 함수처럼 생겼지만 **던진다** — lz-string 1.5.0 은
 * 사전에 없는 문자를 만나면 내부 `charAt` 을 undefined 에 호출해 TypeError 를 낸다(실측: `'zz'`·`'z'`·`'zzz'`.
 * 반면 `'!!!not-lz-string!!!'` 처럼 우연히 사전 안에 드는 값은 조용히 null 을 돌려준다 —
 * 그래서 "깨진 코드" 테스트가 있어도 던지는 입력을 안 고르면 이 구멍을 못 본다).
 * 공유 링크는 메신저가 끝을 자르거나 사용자가 일부만 복사하기 쉬운 값이라, 여기서 새어 나간 예외는
 * 렌더 트리 꼭대기(라우터 에러 화면)까지 올라가 **앱 전체를 대체한다**.
 * 실패는 예외가 아니라 **값**으로 돌려주고, 화면은 그 값을 보고 안내를 띄운다.
 */
export const decodeSharedScenarioResult = (encoded: string): ShareDecodeResult => {
  let decodedText: string | null;
  try {
    decodedText = decompressFromEncodedURIComponent(encoded);
  } catch {
    return { ok: false, reason: 'malformed' };
  }
  if (!decodedText) return { ok: false, reason: 'malformed' };

  let parsed: unknown;
  try {
    parsed = JSON.parse(decodedText);
  } catch {
    return { ok: false, reason: 'malformed' };
  }

  if (!isObject(parsed)) return { ok: false, reason: 'unsupported' };
  const envelope = parsed as SharedScenarioEnvelope;

  let scenario: PersistedScenarioState | null = null;
  if (Number(envelope.v) === 1 && isObject((parsed as SharedScenarioEnvelopeV1).scenario)) {
    scenario = decodeV1Scenario(parsed as SharedScenarioEnvelopeV1);
  } else if (Number(envelope.v) === 2 && isObject((parsed as SharedScenarioEnvelopeV2).p)) {
    scenario = decodeV2Scenario(parsed as SharedScenarioEnvelopeV2);
  } else if (
    Number(envelope.v) === 3 &&
    isObject((parsed as SharedScenarioEnvelopeV3).p) &&
    isObject((parsed as SharedScenarioEnvelopeV3).i)
  ) {
    scenario = decodeV3Scenario(parsed as SharedScenarioEnvelopeV3);
  }

  return scenario ? { ok: true, scenario } : { ok: false, reason: 'unsupported' };
};

/** 사유가 필요 없는 소비처(OG 카드 등)용 얇은 래퍼. 실패는 전부 `null`. */
export const decodeSharedScenario = (encoded: string): PersistedScenarioState | null => {
  const result = decodeSharedScenarioResult(encoded);
  return result.ok ? result.scenario : null;
};
