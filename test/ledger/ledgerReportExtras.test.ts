import { describe, expect, it } from 'vitest';
import {
  CATEGORY_TREND_LIMIT,
  buildKpis,
  categoryTrend,
  cumulativeNet,
  holdingKindTrend,
  investmentByAccount,
  monthlyFlows,
  weekdaySpending
} from '@/pages/Ledger/utils';
import type { HoldingRecord, InvestmentRecord, LedgerEntry } from '@/shared/lib/googleSheets';

const entry = (
  over: Partial<LedgerEntry> & { date: string; kind: LedgerEntry['kind']; amount: number }
): LedgerEntry => ({
  ref: { snapshotId: 's1', rowNumber: 2 },
  category: '식비',
  fixity: 'variable',
  seen: {},
  ...over
});

describe('누적 순현금', () => {
  it('⭐ 달마다 남은 돈을 쌓는다 — 한 달만 나빴는지 계속 새는지는 누계로만 보인다', () => {
    const flows = monthlyFlows([
      entry({ date: '2026-06-01', kind: 'income', amount: 300 }),
      entry({ date: '2026-06-02', kind: 'expense', amount: 100 }),
      entry({ date: '2026-07-01', kind: 'expense', amount: 500 })
    ]);

    expect(cumulativeNet(flows).map((point) => point.cumulative)).toEqual([200, -300]);
  });
});

describe('항목별 추이', () => {
  const many = Array.from({ length: 8 }, (_unused, index) =>
    entry({ date: '2026-08-01', kind: 'expense', amount: (8 - index) * 100, category: `항목${index}` })
  );

  it('⭐ 상위 다섯만 세우고 나머지는 기타로 접는다 — 여덟 줄은 읽을 수 없다', () => {
    const trend = categoryTrend(many);
    const labels = trend.series.map((item) => item.label);

    expect(labels).toHaveLength(CATEGORY_TREND_LIMIT + 1);
    expect(labels.at(-1)).toBe('기타');
  });

  it('🔴 접은 것을 버리지 않는다 — 버리면 달별 합이 실제 지출과 안 맞는다', () => {
    const trend = categoryTrend(many);
    const drawn = trend.series.reduce((total, item) => total + item.values[0], 0);
    const actual = many.reduce((total, item) => total + item.amount, 0);

    expect(drawn).toBe(actual);
  });

  it('달 순서가 series 값의 순서와 같다', () => {
    const trend = categoryTrend([
      entry({ date: '2026-07-01', kind: 'expense', amount: 100, category: '식비' }),
      entry({ date: '2026-08-01', kind: 'expense', amount: 200, category: '식비' })
    ]);

    expect(trend.months).toEqual(['2026-07', '2026-08']);
    expect(trend.series[0].values).toEqual([100, 200]);
  });
});

describe('🔴 요일별 — 합계가 아니라 평균으로 비교한다', () => {
  it('⭐ 요일마다 날 수가 달라도 왜곡되지 않는다', () => {
    /* 월요일은 이틀에 걸쳐 200, 화요일은 하루에 150 — 합계로는 월요일이 크지만 평균은 화요일이 크다. */
    const spending = weekdaySpending([
      entry({ date: '2026-08-03', kind: 'expense', amount: 100 }),
      entry({ date: '2026-08-10', kind: 'expense', amount: 100 }),
      entry({ date: '2026-08-04', kind: 'expense', amount: 150 })
    ]);

    const monday = spending.find((point) => point.label === '월');
    const tuesday = spending.find((point) => point.label === '화');

    expect(monday?.total).toBe(200);
    expect(monday?.days).toBe(2);
    expect(monday?.average).toBe(100);
    expect(tuesday?.average).toBe(150);
  });

  it('일곱 요일이 언제나 있다 — 빈 요일이 사라지면 축이 흔들린다', () => {
    expect(weekdaySpending([])).toHaveLength(7);
  });

  it('하루에 여러 건이 있어도 그 날은 하루로 센다', () => {
    const spending = weekdaySpending([
      entry({ date: '2026-08-03', kind: 'expense', amount: 100 }),
      entry({ date: '2026-08-03', kind: 'expense', amount: 100 })
    ]);

    expect(spending.find((point) => point.label === '월')?.days).toBe(1);
  });
});

