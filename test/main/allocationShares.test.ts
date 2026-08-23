// @vitest-environment node — DOM 을 쓰지 않는 순수 테스트 (기준: vitest.config.ts)
import { describe, expect, it } from 'vitest';
import type { TickerProfile } from '@/shared/types/snowball';
import {
  applyTickerAmount,
  buildAllocationHoldings,
  buildAllocationPercentMaps,
  buildNormalizedAllocation,
  toAmountFromShares,
  toSharesFromAmount
} from '@/pages/Main/utils';
import { computeHoldingMonthlyDividend } from '@/shared/lib/snowball';

const makeProfile = (id: string, ticker: string, initialPrice: number, dividendYield = 0): TickerProfile => ({
  id,
  ticker,
  name: '',
  initialPrice,
  dividendYield,
  dividendGrowth: 0,
  expectedTotalReturn: dividendYield,
  frequency: 'quarterly'
});

describe('주식 수 ↔ 금액 환산', () => {
  it('주가로 곱하고 나누어 왕복한다', () => {
    expect(toAmountFromShares(120, 100_000)).toBe(12_000_000);
    expect(toSharesFromAmount(12_000_000, 100_000)).toBe(120);
  });

  it('주가가 0이면 나눌 수 없으므로 0주다', () => {
    expect(toSharesFromAmount(1_000_000, 0)).toBe(0);
  });

  it('음수·비유한값은 0으로 접는다', () => {
    expect(toAmountFromShares(-5, 100)).toBe(0);
    expect(toAmountFromShares(Number.NaN, 100)).toBe(0);
    expect(toSharesFromAmount(Number.POSITIVE_INFINITY, 100)).toBe(0);
  });
});

describe('applyTickerAmount', () => {
  const includedIds = ['a', 'b'];

  it('다른 종목 금액을 그대로 두고 총액이 따라 움직인다', () => {
    // a 600만 / b 400만 (총 1,000만) 에서 a 만 1,200만으로.
    const next = applyTickerAmount({
      targetId: 'a',
      nextAmount: 12_000_000,
      includedIds,
      percentExactById: { a: 60, b: 40 },
      totalAmount: 10_000_000
    });

    expect(next.totalAmount).toBe(16_000_000);
    expect(next.percentById.a).toBeCloseTo(75, 10);
    expect(next.percentById.b).toBeCloseTo(25, 10);
  });

  it('b 의 금액은 건드리지 않는다 — 절대량 입력의 뜻이다', () => {
    const next = applyTickerAmount({
      targetId: 'a',
      nextAmount: 12_000_000,
      includedIds,
      percentExactById: { a: 60, b: 40 },
      totalAmount: 10_000_000
    });

    expect((next.totalAmount * next.percentById.b) / 100).toBeCloseTo(4_000_000, 6);
  });

  it('비중 합은 언제나 100 이다', () => {
    const next = applyTickerAmount({
      targetId: 'b',
      nextAmount: 1,
      includedIds,
      percentExactById: { a: 60, b: 40 },
      totalAmount: 10_000_000
    });

    expect(Object.values(next.percentById).reduce((sum, value) => sum + value, 0)).toBeCloseTo(100, 10);
  });

  it('고정 핀이 걸린 종목도 자기 절대량은 바꿀 수 있다 (핀은 슬라이더 규칙이다)', () => {
    // 이 함수는 fixedByTickerId 를 아예 받지 않는다 — 그 사실을 계약으로 고정한다.
    const next = applyTickerAmount({
      targetId: 'a',
      nextAmount: 20_000_000,
      includedIds,
      percentExactById: { a: 60, b: 40 },
      totalAmount: 10_000_000
    });

    expect(next.percentById.a).toBeGreaterThan(60);
  });

  it('총액이 0이 되면 비중을 전부 0으로 돌려준다', () => {
    const next = applyTickerAmount({
      targetId: 'a',
      nextAmount: 0,
      includedIds,
      percentExactById: { a: 100, b: 0 },
      totalAmount: 10_000_000
    });

    expect(next.totalAmount).toBe(0);
    expect(next.percentById).toEqual({ a: 0, b: 0 });
  });

  it('편입되지 않은 종목 id 로는 아무것도 바꾸지 않는다', () => {
    const next = applyTickerAmount({
      targetId: 'ghost',
      nextAmount: 99_000_000,
      includedIds,
      percentExactById: { a: 60, b: 40 },
      totalAmount: 10_000_000
    });

    expect(next.totalAmount).toBeCloseTo(10_000_000, 6);
    expect(next.percentById.a).toBeCloseTo(60, 10);
  });

  it('음수 금액은 0으로 접는다', () => {
    const next = applyTickerAmount({
      targetId: 'a',
      nextAmount: -5_000_000,
      includedIds,
      percentExactById: { a: 60, b: 40 },
      totalAmount: 10_000_000
    });

    expect(next.percentById.a).toBe(0);
    expect(next.totalAmount).toBeCloseTo(4_000_000, 6);
  });
});

