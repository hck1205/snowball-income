import { EMPTY_INVESTMENT_SETTINGS, type PersistedInvestmentSettings } from '@/jotai';
import { buildNormalizedAllocation, buildSimulationBundle, getIncludedProfiles } from '@/pages/Main/utils';
import {
  SNOWBALL_REPORT_VERSION,
  buildScenarioSimSummary,
  buildSnowballReport,
  defaultYieldFormValues
} from '@/shared/lib/snowball';
import type { TickerProfile } from '@/shared/types/snowball';

/** 정합 프로필: dividendYield + dividendGrowth === expectedTotalReturn. */
const profile = (
  id: string,
  ticker: string,
  dividendYield: number,
  dividendGrowth: number,
  frequency: TickerProfile['frequency'] = 'quarterly'
): TickerProfile => ({
  id,
  ticker,
  name: '',
  initialPrice: 100,
  dividendYield,
  dividendGrowth,
  expectedTotalReturn: dividendYield + dividendGrowth,
  frequency
});

const schd = profile('t1', 'SCHD', 3.5, 5);
const jepi = profile('t2', 'JEPI', 7.2, 0, 'monthly');
const vig = profile('t3', 'VIG', 1.9, 7.6, 'annual');

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

describe('buildSnowballReport — 앱 화면과 같은 숫자 (리포트가 대시보드와 어긋나면 안 된다)', () => {
  it('단일 티커: 최종 자산·배당·투입원금이 앱 요약과 정확히 일치한다', () => {
    const payload = buildPayload([schd], { t1: 100 });

    const report = buildSnowballReport(payload)!;
    const simulation = appSimulation(payload);

    expect(report).not.toBeNull();
    expect(report.version).toBe(SNOWBALL_REPORT_VERSION);
    expect(report.outcome.finalAssetValue).toBe(simulation.summary.finalAssetValue);
    expect(report.outcome.totalContribution).toBe(simulation.summary.totalContribution);
    expect(report.outcome.cumulativeNetDividend).toBe(simulation.summary.totalNetDividend);
    expect(report.outcome.finalAnnualDividend).toBe(simulation.summary.finalAnnualDividend);
    expect(report.outcome.finalMonthlyAverageDividend).toBe(simulation.summary.finalMonthlyAverageDividend);
    expect(report.taxes.cumulativeDividendTax).toBe(simulation.summary.totalTaxPaid);
    expect(report.taxes.totalCostBasis).toBe(simulation.summary.totalCostBasis);
    expect(report.taxes.estimatedCapitalGainsTax).toBe(simulation.summary.estimatedCapitalGainsTax);
  });

  it('다중 티커 가중 포트폴리오: 앱의 합산 경로와 일치한다', () => {
    const payload = buildPayload([schd, jepi, vig], { t1: 50, t2: 30, t3: 20 });

    const report = buildSnowballReport(payload)!;
    const simulation = appSimulation(payload);

    expect(report.portfolio.tickerCount).toBe(3);
    expect(report.outcome.finalAssetValue).toBeCloseTo(simulation.summary.finalAssetValue, 6);
    expect(report.outcome.finalMonthlyAverageDividend).toBeCloseTo(simulation.summary.finalMonthlyAverageDividend, 6);
    expect(report.taxes.totalCostBasis).toBeCloseTo(simulation.summary.totalCostBasis, 6);
    // 양도세는 종목별 합이 아니라 합산 원가로 1회 계산 (기본공제 인별 1회) — 앱과 같은 규칙.
    expect(report.taxes.estimatedCapitalGainsTax).toBeCloseTo(simulation.summary.estimatedCapitalGainsTax, 6);
    expect(report.taxes.financialIncomeThresholdYear).toBe(simulation.summary.financialIncomeThresholdYear ?? null);
  });

  it('커뮤니티 카드 요약(buildScenarioSimSummary)과 같은 payload에서 같은 숫자를 낸다', () => {
    const payload = buildPayload([schd, jepi], { t1: 60, t2: 40 });

    const report = buildSnowballReport(payload)!;
    const summary = buildScenarioSimSummary(payload)!;

    expect(Math.round(report.outcome.finalAssetValue)).toBe(summary.finalAssetValue);
    expect(Math.round(report.outcome.finalMonthlyAverageDividend)).toBe(summary.finalMonthlyDividend);
    expect(Math.round(report.outcome.totalContribution)).toBe(summary.totalContribution);
    expect(report.target.reachedInYears).toBe(summary.targetReachedInYears);
  });
});