describe('자산 종류별 추이', () => {
  const holding = (over: Partial<HoldingRecord> & { date: string; amount: number }): HoldingRecord => ({
    kind: 'cash',
    name: '현금',
    isDebt: false,
    ...over
  });
  const label = (kind: HoldingRecord['kind']) => kind;

  it('🔴 부채를 쌓지 않는다 — 순자산 선이 따로 있고, 섞으면 질문이 흐려진다', () => {
    const trend = holdingKindTrend(
      [
        holding({ date: '2026-08-31', amount: 1000, kind: 'deposit' }),
        holding({ date: '2026-08-31', amount: 400, kind: 'debt', isDebt: true })
      ],
      label
    );

    expect(trend.series.map((item) => item.label)).toEqual(['deposit']);
  });

  it('적지 않은 달은 없다', () => {
    const trend = holdingKindTrend(
      [holding({ date: '2026-06-30', amount: 100 }), holding({ date: '2026-08-31', amount: 200 })],
      label
    );

    expect(trend.months).toEqual(['2026-06', '2026-08']);
  });
});

describe('계좌별 투자', () => {
  const record = (over: Partial<InvestmentRecord> & { ticker: string; shares: number }): InvestmentRecord => ({
    account: '',
    unitCost: 10,
    currency: 'USD',
    ...over
  });

  it('계좌를 안 적으면 한 자리로 모인다 — 조용히 버리지 않는다', () => {
    const groups = investmentByAccount([record({ ticker: 'SCHD', shares: 10 })]);

    expect(groups[0].slices[0].label).toBe('계좌 미기재');
  });

  it('🔴 통화가 섞이면 나눈다', () => {
    const groups = investmentByAccount([
      record({ ticker: 'SCHD', shares: 10, account: 'ISA' }),
      record({ ticker: '005930', shares: 10, unitCost: 70000, currency: 'KRW', account: '일반' })
    ]);

    expect(groups.map((group) => group.currency)).toEqual(['KRW', 'USD']);
  });
});

describe('🔴 요약 타일 — 낼 수 없는 값은 null 이다', () => {
  it('⭐ 자산을 안 적었으면 순자산이 0 이 아니라 없음이다', () => {
    const kpis = buildKpis({ flows: [], fixity: [], netWorth: [] });
    const netWorth = kpis.find((kpi) => kpi.id === 'net-worth');

    expect(netWorth?.value).toBeNull();
    expect(netWorth?.note).toContain('자산 탭');
  });

  it('⭐ 수입이 없는 달의 저축률도 없음이다', () => {
    const flows = monthlyFlows([entry({ date: '2026-08-01', kind: 'expense', amount: 100 })]);
    const kpis = buildKpis({ flows, fixity: [], netWorth: [] });

    expect(kpis.find((kpi) => kpi.id === 'saving-rate')?.value).toBeNull();
  });

  it('월평균 지출은 지출이 있는 달만 나눈다 — 0원인 달을 섞으면 평균이 낮아진다', () => {
    const flows = monthlyFlows([
      entry({ date: '2026-07-01', kind: 'income', amount: 1000 }),
      entry({ date: '2026-08-01', kind: 'expense', amount: 300 })
    ]);
    const kpis = buildKpis({ flows, fixity: [], netWorth: [] });

    expect(kpis.find((kpi) => kpi.id === 'average-expense')?.value).toBe(300);
  });

  it('타일은 넷이다', () => {
    expect(buildKpis({ flows: [], fixity: [], netWorth: [] })).toHaveLength(4);
  });
});