/*
 * ⚠ 아래 산술 블록은 `fxRate: 1` 로 고정한다. 여기서 보는 것은 **배분 산술**이지 통화가 아니다 —
 *   환율 1 이면 달러 주가가 곧 원 주가라 숫자가 사람이 검산할 수 있는 모양으로 남는다.
 *   통화 환산 자체는 바로 아래 'buildAllocationHoldings — 통화 환산' 블록이 본다.
 */
describe('buildAllocationHoldings', () => {
  const profiles = [makeProfile('a', 'SCHD', 100_000, 3.5), makeProfile('b', 'JEPI', 50_000, 7)];

  it('초기 투자금과 비중을 주식 수·금액으로 되읽는다', () => {
    const holdings = buildAllocationHoldings({
      normalizedAllocation: buildNormalizedAllocation(profiles, { a: 60, b: 40 }),
      initialInvestment: 10_000_000,
      fxRate: 1
    });

    expect(holdings.byTickerId.a.amount).toBeCloseTo(6_000_000, 6);
    expect(holdings.byTickerId.a.shares).toBeCloseTo(60, 10);
    expect(holdings.byTickerId.b.shares).toBeCloseTo(80, 10);
    expect(holdings.totalAmount).toBeCloseTo(10_000_000, 6);
  });

  it('월 배당은 엔진과 같은 함수로 낸다 — 화면이 두 번째 구현을 갖지 않는다', () => {
    const holdings = buildAllocationHoldings({
      normalizedAllocation: buildNormalizedAllocation(profiles, { a: 100, b: 0 }),
      initialInvestment: 10_000_000,
      fxRate: 1
    });

    const expected = computeHoldingMonthlyDividend({
      ticker: 'SCHD',
      shares: 100,
      price: 100_000,
      dividendYield: 3.5
    });

    expect(holdings.byTickerId.a.monthlyDividend).toBeCloseTo(expected, 8);
    expect(holdings.totalMonthlyDividend).toBeCloseTo(expected, 8);
  });

  it('사용자 세율 override 를 그대로 쓴다 (0 은 미입력이 아니다)', () => {
    const withZeroTax = buildAllocationHoldings({
      normalizedAllocation: buildNormalizedAllocation([profiles[0]], { a: 100 }),
      initialInvestment: 10_000_000,
      taxRate: 0,
      fxRate: 1
    });
    const withDefaultTax = buildAllocationHoldings({
      normalizedAllocation: buildNormalizedAllocation([profiles[0]], { a: 100 }),
      initialInvestment: 10_000_000,
      fxRate: 1
    });

    expect(withZeroTax.byTickerId.a.monthlyDividend).toBeGreaterThan(withDefaultTax.byTickerId.a.monthlyDividend);
  });
});

describe('주식 수 입력 ↔ 배분 왕복', () => {
  it('입력한 주식 수가 그대로 되읽힌다', () => {
    const profiles = [makeProfile('a', 'SCHD', 100_000), makeProfile('b', 'JEPI', 50_000)];
    const percentExactById = { a: 60, b: 40 };

    const applied = applyTickerAmount({
      targetId: 'a',
      nextAmount: toAmountFromShares(137, 100_000),
      includedIds: ['a', 'b'],
      percentExactById,
      totalAmount: 10_000_000
    });

    const holdings = buildAllocationHoldings({
      normalizedAllocation: buildNormalizedAllocation(profiles, applied.percentById),
      initialInvestment: applied.totalAmount,
      fxRate: 1
    });

    expect(holdings.byTickerId.a.shares).toBeCloseTo(137, 8);
    // 건드리지 않은 종목은 주식 수까지 그대로다 (400만 / 5만 = 80주).
    expect(holdings.byTickerId.b.shares).toBeCloseTo(80, 8);
  });
});