describe('buildSnowballReport — 목표 월배당 (target=0 가드)', () => {
  it('목표 0(미설정)이면 "1년차 달성"을 만들어 내지 않는다', () => {
    // findTargetYear(rows, 0)은 monthlyDividend >= 0 인 첫 행을 즉시 잡아 1년차를 낸다.
    // 리포트는 hasTarget 가드로 그 거짓 달성 문구를 원천 차단해야 한다.
    const report = buildSnowballReport(buildPayload([schd], { t1: 100 }, { targetMonthlyDividend: 0 }))!;

    expect(report.target.hasTarget).toBe(false);
    expect(report.target.reachedInYears).toBeNull();
    expect(report.target.reachedYearLabel).toBeNull();
    expect(report.target.finalProgressRatio).toBeNull();
  });

  it('목표를 달성하면 연도 라벨이 아니라 n년차(1-based)를 준다', () => {
    const payload = buildPayload([schd], { t1: 100 }, { targetMonthlyDividend: 500_000 });

    const report = buildSnowballReport(payload)!;
    const reachedYearLabel = appSimulation(payload).summary.targetMonthDividendReachedYear;

    expect(reachedYearLabel).toBeDefined();
    expect(report.target.hasTarget).toBe(true);
    expect(report.target.reachedYearLabel).toBe(reachedYearLabel);
    // 시작 연도 2024 → 라벨 - 2024 + 1 = 연차
    expect(report.target.reachedInYears).toBe(reachedYearLabel! - 2024 + 1);
    expect(report.target.finalProgressRatio!).toBeGreaterThanOrEqual(1);
  });

  it('기간 내 미달성이면 연차는 null이고 진행률은 1 미만이다', () => {
    const report = buildSnowballReport(
      buildPayload([schd], { t1: 100 }, { targetMonthlyDividend: 999_999_999, durationYears: 5 })
    )!;

    expect(report.target.hasTarget).toBe(true);
    expect(report.target.reachedInYears).toBeNull();
    expect(report.target.finalProgressRatio!).toBeLessThan(1);
  });
});

