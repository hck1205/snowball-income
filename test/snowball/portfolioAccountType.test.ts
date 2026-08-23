// @vitest-environment node — DOM 을 쓰지 않는 순수 테스트 (기준: vitest.config.ts)
import { describe, expect, it } from 'vitest';
import type { TickerProfile } from '@/shared/types/snowball';
import type { YieldFormValues } from '@/shared/types';
import { buildNormalizedAllocation, buildSimulation } from '@/pages/Main/utils';
import { runScenarioPayload } from '@/shared/lib/snowball';
import { defaultYieldFormValues } from '@/shared/lib/snowball';

/**
 * **포트폴리오 경로가 계좌 유형을 엔진에 전달하는가** (2026-08-23 수정).
 *
 * 🔴 이 값은 오랫동안 저장되고, 공유 링크에 실리고, 종목 모달에서 고를 수 있는데 **계산에는 닿지
 *    않았다** — 시뮬레이터에서 ISA 를 골라도 전부 과세계좌로 돌았고 `isaSettlementTax` 는 항상
 *    0 이었다. 타입도 컴파일도 막아 주지 않는 종류(선택 필드)라 테스트로만 지킬 수 있다.
 *
 * ⚠ ISA 는 **국내 상장 종목에만** 고를 수 있다(`accountType.ts`). 그래서 `.KS` 티커로 검증한다.
 */

const koreanProfile = (id: string, accountType?: 'taxable' | 'isa'): TickerProfile => ({
  id,
  ticker: 'TIGER.KS',
  name: '',
  initialPrice: 15_175,
  dividendYield: 5,
  dividendGrowth: 3,
  expectedTotalReturn: 8,
  frequency: 'quarterly',
  ...(accountType ? { accountType } : {})
});

const VALUES: YieldFormValues = {
  ...defaultYieldFormValues,
  initialInvestment: 50_000_000,
  monthlyContribution: 1_000_000,
  targetMonthlyDividend: 2_000_000,
  investmentStartDate: '2026-03-15',
  durationYears: 5,
  reinvestDividends: true,
  reinvestDividendPercent: 100,
  /* 🔴 세율을 비워야 종목의 계좌·상장지에서 파생된다 — 값을 넣으면 그것이 이긴다. */
  taxRate: undefined
};

const runApp = (profiles: TickerProfile[]) =>
  buildSimulation({
    isValid: true,
    includedProfiles: profiles,
    normalizedAllocation: buildNormalizedAllocation(profiles, Object.fromEntries(profiles.map((p) => [p.id, 100 / profiles.length]))),
    values: VALUES
  });

describe('앱 경로 — 계좌 유형이 계산에 반영된다', () => {
  it('ISA 는 지급 시점에 세금을 떼지 않아 자산이 더 커진다', () => {
    const taxable = runApp([koreanProfile('a', 'taxable')]);
    const isa = runApp([koreanProfile('a', 'isa')]);

    expect(isa?.summary.finalAssetValue).toBeGreaterThan(taxable?.summary.finalAssetValue ?? 0);
    /* 지급 시 세금이 0 이므로 누적 원천징수도 0 이다. */
    expect(isa?.summary.totalTaxPaid).toBe(0);
    expect(taxable?.summary.totalTaxPaid).toBeGreaterThan(0);
  });

  it('🔴 ISA 종료 정산세가 실제로 잡힌다 (예전에는 언제나 0 이었다)', () => {
    const isa = runApp([koreanProfile('a', 'isa')]);
    const taxable = runApp([koreanProfile('a', 'taxable')]);

    expect(isa?.summary.isaSettlementTax).toBeGreaterThan(0);
    expect(taxable?.summary.isaSettlementTax).toBe(0);
  });

  it('계좌 유형을 지정하지 않으면 과세계좌와 같다 (기본값 보존)', () => {
    const unspecified = runApp([koreanProfile('a')]);
    const taxable = runApp([koreanProfile('a', 'taxable')]);

    expect(unspecified?.summary).toEqual(taxable?.summary);
  });
});

describe('공유·PDF 경로 — 앱과 같은 답을 낸다', () => {
  const payload = (accountType?: 'taxable' | 'isa') => ({
    portfolio: {
      tickerProfiles: [koreanProfile('a', accountType)],
      includedTickerIds: ['a'],
      weightByTickerId: { a: 100 }
    },
    investmentSettings: {
      initialInvestment: VALUES.initialInvestment,
      monthlyContribution: VALUES.monthlyContribution,
      targetMonthlyDividend: VALUES.targetMonthlyDividend,
      investmentStartDate: VALUES.investmentStartDate,
      durationYears: VALUES.durationYears,
      reinvestDividends: VALUES.reinvestDividends,
      reinvestDividendPercent: VALUES.reinvestDividendPercent,
      reinvestTiming: VALUES.reinvestTiming,
      dpsGrowthMode: VALUES.dpsGrowthMode
    }
  });

  it('🔴 같은 시나리오면 앱 화면과 공유 카드가 같은 자산을 낸다', () => {
    const fromApp = runApp([koreanProfile('a', 'isa')]);
    const fromPayload = runScenarioPayload(payload('isa'));

    expect(fromPayload).not.toBeNull();
    /* 두 경로가 갈리면 같은 링크가 화면과 카드에서 다른 숫자를 낸다 — 둘 다 신뢰를 잃는다. */
    expect(fromPayload?.outputs[0].summary.finalAssetValue).toBeCloseTo(fromApp?.summary.finalAssetValue ?? 0, 4);
    expect(fromPayload?.outputs[0].summary.isaSettlementTax).toBeGreaterThan(0);
  });

  it('과세계좌와 ISA 가 실제로 갈린다', () => {
    const taxable = runScenarioPayload(payload('taxable'));
    const isa = runScenarioPayload(payload('isa'));

    expect(isa?.outputs[0].summary.finalAssetValue).toBeGreaterThan(taxable?.outputs[0].summary.finalAssetValue ?? 0);
  });
});
