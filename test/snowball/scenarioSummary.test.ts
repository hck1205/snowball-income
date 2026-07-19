import { EMPTY_INVESTMENT_SETTINGS, type PersistedInvestmentSettings } from '@/jotai';
import { buildNormalizedAllocation, buildSimulationBundle, getIncludedProfiles } from '@/pages/Main/utils';
import {
  SCENARIO_SIM_SUMMARY_VERSION,
  buildScenarioSimSummary,
  defaultYieldFormValues,
  parseScenarioSimSummary
} from '@/shared/lib/snowball';
import type { TickerProfile } from '@/shared/types/snowball';

/** 정합 프로필: dividendYield + dividendGrowth === expectedTotalReturn. */
const profile = (id: string, ticker: string, dividendYield: number, dividendGrowth: number): TickerProfile => ({
  id,
  ticker,
  name: '',
  initialPrice: 100,
  dividendYield,
  dividendGrowth,
  expectedTotalReturn: dividendYield + dividendGrowth,
  frequency: 'quarterly'
});

const schd = profile('t1', 'SCHD', 3.5, 5);
const jepi = profile('t2', 'JEPI', 7.2, 0);
const vig = profile('t3', 'VIG', 1.9, 7.6);

const buildSettings = (overrides: Partial<PersistedInvestmentSettings> = {}): PersistedInvestmentSettings => ({
  ...EMPTY_INVESTMENT_SETTINGS,
  initialInvestment: 10_000_000,
  monthlyContribution: 1_000_000,
  targetMonthlyDividend: 2_000_000,
  investmentStartDate: '2024-01-01',
  durationYears: 20,
  reinvestDividends: true,
  reinvestDividendPercent: 100,
  taxRate: 15.4,
  ...overrides
});

/** 게시 payload와 같은 형태 (`toPostPayload` 결과 — portfolio + investmentSettings). */
const buildPayload = (
  profiles: TickerProfile[],
  weightByTickerId: Record<string, number> = {},
  settings: Partial<PersistedInvestmentSettings> = {}
) => ({
  portfolio: {
    tickerProfiles: profiles,
    includedTickerIds: profiles.map((item) => item.id),
    weightByTickerId,
    fixedByTickerId: {},
    selectedTickerId: null
  },
  investmentSettings: buildSettings(settings)
});

/** 앱이 화면에 쓰는 것과 같은 경로(buildSimulationBundle)로 대조군 시뮬레이션을 만든다. */
const appSimulation = (payload: ReturnType<typeof buildPayload>) => {
  const includedProfiles = getIncludedProfiles(payload.portfolio.tickerProfiles, payload.portfolio.includedTickerIds);
  const { simulation } = buildSimulationBundle({
    isValid: true,
    includedProfiles,
    normalizedAllocation: buildNormalizedAllocation(includedProfiles, payload.portfolio.weightByTickerId),
    values: { ...defaultYieldFormValues, ...payload.investmentSettings }
  });

  expect(simulation).not.toBeNull();
  return simulation!;
};