describe('buildSnowballReport — 포트폴리오 구성', () => {
  it('가중평균 배당률 = Σ(배당률 × 정규화 비중)', () => {
    const report = buildSnowballReport(buildPayload([schd, jepi], { t1: 75, t2: 25 }))!;

    // 3.5 × 0.75 + 7.2 × 0.25 = 4.425
    expect(report.portfolio.weightedAverageDividendYieldPercent).toBeCloseTo(4.425, 10);
    // 5 × 0.75 + 0 × 0.25 = 3.75
    expect(report.portfolio.weightedAverageDividendGrowthPercent).toBeCloseTo(3.75, 10);
    // 총수익률은 정합 모델의 파생값 = dy + dg
    expect(report.portfolio.weightedAverageExpectedTotalReturnPercent).toBeCloseTo(4.425 + 3.75, 10);
  });

  it('가중치 합이 0이면 균등 분배한다 (앱과 동일한 규칙)', () => {
    const report = buildSnowballReport(buildPayload([schd, jepi], { t1: 0, t2: 0 }))!;

    expect(report.portfolio.holdings.map((item) => item.weight)).toEqual([0.5, 0.5]);
    // 3.5 × 0.5 + 7.2 × 0.5 = 5.35
    expect(report.portfolio.weightedAverageDividendYieldPercent).toBeCloseTo(5.35, 10);
  });

  it('종목별 배분금·기여 배당을 담고, 비중 합은 1이다', () => {
    const report = buildSnowballReport(buildPayload([schd, jepi, vig], { t1: 50, t2: 30, t3: 20 }))!;
    const [first] = report.portfolio.holdings;

    expect(report.portfolio.holdings).toHaveLength(3);
    expect(report.portfolio.holdings.reduce((sum, item) => sum + item.weight, 0)).toBeCloseTo(1, 10);
    expect(first.ticker).toBe('SCHD');
    expect(first.allocatedInitialInvestment).toBeCloseTo(10_000_000 * 0.5, 6);
    expect(first.allocatedMonthlyContribution).toBeCloseTo(1_000_000 * 0.5, 6);
    expect(first.expectedTotalReturnPercent).toBeCloseTo(8.5, 10);
    // 종목별 기여 배당의 합 = 포트폴리오 마지막 해 연 배당
    const contributed = report.portfolio.holdings.reduce((sum, item) => sum + item.finalAnnualDividend, 0);
    expect(contributed).toBeCloseTo(report.outcome.finalAnnualDividend, 6);
  });

  it('지급 주기 분포는 실제 존재하는 주기만 정해진 순서로 담는다', () => {
    const report = buildSnowballReport(buildPayload([schd, jepi, vig], { t1: 50, t2: 30, t3: 20 }))!;

    expect(report.portfolio.frequencyMix.map((item) => item.frequency)).toEqual(['monthly', 'quarterly', 'annual']);
    expect(report.portfolio.frequencyMix.map((item) => item.tickerCount)).toEqual([1, 1, 1]);
    const monthlyMix = report.portfolio.frequencyMix.find((item) => item.frequency === 'monthly')!;
    expect(monthlyMix.weight).toBeCloseTo(0.3, 10);
  });
});

describe('buildSnowballReport — 최종 자산 분해와 YoC', () => {
  it('원금 + 재투자 배당 + 시세 평가이익 = 최종 자산 (항등식)', () => {
    const report = buildSnowballReport(buildPayload([schd, jepi], { t1: 60, t2: 40 }))!;
    const { contribution, reinvestedDividend, marketGain } = report.composition;

    expect(contribution + reinvestedDividend + marketGain).toBeCloseTo(report.outcome.finalAssetValue, 6);
    expect(contribution).toBe(report.outcome.totalContribution);
    expect(reinvestedDividend).toBeGreaterThan(0);
  });

  it('재투자를 끄면 재투자 배당 기여분이 0이다', () => {
    const report = buildSnowballReport(buildPayload([schd], { t1: 100 }, { reinvestDividends: false }))!;

    expect(report.composition.reinvestedDividend).toBeCloseTo(0, 6);
    expect(report.taxes.totalCostBasis).toBeCloseTo(report.outcome.totalContribution, 6);
  });

  it('YoC는 투입원금 대비 세후 연 배당이며, 스노우볼에서 시간이 갈수록 오른다', () => {
    const report = buildSnowballReport(buildPayload([schd], { t1: 100 }))!;
    const { firstYearPercent, finalYearPercent, deltaPercentagePoints } = report.yieldOnCost;

    expect(firstYearPercent).not.toBeNull();
    expect(finalYearPercent).not.toBeNull();
    // 정의 고정: 마지막 해 연 배당 / 누적 투입원금 × 100
    expect(finalYearPercent!).toBeCloseTo(
      (report.outcome.finalAnnualDividend / report.outcome.totalContribution) * 100,
      10
    );
    expect(finalYearPercent!).toBeGreaterThan(firstYearPercent!);
    expect(deltaPercentagePoints!).toBeCloseTo(finalYearPercent! - firstYearPercent!, 10);
  });

  it('투입 원금이 0이면 비율 지표는 NaN이 아니라 null이다', () => {
    const report = buildSnowballReport(
      buildPayload([schd], { t1: 100 }, { initialInvestment: 0, monthlyContribution: 0 })
    )!;

    expect(report.outcome.totalContribution).toBe(0);
    expect(report.outcome.dividendToContributionRatio).toBeNull();
    expect(report.outcome.assetToContributionRatio).toBeNull();
    expect(report.yieldOnCost.finalYearPercent).toBeNull();
    expect(report.yieldOnCost.deltaPercentagePoints).toBeNull();
  });
});

