// @vitest-environment node — DOM 을 쓰지 않는 순수 테스트 (기준: vitest.config.ts)
import { describe, expect, it } from 'vitest';
import type { TickerProfile } from '@/shared/types/snowball';
import type { YieldFormValues } from '@/shared/types';
import { runPortfolioSimulation } from '@/shared/lib/snowball';
import { buildNormalizedAllocation, buildSimulation } from '@/pages/Main/utils';
import { defaultYieldFormValues } from '@/shared/lib/snowball';

/**
 * **배당 라우팅 산술 검증 — 손으로 계산한 값과 대조한다.**
 *
 * 🔴 엔진 코드를 베껴 기대값을 만들지 않는다. 그러면 "구현이 구현과 같다"만 확인하고 끝난다.
 *    여기서는 **숫자가 딱 떨어지도록 입력을 고른 뒤**, 사람이 암산할 수 있는 값을 직접 적는다.
 *
 * ## 눈금을 맞춘 입력
 *   A: 주가 1,000 · 배당률 12% · 성장률 0 · **월배당**   → 1주당 연 120, 1회 지급 10
 *   B: 주가 1,000 · 배당률 0  · 성장률 0 · 무배당       → 배당을 받지 않는 목적지
 *   세율 0 · 월 적립 0 · 초기 각 100,000 (= 각 100주)
 *
 * 성장률이 0이라 주가가 1,000 에 고정된다 — 그래서 재투자 1,000원이 정확히 **1주**가 된다.
 */

const ticker = (name: string, dividendYield: number, frequency: YieldFormValues['frequency']) => ({
  ticker: name,
  initialPrice: 1_000,
  dividendYield,
  dividendGrowth: 0,
  expectedTotalReturn: dividendYield,
  frequency
});

const SETTINGS = {
  targetMonthlyDividend: 0,
  investmentStartDate: '2026-01-15',
  durationYears: 1,
  reinvestDividends: true,
  reinvestDividendPercent: 100,
  taxRate: 0,
  reinvestTiming: 'sameMonth' as const,
  dpsGrowthMode: 'monthlySmooth' as const
};

const run = (overrides: { percentA?: number; targetA?: number; taxRate?: number } = {}) =>
  runPortfolioSimulation({
    tickers: [
      {
        ticker: ticker('A', 12, 'monthly'),
        initialInvestment: 100_000,
        monthlyContribution: 0,
        ...(overrides.percentA === undefined ? null : { reinvestPercent: overrides.percentA }),
        ...(overrides.targetA === undefined ? null : { reinvestTargetIndex: overrides.targetA })
      },
      { ticker: ticker('B', 0, 'none'), initialInvestment: 100_000, monthlyContribution: 0 }
    ],
    settings: { ...SETTINGS, ...(overrides.taxRate === undefined ? null : { taxRate: overrides.taxRate }) }
  });

const finalShares = (output: { monthly: { shares: number }[] }) => output.monthly[output.monthly.length - 1].shares;

