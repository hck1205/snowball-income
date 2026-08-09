// @vitest-environment node — DOM 을 쓰지 않는 순수 테스트 (기준: vitest.config.ts)
import { describe, expect, it } from 'vitest';
import {
  buildInsights,
  expenseByCategory,
  expenseByMethod,
  fixityTrend,
  investmentMix,
  latestHoldingMix,
  monthlyFlows,
  netWorthTrend,
  payerTrend
} from '@/pages/Ledger/utils';
import type { HoldingRecord, InvestmentRecord, LedgerEntry } from '@/shared/lib/googleSheets';
import { LEDGER_PAYER_SHARED } from '@/shared/constants/ledger';

/**
 * 한눈에 보기 — 전 기간 집계.
 *
 * 🔴 여기서 잠그는 것은 **"없는 것을 0 으로 채우지 않는다"** 다. 채우는 순간 그래프가 실제로는
 *    없는 골짜기를 그리고, 사용자는 자기가 안 쓴 달과 안 적은 달을 구분할 수 없게 된다.
 */

const entry = (over: Partial<LedgerEntry> & { date: string; kind: LedgerEntry['kind']; amount: number }): LedgerEntry => ({
  ref: { snapshotId: 's1', rowNumber: 2 },
  category: '식비',
  fixity: 'variable',
  seen: {},
  ...over
});

describe('🔴 월별 현금흐름 — 없는 달을 만들지 않는다', () => {
  it('⭐ 기록이 있는 달만 돌려준다', () => {
    const flows = monthlyFlows([
      entry({ date: '2026-06-01', kind: 'expense', amount: 1000 }),
      /* 7월은 통째로 비어 있다 — 결과에 나오면 안 된다. */
      entry({ date: '2026-08-01', kind: 'expense', amount: 2000 })
    ]);

    expect(flows.map((flow) => flow.month)).toEqual(['2026-06', '2026-08']);
  });

  it('🔴 수입이 0 인 달의 저축률은 null 이다 — 0% 로 적으면 "다 써서 0%"와 구분이 사라진다', () => {
    const flows = monthlyFlows([entry({ date: '2026-08-01', kind: 'expense', amount: 1000 })]);

    expect(flows[0].savingRate).toBeNull();
  });

  it('⭐ 이체는 지출에 들어가지 않는다 — 저축한 돈이 쓴 돈이 되면 저축률이 무너진다', () => {
    const flows = monthlyFlows([
      entry({ date: '2026-08-01', kind: 'income', amount: 3000000 }),
      entry({ date: '2026-08-02', kind: 'expense', amount: 1000000 }),
      entry({ date: '2026-08-03', kind: 'transfer', amount: 500000 })
    ]);

    expect(flows[0].expense).toBe(1000000);
    expect(flows[0].transfer).toBe(500000);
    /* 남은 돈에서도 이체를 빼지 않는다 — 옮긴 돈은 아직 내 돈이다. */
    expect(flows[0].net).toBe(2000000);
    expect(flows[0].savingRate).toBeCloseTo(2 / 3, 6);
  });

  it('🔴 지운 행은 어디에도 안 센다', () => {
    const flows = monthlyFlows([
      entry({ date: '2026-08-01', kind: 'expense', amount: 1000 }),
      entry({ date: '2026-08-02', kind: 'expense', amount: 9999, status: '삭제됨' })
    ]);

    expect(flows[0].expense).toBe(1000);
  });
});

describe('구성', () => {
  it('⭐ 항목별 지출은 큰 것부터, 비율 합이 1 이다', () => {
    const slices = expenseByCategory([
      entry({ date: '2026-08-01', kind: 'expense', amount: 300, category: '식비' }),
      entry({ date: '2026-08-02', kind: 'expense', amount: 700, category: '주거' })
    ]);

    expect(slices.map((slice) => slice.label)).toEqual(['주거', '식비']);
    expect(slices.reduce((total, slice) => total + slice.ratio, 0)).toBeCloseTo(1, 6);
  });

  it('달을 주면 그 달만 센다', () => {
    const slices = expenseByCategory(
      [
        entry({ date: '2026-07-01', kind: 'expense', amount: 500, category: '식비' }),
        entry({ date: '2026-08-01', kind: 'expense', amount: 300, category: '식비' })
      ],
      '2026-08'
    );

    expect(slices[0].value).toBe(300);
  });

  it('🔴 수입·이체는 지출 구성에 안 들어간다', () => {
    const slices = expenseByCategory([
      entry({ date: '2026-08-01', kind: 'income', amount: 5000, category: '근로소득' }),
      entry({ date: '2026-08-02', kind: 'transfer', amount: 5000, category: '저축·투자' })
    ]);

    expect(slices).toHaveLength(0);
  });

  it('결제수단을 안 적은 지출은 미분류로 모인다 — 조용히 버리지 않는다', () => {
    const slices = expenseByMethod([entry({ date: '2026-08-01', kind: 'expense', amount: 100 })]);

    expect(slices).toHaveLength(1);
    expect(slices[0].value).toBe(100);
  });
});

describe('고정비·변동비', () => {
  it('⭐ 달마다 고정비 비중을 낸다', () => {
    const trend = fixityTrend([
      entry({ date: '2026-08-01', kind: 'expense', amount: 600, fixity: 'fixed' }),
      entry({ date: '2026-08-02', kind: 'expense', amount: 400, fixity: 'variable' })
    ]);

    expect(trend[0].fixed).toBe(600);
    expect(trend[0].fixedRatio).toBeCloseTo(0.6, 6);
  });

  it('지출이 없는 달은 비중이 null 이다', () => {
    const trend = fixityTrend([entry({ date: '2026-08-01', kind: 'income', amount: 100 })]);

    expect(trend).toHaveLength(0);
  });
});

