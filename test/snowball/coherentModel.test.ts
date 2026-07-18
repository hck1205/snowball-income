import type { Frequency, YieldFormValues } from '@/shared/types';
import { defaultYieldFormValues, paymentsPerYearMap, runSimulation, toSimulationInput } from '@/shared/lib/snowball';
import { CURATED_DIVIDEND_UNIVERSE, DIVIDEND_UNIVERSE } from '@/shared/constants';

/**
 * 정합 모델(고든 성장모형) 성질 증명.
 *
 *   priceGrowth = dividendGrowth       → 배당수익률(YoP)이 시간에 대해 불변
 *   dps(t)      = price(t) * dy        → 수익률 표류와 NaN 폭주가 구조적으로 불가능
 *   totalReturn = dy + dg              → 파생 표시값
 */

const buildValues = (overrides: Partial<YieldFormValues> = {}): YieldFormValues => ({
  ...defaultYieldFormValues,
  investmentStartDate: '2026-01-15',
  initialInvestment: 10_000_000,
  monthlyContribution: 0,
  taxRate: 0,
  reinvestDividends: true,
  reinvestDividendPercent: 100,
  reinvestTiming: 'sameMonth',
  dpsGrowthMode: 'monthlySmooth',
  durationYears: 30,
  ...overrides
});

const realizedCagr = (values: YieldFormValues): number => {
  const result = runSimulation(toSimulationInput(values));
  return Math.pow(result.summary.finalAssetValue / values.initialInvestment, 1 / values.durationYears) - 1;
};

/**
 * 100% 재투자 시 실현 CAGR의 닫힌 형태.
 *
 * 배당수익률이 불변이므로 지급 1회당 주식 수가 정확히 (1 + y/n) 배로 늘고, 주가는 매년 (1 + g) 배가 된다.
 *   CAGR = (1 + g) * (1 + y/n)^n - 1
 * 이 값은 산술합 (y + g) 보다 항상 크다 — 차이는 전적으로 **배당 재투자의 복리 효과**(교차항 y*g 포함)다.
 */
const closedFormCagr = (dividendYieldPercent: number, dividendGrowthPercent: number, frequency: Frequency): number => {
  const y = dividendYieldPercent / 100;
  const g = dividendGrowthPercent / 100;
  const n = paymentsPerYearMap[frequency];

  return ((1 + g) * Math.pow(1 + (y / n), n)) - 1;
};

const GRID: Array<{ dividendYield: number; dividendGrowth: number }> = [
  { dividendYield: 0, dividendGrowth: 10 },
  { dividendYield: 0.5, dividendGrowth: 10 },
  { dividendYield: 1.3, dividendGrowth: 8.2 },
  { dividendYield: 3.34, dividendGrowth: 6.66 },
  { dividendYield: 5.5, dividendGrowth: 2.5 },
  { dividendYield: 8, dividendGrowth: 0 },
  { dividendYield: 10, dividendGrowth: -3 },
  { dividendYield: 12, dividendGrowth: -5 }
];

const FREQUENCIES: Frequency[] = ['monthly', 'quarterly', 'semiannual', 'annual'];

describe('정합 모델: 배당수익률 불변 (yield-on-price)', () => {
  it.each(GRID)('dy=$dividendYield / dg=$dividendGrowth — 60년 후 YoP가 초기 배당률과 같다', ({ dividendYield, dividendGrowth }) => {
    const result = runSimulation(
      toSimulationInput(buildValues({ dividendYield, dividendGrowth, durationYears: 60, frequency: 'monthly' }))
    );

    for (const row of result.monthly) {
      expect(row.dividendPerShare / row.price).toBeCloseTo(dividendYield / 100, 12);
    }

    expect(result.quickEstimate.yieldOnPriceAtEnd).toBeCloseTo(dividendYield / 100, 12);
  });

  it('모든 프리셋이 60년 뒤에도 초기 배당률을 유지한다', () => {
    for (const preset of Object.values(DIVIDEND_UNIVERSE)) {
      const values = buildValues({
        ticker: preset.ticker,
        initialPrice: preset.initialPrice,
        dividendYield: preset.dividendYield,
        dividendGrowth: preset.dividendGrowth,
        expectedTotalReturn: preset.expectedTotalReturn,
        frequency: preset.frequency,
        durationYears: 60
      });

      const last = runSimulation(toSimulationInput(values)).monthly.at(-1)!;

      expect(Number.isFinite(last.portfolioValue)).toBe(true);
      expect(last.dividendPerShare / last.price).toBeCloseTo(preset.dividendYield / 100, 10);
    }
  });
});