describe('buildAllocationHoldings — 통화 환산', () => {
  /* 사용자 신고(2026-08-23): QQQM·SCHD 를 6000주씩 넣었는데 초기 보유가 200만원으로 잡혔다. */
  const qqqm = makeProfile('a', 'QQQM', 302.34, 0.43);
  const korea = makeProfile('b', 'TIGER.KS', 15_175, 3.5);

  it('미국 상장 종목의 달러 주가에 환율을 곱해 주식 수를 낸다', () => {
    const holdings = buildAllocationHoldings({
      normalizedAllocation: buildNormalizedAllocation([qqqm], { a: 100 }),
      initialInvestment: 2_521_515_600,
      fxRate: 1_390
    });

    // 환산 전이라면 같은 금액이 8,340,000주로 잡혔다(1390배 어긋남).
    expect(holdings.byTickerId.a.shares).toBeCloseTo(6000, 6);
    expect(holdings.usesFxRate).toBe(true);
    expect(holdings.hasUnpricedShares).toBe(false);
  });

  it('국내 상장 종목은 환율을 곱하지 않는다', () => {
    const holdings = buildAllocationHoldings({
      normalizedAllocation: buildNormalizedAllocation([korea], { b: 100 }),
      initialInvestment: 15_175 * 6000,
      fxRate: 1_390
    });

    expect(holdings.byTickerId.b.shares).toBeCloseTo(6000, 6);
    expect(holdings.usesFxRate).toBe(false);
  });

  it('환율이 없으면 미국 상장 종목의 주식 수는 null 이다 — 0주로 지어내지 않는다', () => {
    const holdings = buildAllocationHoldings({
      normalizedAllocation: buildNormalizedAllocation([qqqm], { a: 100 }),
      initialInvestment: 10_000_000,
      fxRate: null
    });

    expect(holdings.byTickerId.a.shares).toBeNull();
    expect(holdings.hasUnpricedShares).toBe(true);
  });

  it('🔴 금액과 월 배당은 환율에 흔들리지 않는다 — 움직이는 것은 주식 수뿐이다', () => {
    const allocation = buildNormalizedAllocation([qqqm], { a: 100 });
    const withRate = buildAllocationHoldings({ normalizedAllocation: allocation, initialInvestment: 10_000_000, fxRate: 1_390 });
    const withoutRate = buildAllocationHoldings({ normalizedAllocation: allocation, initialInvestment: 10_000_000, fxRate: null });
    const otherRate = buildAllocationHoldings({ normalizedAllocation: allocation, initialInvestment: 10_000_000, fxRate: 900 });

    expect(withRate.totalAmount).toBeCloseTo(withoutRate.totalAmount, 6);
    expect(withRate.totalMonthlyDividend).toBeCloseTo(withoutRate.totalMonthlyDividend, 6);
    expect(withRate.totalMonthlyDividend).toBeCloseTo(otherRate.totalMonthlyDividend, 6);
    // 주식 수만 갈린다.
    expect(withRate.byTickerId.a.shares).not.toBeCloseTo(otherRate.byTickerId.a.shares ?? 0, 2);
  });
});

describe('정밀도 — 소수 둘째 자리 (2026-08-23 사용자 지시)', () => {
  it('금액에 부동소수 꼬리를 남기지 않는다 — 초기 투자금 입력창에 그대로 보이는 값이다', () => {
    // 5000 × 31.61 × 1383.9 = 218725395.00000003 (되곱하면 꼬리가 붙는다)
    const next = applyTickerAmount({
      targetId: 'a',
      nextAmount: 5000 * 31.61 * 1383.9,
      includedIds: ['a'],
      percentExactById: { a: 100 },
      totalAmount: 0
    });

    expect(next.totalAmount).toBe(218_725_395);
    expect(String(next.totalAmount)).not.toMatch(/\.\d{3,}/);
  });

  it('소수 둘째 자리까지는 지킨다 (원 단위로 내림하지 않는다)', () => {
    const next = applyTickerAmount({
      targetId: 'a',
      nextAmount: 1_234.567,
      includedIds: ['a'],
      percentExactById: { a: 100 },
      totalAmount: 0
    });

    expect(next.totalAmount).toBe(1_234.57);
  });

  it('편집을 반복해도 건드리지 않은 종목의 주수가 흔들리지 않는다', () => {
    const profiles = [makeProfile('a', 'SCHD', 31.61), makeProfile('b', 'QQQ', 430)];
    const unitOf = (price: number) => price * 1_383.9;
    let total = 0;
    let weights: Record<string, number> = { a: 50, b: 50 };

    const type = (id: 'a' | 'b', shares: number, price: number) => {
      const alloc = buildNormalizedAllocation(profiles, weights);
      const { allocationPercentExactByTickerId } = buildAllocationPercentMaps(alloc);
      const next = applyTickerAmount({
        targetId: id,
        nextAmount: toAmountFromShares(shares, unitOf(price)),
        includedIds: ['a', 'b'],
        percentExactById: allocationPercentExactByTickerId,
        totalAmount: total
      });
      total = next.totalAmount;
      weights = { ...weights, ...next.percentById };
    };

    type('a', 5000, 31.61);
    type('b', 1234.5, 430);
    type('a', 777.77, 31.61);
    type('a', 8000, 31.61);

    const holdings = buildAllocationHoldings({
      normalizedAllocation: buildNormalizedAllocation(profiles, weights),
      initialInvestment: total,
      fxRate: 1_383.9
    });

    // 표시 정밀도(소수 둘째 자리)에서 정확히 되살아난다.
    expect(Number((holdings.byTickerId.a.shares ?? 0).toFixed(2))).toBe(8000);
    expect(Number((holdings.byTickerId.b.shares ?? 0).toFixed(2))).toBe(1234.5);
  });
});