describe('buildScenarioSimSummary — 앱 화면과의 숫자 일치 (표기 일치 원칙)', () => {
  it('단일 티커: 앱 요약과 정확히 같은 숫자를 KRW 정수로 저장한다', () => {
    const payload = buildPayload([schd], { t1: 100 });

    const summary = buildScenarioSimSummary(payload);
    const simulation = appSimulation(payload);

    expect(summary).not.toBeNull();
    // 카드가 앱과 다른 숫자를 보여주면 그건 버그다. 같은 엔진을 같은 입력으로 돌려서 대조한다.
    expect(summary?.finalAssetValue).toBe(Math.round(simulation.summary.finalAssetValue));
    expect(summary?.finalMonthlyDividend).toBe(Math.round(simulation.summary.finalMonthlyAverageDividend));
    expect(summary?.totalContribution).toBe(Math.round(simulation.summary.totalContribution));
    expect(summary?.version).toBe(SCENARIO_SIM_SUMMARY_VERSION);
    expect(summary?.durationYears).toBe(20);
    expect(summary?.tickerCount).toBe(1);
    expect(summary?.initialInvestment).toBe(10_000_000);
    expect(summary?.monthlyContribution).toBe(1_000_000);
    expect(summary?.targetMonthlyDividend).toBe(2_000_000);
  });

  it('다중 티커 가중 포트폴리오: 앱의 합산 경로와 일치한다', () => {
    const payload = buildPayload([schd, jepi, vig], { t1: 50, t2: 30, t3: 20 });

    const summary = buildScenarioSimSummary(payload);
    const simulation = appSimulation(payload);

    expect(summary).not.toBeNull();
    expect(summary?.tickerCount).toBe(3);
    expect(summary?.finalAssetValue).toBe(Math.round(simulation.summary.finalAssetValue));
    expect(summary?.finalMonthlyDividend).toBe(Math.round(simulation.summary.finalMonthlyAverageDividend));
    expect(summary?.totalContribution).toBe(Math.round(simulation.summary.totalContribution));
    // 투입 원금 누계 = 초기 + 월 적립 × 240개월 (가중 분할 후 재합산해도 보존되어야 한다)
    expect(summary?.totalContribution).toBe(10_000_000 + 1_000_000 * 240);
  });

  it('가중치 합이 0이면 균등 분배한다 (앱과 동일한 규칙)', () => {
    const payload = buildPayload([schd, jepi], { t1: 0, t2: 0 });

    const summary = buildScenarioSimSummary(payload);
    const simulation = appSimulation(payload);

    expect(summary).not.toBeNull();
    expect(summary?.finalAssetValue).toBe(Math.round(simulation.summary.finalAssetValue));
    expect(summary?.finalMonthlyDividend).toBe(Math.round(simulation.summary.finalMonthlyAverageDividend));
  });
});

describe('buildScenarioSimSummary — 목표 달성 연차 (1-based)', () => {
  it('달성하면 달력 연도 라벨이 아니라 n년차를 준다', () => {
    const payload = buildPayload([schd], { t1: 100 }, { targetMonthlyDividend: 500_000 });

    const summary = buildScenarioSimSummary(payload);
    const simulation = appSimulation(payload);
    const reachedYearLabel = simulation.summary.targetMonthDividendReachedYear;

    expect(reachedYearLabel).toBeDefined();
    // 시작 연도가 2024이므로 라벨 - 2024 + 1 = 연차. 앱 라벨과 같은 해를 가리켜야 한다.
    expect(summary?.targetReachedInYears).toBe(reachedYearLabel! - 2024 + 1);
    expect(summary?.targetReachedInYears).toBeGreaterThanOrEqual(1);
    expect(summary?.targetReachedInYears).toBeLessThanOrEqual(20);
  });

  it('기간 내 미달성이면 null 이다', () => {
    const summary = buildScenarioSimSummary(
      buildPayload([schd], { t1: 100 }, { targetMonthlyDividend: 999_999_999, durationYears: 5 })
    );

    expect(summary).not.toBeNull();
    expect(summary?.targetReachedInYears).toBeNull();
  });
});