describe('정합 모델: 실현 CAGR', () => {
  const cases = FREQUENCIES.flatMap((frequency) => GRID.map((point) => ({ ...point, frequency })));

  it.each(cases)(
    'dy=$dividendYield / dg=$dividendGrowth / $frequency — 닫힌 형태와 정확히 일치한다',
    ({ dividendYield, dividendGrowth, frequency }) => {
      const actual = realizedCagr(buildValues({ dividendYield, dividendGrowth, frequency }));

      expect(actual).toBeCloseTo(closedFormCagr(dividendYield, dividendGrowth, frequency), 9);
    }
  );

  /**
   * 고든의 이산 항등식이 정확히 성립하는 조건: 연 1회 지급 + 연 단위 DPS 점프.
   * 이 경우 배당은 연초 주가 기준으로 지급되어 재투자 복리가 끼지 않으므로 CAGR === y + g 다.
   * (annualStep off-by-one 버그가 있었다면 여기서 깨진다.)
   */
  it.each(GRID)('dy=$dividendYield / dg=$dividendGrowth — 연 지급 + annualStep 에서 CAGR === dy + dg', ({ dividendYield, dividendGrowth }) => {
    const actual = realizedCagr(
      buildValues({ dividendYield, dividendGrowth, frequency: 'annual', dpsGrowthMode: 'annualStep' })
    );

    expect(actual * 100).toBeCloseTo(dividendYield + dividendGrowth, 9);
  });

  it('총수익률이 같으면 배당률이 높아도 자산이 더 커지지 않는다 (고배당 착시 제거)', () => {
    const base = { durationYears: 30, frequency: 'monthly' as const };
    const highYield = realizedCagr(buildValues({ ...base, dividendYield: 9, dividendGrowth: -1 }));
    const lowYield = realizedCagr(buildValues({ ...base, dividendYield: 2, dividendGrowth: 6 }));

    // 총수익률 8% 로 같다. 남는 차이는 재투자 복리뿐이고, 순위가 뒤집히지는 않는다.
    expect(Math.abs(highYield - lowYield) * 100).toBeLessThan(0.5);
  });

  it('총수익률이 높은 쪽이 항상 이긴다 (QYLD vs SCHD 역전 해소)', () => {
    const schd = realizedCagr(buildValues({ dividendYield: 3.34, dividendGrowth: 6.66, frequency: 'quarterly' }));
    const qyld = realizedCagr(buildValues({ dividendYield: 10, dividendGrowth: -3, frequency: 'monthly' }));

    expect(schd).toBeGreaterThan(qyld);
  });
});

describe('정합 모델: NaN / 폭주 차단', () => {
  it.each([
    { dividendYield: 60, dividendGrowth: 0 },
    { dividendYield: 100, dividendGrowth: -100 },
    { dividendYield: 0, dividendGrowth: -100 },
    { dividendYield: 99, dividendGrowth: 100 }
  ])('dy=$dividendYield / dg=$dividendGrowth / 60년 — 모든 값이 유한하다', ({ dividendYield, dividendGrowth }) => {
    const result = runSimulation(
      toSimulationInput(
        buildValues({
          dividendYield,
          dividendGrowth,
          durationYears: 60,
          frequency: 'monthly',
          monthlyContribution: 500_000,
          taxRate: 15.4
        })
      )
    );

    for (const row of result.monthly) {
      expect(Number.isFinite(row.price)).toBe(true);
      expect(Number.isFinite(row.dividendPerShare)).toBe(true);
      expect(Number.isFinite(row.portfolioValue)).toBe(true);
      expect(Number.isFinite(row.dividendPaid)).toBe(true);
      expect(row.price).toBeGreaterThan(0);
    }

    expect(Number.isFinite(result.summary.finalAssetValue)).toBe(true);
    expect(Number.isFinite(result.summary.finalAnnualDividend)).toBe(true);
    expect(Number.isFinite(result.quickEstimate.endValue)).toBe(true);
  });
});