describe('buildSnowballReport — 마지막 12개월 배당 캘린더', () => {
  it('길이 12·시간 순이며, 합계가 마지막 해 연 배당과 같다', () => {
    const report = buildSnowballReport(buildPayload([schd], { t1: 100 }))!;
    const calendar = report.finalYearCalendar;

    expect(calendar).toHaveLength(12);
    expect(calendar.reduce((sum, item) => sum + item.amount, 0)).toBeCloseTo(report.outcome.finalAnnualDividend, 6);
    // 2024-01-01 시작 · 20년 → 마지막 12개월은 2043-01 ~ 2043-12
    expect(calendar[0].month).toBe(1);
    expect(calendar[11].month).toBe(12);
  });

  it('분기 배당은 12개월 중 4개월만 채우고, 월배당은 12개월을 전부 채운다', () => {
    const quarterly = buildSnowballReport(buildPayload([schd], { t1: 100 }))!;
    const monthly = buildSnowballReport(buildPayload([jepi], { t2: 100 }))!;

    expect(quarterly.finalYearCalendar.filter((item) => item.amount > 0)).toHaveLength(4);
    expect(monthly.finalYearCalendar.filter((item) => item.amount > 0)).toHaveLength(12);
  });
});

describe('buildSnowballReport — 입력 요약과 방어', () => {
  it('사용자가 입력한 조건을 그대로 되돌려 준다 (세율 미입력은 0%)', () => {
    const report = buildSnowballReport(
      buildPayload([schd], { t1: 100 }, { taxRate: undefined, reinvestDividendPercent: 50 })
    )!;

    expect(report.inputs).toMatchObject({
      initialInvestment: 10_000_000,
      monthlyContribution: 1_000_000,
      durationYears: 20,
      investmentStartDate: '2024-01-01',
      taxRatePercent: 0,
      reinvestDividends: true,
      reinvestDividendPercent: 50,
      targetMonthlyDividend: 2_000_000
    });
    expect(report.taxes.cumulativeDividendTax).toBe(0);
  });

  it('연도별 행은 기간 년수만큼 있고 앱 표와 같은 값이다', () => {
    const payload = buildPayload([schd], { t1: 100 }, { durationYears: 7 });

    const report = buildSnowballReport(payload)!;

    expect(report.yearly).toHaveLength(7);
    expect(report.yearly).toEqual(appSimulation(payload).yearly);
  });

  it('계산 불가 payload는 throw 없이 null', () => {
    expect(buildSnowballReport(null)).toBeNull();
    expect(buildSnowballReport(undefined)).toBeNull();
    expect(buildSnowballReport({})).toBeNull();
    expect(buildSnowballReport('garbage')).toBeNull();
    expect(buildSnowballReport({ portfolio: buildPayload([schd]).portfolio })).toBeNull();
    // 포함된 티커 0개
    const empty = buildPayload([schd], { t1: 100 });
    empty.portfolio.includedTickerIds = [];
    expect(buildSnowballReport(empty)).toBeNull();
    // 엔진 계약 위반 (주가 0 / 무효 날짜)
    expect(buildSnowballReport(buildPayload([{ ...schd, initialPrice: 0 }], { t1: 100 }))).toBeNull();
    expect(buildSnowballReport(buildPayload([schd], { t1: 100 }, { investmentStartDate: '2026-02-31' }))).toBeNull();
  });

  it('가중치가 비유한 값이면 절반짜리 리포트 대신 null을 낸다', () => {
    expect(buildSnowballReport(buildPayload([schd, jepi], { t1: Infinity, t2: 1 }))).toBeNull();
  });

  it('JSON 왕복(공유/저장 payload 경로)을 거쳐도 같은 리포트가 나온다', () => {
    const payload = buildPayload([schd, jepi], { t1: 60, t2: 40 });

    expect(buildSnowballReport(JSON.parse(JSON.stringify(payload)))).toEqual(buildSnowballReport(payload));
  });
});