describe('주체', () => {
  it('⭐ 공동은 하나의 주체로 모인다 — 겹치지 않게 나눈다', () => {
    const trend = payerTrend(
      [
        entry({ date: '2026-08-01', kind: 'expense', amount: 100, payer: '아내' }),
        entry({ date: '2026-08-02', kind: 'expense', amount: 200 }),
        entry({ date: '2026-08-03', kind: 'expense', amount: 300, payer: LEDGER_PAYER_SHARED })
      ],
      LEDGER_PAYER_SHARED
    );

    expect(trend[0].byPayer.get('아내')).toBe(100);
    expect(trend[0].byPayer.get(LEDGER_PAYER_SHARED)).toBe(500);
  });
});

describe('자산', () => {
  const holding = (over: Partial<HoldingRecord> & { date: string; amount: number }): HoldingRecord => ({
    kind: 'cash',
    name: '현금',
    isDebt: false,
    ...over
  });

  it('🔴 안 적은 달은 추이에 없다 — 0 으로 채우면 바닥을 찍는다', () => {
    const trend = netWorthTrend([holding({ date: '2026-06-30', amount: 100 }), holding({ date: '2026-08-31', amount: 300 })]);

    expect(trend.map((point) => point.month)).toEqual(['2026-06', '2026-08']);
  });

  it('⭐ 자산 구성에 부채를 섞지 않는다 — 섞으면 "부채도 내 자산"으로 읽힌다', () => {
    const mix = latestHoldingMix([
      holding({ date: '2026-08-31', amount: 1000, name: '통장', kind: 'deposit' }),
      holding({ date: '2026-08-31', amount: 400, name: '대출', kind: 'debt', isDebt: true })
    ]);

    expect(mix.month).toBe('2026-08');
    expect(mix.assets.map((slice) => slice.label)).toEqual(['통장']);
    expect(mix.debt).toBe(400);
  });

  it('기록이 없으면 달이 null 이다', () => {
    expect(latestHoldingMix([]).month).toBeNull();
  });
});

describe('투자', () => {
  const holdingOf = (over: Partial<InvestmentRecord> & { ticker: string; shares: number }): InvestmentRecord => ({
    account: '',
    unitCost: 10,
    currency: 'USD',
    ...over
  });

  it('⭐ 통화가 섞이면 나눠 낸다 — USD 와 KRW 를 더한 금액은 뜻이 없다', () => {
    const mix = investmentMix([
      holdingOf({ ticker: 'SCHD', shares: 10 }),
      holdingOf({ ticker: '005930', shares: 10, unitCost: 70000, currency: 'KRW' })
    ]);

    expect(mix.map((group) => group.currency)).toEqual(['KRW', 'USD']);
  });

  it('🔴 매입단가를 안 적은 종목은 뺀다 — 0 으로 세면 없는 종목이 생긴다', () => {
    const mix = investmentMix([holdingOf({ ticker: 'SCHD', shares: 10, unitCost: null })]);

    expect(mix).toHaveLength(0);
  });
});

describe('🔴 인사이트 — 근거가 모자라면 아무 말도 하지 않는다', () => {
  it('⭐ 달이 셋 미만이면 "평균"을 말하지 않는다', () => {
    const flows = monthlyFlows([
      entry({ date: '2026-07-01', kind: 'income', amount: 100 }),
      entry({ date: '2026-08-01', kind: 'income', amount: 100 })
    ]);
    const insights = buildInsights({ flows, fixity: [], netWorth: [] });

    expect(insights.some((insight) => insight.id === 'saving-rate')).toBe(false);
  });

  it('세 달이 모이면 평균 저축률을 말한다', () => {
    const flows = monthlyFlows([
      entry({ date: '2026-06-01', kind: 'income', amount: 100 }),
      entry({ date: '2026-07-01', kind: 'income', amount: 100 }),
      entry({ date: '2026-08-01', kind: 'income', amount: 100 })
    ]);
    const insights = buildInsights({ flows, fixity: [], netWorth: [] });

    expect(insights.find((insight) => insight.id === 'saving-rate')?.text).toContain('100%');
  });

  it('🔴 순자산은 두 점이 있어야 "변했다"를 말한다', () => {
    const one = buildInsights({ flows: [], fixity: [], netWorth: [{ month: '2026-08', netWorth: 100 }] });
    expect(one.some((insight) => insight.id === 'net-worth')).toBe(false);

    const two = buildInsights({
      flows: [],
      fixity: [],
      netWorth: [
        { month: '2026-07', netWorth: 100 },
        { month: '2026-08', netWorth: 300 }
      ]
    });
    expect(two.find((insight) => insight.id === 'net-worth')?.text).toContain('늘었습니다');
  });

  it('🔴 조언하지 않는다 — 관측만 말한다', () => {
    const flows = monthlyFlows([
      entry({ date: '2026-06-01', kind: 'income', amount: 100 }),
      entry({ date: '2026-07-01', kind: 'income', amount: 100 }),
      entry({ date: '2026-08-01', kind: 'income', amount: 100 })
    ]);
    const insights = buildInsights({
      flows,
      fixity: [{ month: '2026-08', fixed: 60, variable: 40, fixedRatio: 0.6 }],
      netWorth: []
    });

    for (const insight of insights) {
      expect(insight.text).not.toMatch(/줄이|늘리세요|추천|권합니다|하세요/);
    }
  });

  it('기록이 아예 없으면 빈 배열이다', () => {
    expect(buildInsights({ flows: [], fixity: [], netWorth: [] })).toEqual([]);
  });
});