describe('간편 추정 vs 정밀 시뮬', () => {
  const REINVEST_MODES = [
    { label: '100%', reinvestDividends: true, reinvestDividendPercent: 100 },
    { label: '50%', reinvestDividends: true, reinvestDividendPercent: 50 },
    { label: 'OFF', reinvestDividends: false, reinvestDividendPercent: 0 }
  ];
  const TICKERS = ['SCHD', 'QYLD', 'JEPI', 'VOO'] as const;

  const cases = TICKERS.flatMap((ticker) => REINVEST_MODES.map((mode) => ({ ticker, ...mode })));

  it.each(cases)('$ticker / 재투자 $label — 자산 오차 5% 이내', ({ ticker, reinvestDividends, reinvestDividendPercent }) => {
    const preset = DIVIDEND_UNIVERSE[ticker];
    const result = runSimulation(
      toSimulationInput(
        buildValues({
          ticker: preset.ticker,
          initialPrice: preset.initialPrice,
          dividendYield: preset.dividendYield,
          dividendGrowth: preset.dividendGrowth,
          expectedTotalReturn: preset.expectedTotalReturn,
          frequency: preset.frequency,
          initialInvestment: 10_000_000,
          monthlyContribution: 500_000,
          durationYears: 30,
          taxRate: 15.4,
          reinvestDividends,
          reinvestDividendPercent
        })
      )
    );

    const assetError = Math.abs(
      (result.quickEstimate.endValue - result.summary.finalAssetValue) / result.summary.finalAssetValue
    );
    const dividendError = Math.abs(
      (result.quickEstimate.annualDividendApprox - result.summary.finalAnnualDividend) / result.summary.finalAnnualDividend
    );

    expect(assetError).toBeLessThan(0.05);
    expect(dividendError).toBeLessThan(0.05);
  });

  it('월 지급 + 당월 재투자 + monthlySmooth 조합에서는 정밀 시뮬과 수학적으로 동일하다', () => {
    for (const mode of REINVEST_MODES) {
      const result = runSimulation(
        toSimulationInput(
          buildValues({
            dividendYield: 10,
            dividendGrowth: -3,
            frequency: 'monthly',
            reinvestTiming: 'sameMonth',
            dpsGrowthMode: 'monthlySmooth',
            initialInvestment: 10_000_000,
            monthlyContribution: 500_000,
            durationYears: 30,
            taxRate: 15.4,
            reinvestDividends: mode.reinvestDividends,
            reinvestDividendPercent: mode.reinvestDividendPercent
          })
        )
      );

      expect(result.quickEstimate.endValue / result.summary.finalAssetValue).toBeCloseTo(1, 9);
    }
  });

  it('재투자를 끄면 간편 추정도 자산을 주가 성장률로만 굴린다 (구버전은 재투자 설정을 무시했다)', () => {
    const off = runSimulation(
      toSimulationInput(
        buildValues({
          dividendYield: 10,
          dividendGrowth: -3,
          frequency: 'monthly',
          initialInvestment: 10_000_000,
          monthlyContribution: 0,
          durationYears: 30,
          taxRate: 0,
          reinvestDividends: false
        })
      )
    );

    expect(off.quickEstimate.endValue).toBeCloseTo(10_000_000 * Math.pow(0.97, 30), 4);
  });
});

describe('프리셋 정합성 불변식', () => {
  it('모든 큐레이션 프리셋이 dividendYield + dividendGrowth === expectedTotalReturn 을 만족한다', () => {
    const violations = Object.values(CURATED_DIVIDEND_UNIVERSE)
      .map((preset) => ({
        ticker: preset.ticker,
        gap: Math.abs((preset.dividendYield + preset.dividendGrowth) - preset.expectedTotalReturn)
      }))
      .filter((row) => row.gap > 1e-9);

    expect(violations).toEqual([]);
  });

  it('시장 데이터 오버레이 후에도 불변식이 유지된다', () => {
    for (const preset of Object.values(DIVIDEND_UNIVERSE)) {
      expect(preset.dividendYield + preset.dividendGrowth).toBeCloseTo(preset.expectedTotalReturn, 9);
    }
  });
});