describe('배당 라우팅 산술 — 손계산 대조', () => {
  it('매달 배당이 1주당 10원이다 (연 120 ÷ 12회)', () => {
    const [a] = run({ targetA: 1 });

    /* 100주 × 10원 = 1,000원. A 는 배당을 B 로 보내므로 주식 수가 늘지 않아 매달 같다. */
    for (const row of a.monthly) {
      expect(row.dividendPaid).toBeCloseTo(1_000, 8);
      expect(row.shares).toBeCloseTo(100, 8);
    }
    expect(a.monthly).toHaveLength(12);
  });

  it('🔴 A 의 배당이 B 를 산다 — 매달 정확히 1주씩, 12개월이면 112주', () => {
    const [a, b] = run({ targetA: 1 });

    /* 1,000원 ÷ 주가 1,000원 = 1주. 목적지 주가로 나눈다는 계약이 여기서 눈에 보인다. */
    b.monthly.forEach((row, index) => {
      expect(row.shares).toBeCloseTo(100 + (index + 1), 8);
    });
    expect(finalShares(b)).toBeCloseTo(112, 8);
    /* 보낸 쪽은 그대로다. */
    expect(finalShares(a)).toBeCloseTo(100, 8);
  });

  it('자기 자신으로 보내면 복리가 붙는다 — 100 × 1.01^12 = 112.6825…', () => {
    const [a, b] = run();

    /* 매달 배당 1%(10원/1,000원)로 주식 수가 늘어난다. */
    expect(finalShares(a)).toBeCloseTo(100 * Math.pow(1.01, 12), 8);
    /* 손대지 않은 B 는 100주 그대로다. */
    expect(finalShares(b)).toBeCloseTo(100, 8);
  });

  it('🔴 라우팅은 총 배당을 늘리지도 줄이지도 않는다 — 옮길 뿐이다', () => {
    const routed = run({ targetA: 1 });
    const self = run();

    /* 첫 달은 아직 보유량이 같으므로 지급액도 같아야 한다. */
    expect(routed[0].monthly[0].dividendPaid).toBeCloseTo(self[0].monthly[0].dividendPaid, 8);
    /* 라우팅한 쪽은 A 가 안 커지므로 누적 배당이 정확히 12,000 이다(1,000 × 12). */
    expect(routed[0].monthly[11].cumulativeDividend).toBeCloseTo(12_000, 6);
  });

  it('비율 50%면 절반만 옮겨간다 — B 는 매달 0.5주', () => {
    const [a, b] = run({ targetA: 1, percentA: 50 });

    expect(finalShares(b)).toBeCloseTo(100 + 0.5 * 12, 8);
    /* 🔴 재투자하지 않은 절반도 **배당으로는 지급된 것**이다 — 누적 배당은 여전히 12,000. */
    expect(a.monthly[11].cumulativeDividend).toBeCloseTo(12_000, 6);
  });

  it('비율 0%면 아무것도 옮기지 않는다', () => {
    const [a, b] = run({ targetA: 1, percentA: 0 });

    expect(finalShares(b)).toBeCloseTo(100, 8);
    expect(finalShares(a)).toBeCloseTo(100, 8);
    expect(a.monthly[11].cumulativeDividend).toBeCloseTo(12_000, 6);
  });

  it('세금이 먼저 빠지고 남은 것만 옮겨간다 — 세율 15%면 매달 0.85주', () => {
    const [a, b] = run({ targetA: 1, taxRate: 15 });

    /* 1,000 × (1 − 0.15) = 850 → 850 ÷ 1,000 = 0.85주 */
    expect(finalShares(b)).toBeCloseTo(100 + 0.85 * 12, 8);
    expect(a.monthly[0].dividendPaid).toBeCloseTo(850, 8);
    expect(a.monthly[0].taxPaid).toBeCloseTo(150, 8);
  });

  it('🔴 목적지의 취득원가에 쌓인다 — 보낸 쪽이 아니라 받은 쪽이다', () => {
    const [a, b] = run({ targetA: 1 });

    /* 12개월 × 1,000원이 B 로 들어갔다. 취득원가 = 초기 100,000 + 재투자 12,000. */
    expect(b.summary.totalCostBasis).toBeCloseTo(112_000, 6);
    /* A 는 아무것도 되사지 않았으므로 초기 투자금 그대로다. */
    expect(a.summary.totalCostBasis).toBeCloseTo(100_000, 6);
  });
});

describe('앱 진입점까지 실제로 닿는가', () => {
  const profiles: TickerProfile[] = [
    { id: 'a', name: '', ...ticker('A', 12, 'monthly') },
    { id: 'b', name: '', ...ticker('B', 0, 'none') }
  ];
  const values: YieldFormValues = {
    ...defaultYieldFormValues,
    ...SETTINGS,
    ticker: 'A',
    initialPrice: 1_000,
    dividendYield: 12,
    dividendGrowth: 0,
    expectedTotalReturn: 12,
    frequency: 'monthly',
    initialInvestment: 200_000,
    monthlyContribution: 0
  };
  const build = (routing: Record<string, unknown> = {}) =>
    buildSimulation({
      isValid: true,
      includedProfiles: profiles,
      normalizedAllocation: buildNormalizedAllocation(profiles, { a: 50, b: 50 }),
      values,
      ...routing
    });

  it('🔴 화면이 부르는 함수(buildSimulation)가 라우팅을 반영한다', () => {
    const self = build();
    const routed = build({ reinvestTargetByTickerId: { a: 'b' } });

    /* 같은 입력에 목적지만 바꿨는데 결과가 같다면 라우팅이 어딘가에서 끊긴 것이다. */
    expect(routed?.summary.finalAssetValue).not.toBeCloseTo(self?.summary.finalAssetValue ?? 0, 2);
  });

  it('종목별 비율도 화면 경로에서 반영된다', () => {
    const full = build();
    const half = build({ reinvestPercentByTickerId: { a: 50 } });

    expect(half?.summary.finalAssetValue).toBeLessThan(full?.summary.finalAssetValue ?? 0);
  });

  it('🔴 합산의 항등식이 라우팅 뒤에도 성립한다', () => {
    const routed = build({ reinvestTargetByTickerId: { a: 'b' } });

    for (const row of routed?.monthly ?? []) {
      expect(row.shares * row.price).toBeCloseTo(row.portfolioValue, 4);
    }
  });
});