describe('buildScenarioSimSummary — 계산 불가 payload 는 throw 없이 null', () => {
  it('구조가 다른 입력을 전부 조용히 거른다', () => {
    expect(buildScenarioSimSummary(null)).toBeNull();
    expect(buildScenarioSimSummary(undefined)).toBeNull();
    expect(buildScenarioSimSummary({})).toBeNull();
    expect(buildScenarioSimSummary('garbage')).toBeNull();
    expect(buildScenarioSimSummary(42)).toBeNull();
    expect(buildScenarioSimSummary({ portfolio: {} })).toBeNull();
    expect(buildScenarioSimSummary({ portfolio: buildPayload([schd]).portfolio })).toBeNull(); // 설정 없음
  });

  it('포함된 티커가 0개면 null', () => {
    const payload = buildPayload([schd], { t1: 100 });
    payload.portfolio.includedTickerIds = [];

    expect(buildScenarioSimSummary(payload)).toBeNull();
  });

  it('투자 설정이 엔진 계약을 어기면 null (무효 날짜/기간 범위 밖)', () => {
    expect(buildScenarioSimSummary(buildPayload([schd], { t1: 100 }, { investmentStartDate: '2026-02-31' }))).toBeNull();
    expect(buildScenarioSimSummary(buildPayload([schd], { t1: 100 }, { durationYears: 0 }))).toBeNull();
    expect(buildScenarioSimSummary(buildPayload([schd], { t1: 100 }, { durationYears: 61 }))).toBeNull();
  });

  it('포함된 티커가 엔진 계약을 어기면(주가 0) null', () => {
    const broken = { ...schd, initialPrice: 0 };

    expect(buildScenarioSimSummary(buildPayload([broken], { t1: 100 }))).toBeNull();
  });

  it('포함되지 않은 티커는 손상돼 있어도 계산을 막지 않는다', () => {
    const payload = buildPayload([schd], { t1: 100 });
    payload.portfolio.tickerProfiles = [schd, { id: 't9', broken: true } as unknown as TickerProfile];

    const summary = buildScenarioSimSummary(payload);

    expect(summary).not.toBeNull();
    expect(summary?.tickerCount).toBe(1);
  });

  it('taxRate 미입력(undefined)은 유효한 입력이다', () => {
    expect(buildScenarioSimSummary(buildPayload([schd], { t1: 100 }, { taxRate: undefined }))).not.toBeNull();
  });

  it('가중치가 비유한 값이면 NaN 이 전파되기 전에 최종 스키마 관문이 null 로 막는다', () => {
    // Infinity / Infinity = NaN → 투자금 NaN → 요약 숫자 NaN. 절반만 맞는 요약을 저장하면 안 된다.
    expect(buildScenarioSimSummary(buildPayload([schd, jepi], { t1: Infinity, t2: 1 }))).toBeNull();
  });
});

describe('buildScenarioSimSummary — 결정성과 극단값', () => {
  it('JSON 직렬화 왕복(게시 payload 경로)을 거쳐도 같은 요약이 나온다', () => {
    const payload = buildPayload([schd, jepi], { t1: 60, t2: 40 });

    const direct = buildScenarioSimSummary(payload);
    const roundTripped = buildScenarioSimSummary(JSON.parse(JSON.stringify(payload)));

    expect(direct).not.toBeNull();
    expect(roundTripped).toEqual(direct);
  });

  it('앱이 허용하는 최대 정합값(배당 50% + 성장 50% × 60년)에서도 유한한 정수만 저장한다', () => {
    // dy + dg = expectedTotalReturn ≤ 100 이 티커 입력 계약이라 (100, 100)은 앱에서 만들 수 없는 입력이다.
    const extreme = profile('t1', 'MAX', 50, 50);
    const summary = buildScenarioSimSummary(
      buildPayload([extreme], { t1: 100 }, { initialInvestment: 100_000_000, monthlyContribution: 10_000_000, durationYears: 60 })
    );

    expect(summary).not.toBeNull();
    expect(Number.isInteger(summary?.finalAssetValue)).toBe(true);
    expect(Number.isInteger(summary?.finalMonthlyDividend)).toBe(true);
    expect(Number.isInteger(summary?.totalContribution)).toBe(true);
    expect(Number.isFinite(summary?.finalAssetValue)).toBe(true);
    expect(summary!.finalAssetValue).toBeGreaterThan(0);
  });
});

describe('parseScenarioSimSummary — jsonb 읽기 검증', () => {
  it('빌드 결과는 그대로 파싱을 통과하고, jsonb 왕복 후에도 같다', () => {
    const summary = buildScenarioSimSummary(buildPayload([schd], { t1: 100 }));

    expect(summary).not.toBeNull();
    expect(parseScenarioSimSummary(JSON.parse(JSON.stringify(summary)))).toEqual(summary);
  });

  it('모르는 버전/모자란 필드/정수 아닌 금액은 null (프리뷰 미렌더 폴백)', () => {
    const summary = buildScenarioSimSummary(buildPayload([schd], { t1: 100 }))!;

    expect(parseScenarioSimSummary({ ...summary, version: 2 })).toBeNull();
    expect(parseScenarioSimSummary({ ...summary, finalAssetValue: undefined })).toBeNull();
    expect(parseScenarioSimSummary({ ...summary, finalAssetValue: 1.5 })).toBeNull();
    expect(parseScenarioSimSummary(null)).toBeNull();
    expect(parseScenarioSimSummary('{}')).toBeNull();
  });
});
