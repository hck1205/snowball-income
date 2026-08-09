// @vitest-environment node — DOM 을 쓰지 않는 순수 테스트 (기준: vitest.config.ts)
import { describe, expect, it } from 'vitest';
import {
  RADAR_MIN_AXES,
  SANKEY_HUB,
  SANKEY_LEFTOVER,
  WATERFALL_LIMIT,
  categoryRadar,
  categorySunburst,
  dailySpending,
  monthWaterfall,
  sankeyFlow,
  spendingYears
} from '@/pages/Ledger/utils';
import type { LedgerEntry } from '@/shared/lib/googleSheets';

const entry = (
  over: Partial<LedgerEntry> & { date: string; kind: LedgerEntry['kind']; amount: number }
): LedgerEntry => ({
  ref: { snapshotId: 's1', rowNumber: 2 },
  category: '식비',
  fixity: 'variable',
  seen: {},
  ...over
});

describe('돈의 흐름 (생키)', () => {
  const month = [
    entry({ date: '2026-08-01', kind: 'income', amount: 3000, category: '근로소득' }),
    entry({ date: '2026-08-02', kind: 'expense', amount: 1000, category: '주거' }),
    entry({ date: '2026-08-03', kind: 'transfer', amount: 500, category: '저축·투자' })
  ];

  it('⭐ 수입원 → 허브 → 나간 곳 + 남은 돈으로 이어진다', () => {
    const flow = sankeyFlow(month, '2026-08');
    const targets = flow.links.filter((link) => link.source === SANKEY_HUB).map((link) => link.target);

    expect(targets).toContain('주거');
    expect(targets).toContain('저축·투자');
    expect(targets).toContain(SANKEY_LEFTOVER);
    expect(flow.links.find((link) => link.target === SANKEY_LEFTOVER)?.value).toBe(1500);
  });

  it('🔴 수입 항목 이름에 표시를 붙인다 — 지출과 이름이 겹치면 생키가 고리를 만든다', () => {
    const flow = sankeyFlow(
      [
        entry({ date: '2026-08-01', kind: 'income', amount: 100, category: '기타' }),
        entry({ date: '2026-08-02', kind: 'expense', amount: 50, category: '기타' })
      ],
      '2026-08'
    );

    expect(flow.nodes.map((node) => node.name)).toContain('기타 (수입)');
    /* 같은 이름이 양쪽에 있으면 고리가 된다 — 그런 링크가 없어야 한다. */
    expect(flow.links.some((link) => link.source === link.target)).toBe(false);
  });

  it('🔴 번 것보다 쓴 달은 남은 돈 마디를 만들지 않고 크기를 알린다', () => {
    const flow = sankeyFlow(
      [
        entry({ date: '2026-08-01', kind: 'income', amount: 100, category: '근로소득' }),
        entry({ date: '2026-08-02', kind: 'expense', amount: 300 })
      ],
      '2026-08'
    );

    expect(flow.links.some((link) => link.target === SANKEY_LEFTOVER)).toBe(false);
    expect(flow.overspent).toBe(200);
  });

  it('수입이 없으면 그릴 원천이 없다', () => {
    expect(sankeyFlow([entry({ date: '2026-08-01', kind: 'expense', amount: 100 })]).links).toHaveLength(0);
  });
});

describe('일별 지출', () => {
  it('🔴 기록이 있는 날만 준다 — 안 쓴 날과 안 적은 날을 0 으로 같게 만들지 않는다', () => {
    const daily = dailySpending([
      entry({ date: '2026-08-01', kind: 'expense', amount: 100 }),
      entry({ date: '2026-08-05', kind: 'expense', amount: 200 })
    ]);

    expect(daily.map((point) => point.date)).toEqual(['2026-08-01', '2026-08-05']);
  });

  it('같은 날 여러 건은 더한다', () => {
    const daily = dailySpending([
      entry({ date: '2026-08-01', kind: 'expense', amount: 100 }),
      entry({ date: '2026-08-01', kind: 'expense', amount: 50 })
    ]);

    expect(daily[0].amount).toBe(150);
  });

  it('기록이 있는 해만 돌려준다', () => {
    const daily = dailySpending([
      entry({ date: '2025-12-31', kind: 'expense', amount: 1 }),
      entry({ date: '2026-01-01', kind: 'expense', amount: 1 })
    ]);

    expect(spendingYears(daily)).toEqual(['2025', '2026']);
  });
});

describe('항목 → 상세항목 (선버스트)', () => {
  it('⭐ 두 층으로 접는다', () => {
    const nodes = categorySunburst([
      entry({ date: '2026-08-01', kind: 'expense', amount: 300, category: '식비', subcategory: '외식' }),
      entry({ date: '2026-08-02', kind: 'expense', amount: 200, category: '식비', subcategory: '배달' })
    ]);

    expect(nodes[0].name).toBe('식비');
    expect(nodes[0].value).toBe(500);
    expect(nodes[0].children?.map((child) => child.name)).toEqual(['외식', '배달']);
  });

  it('🔴 상세항목을 안 적으면 자식을 지어내지 않는다', () => {
    const nodes = categorySunburst([entry({ date: '2026-08-01', kind: 'expense', amount: 100, category: '식비' })]);

    expect(nodes[0].children).toBeUndefined();
    expect(nodes[0].value).toBe(100);
  });
});

describe('폭포', () => {
  const month = [
    entry({ date: '2026-08-01', kind: 'income', amount: 1000, category: '근로소득' }),
    entry({ date: '2026-08-02', kind: 'expense', amount: 300, category: '주거' }),
    entry({ date: '2026-08-03', kind: 'transfer', amount: 200, category: '저축·투자' })
  ];

  it('⭐ 수입에서 시작해 남은 돈으로 끝난다', () => {
    const steps = monthWaterfall(month, '2026-08');

    expect(steps[0].label).toBe('수입');
    expect(steps.at(-1)?.label).toBe('남은 돈');
    expect(steps.at(-1)?.value).toBe(500);
  });

  it('⚠ 이체도 한 칸으로 센다 — 빼면 마지막 남은 돈이 통장 잔액과 안 맞는다', () => {
    const steps = monthWaterfall(month, '2026-08');

    expect(steps.map((step) => step.label)).toContain('저축·투자');
  });

  it('🔴 번 것보다 쓴 달은 받침이 0 이고 값이 음수다', () => {
    const steps = monthWaterfall(
      [
        entry({ date: '2026-08-01', kind: 'income', amount: 100, category: '근로소득' }),
        entry({ date: '2026-08-02', kind: 'expense', amount: 300 })
      ],
      '2026-08'
    );
    const last = steps.at(-1);

    expect(last?.value).toBe(-200);
    expect(last?.base).toBe(0);
  });

  it('항목이 많으면 나머지를 기타 한 칸으로 접는다', () => {
    const many = [
      entry({ date: '2026-08-01', kind: 'income', amount: 10000, category: '근로소득' }),
      ...Array.from({ length: WATERFALL_LIMIT + 3 }, (_unused, index) =>
        entry({ date: '2026-08-02', kind: 'expense', amount: 100 - index, category: `항목${index}` })
      )
    ];
    const steps = monthWaterfall(many, '2026-08');

    /* 수입 + 상위 N + 기타 + 남은 돈 */
    expect(steps).toHaveLength(WATERFALL_LIMIT + 3);
    expect(steps.some((step) => step.label.startsWith('기타'))).toBe(true);
  });

  it('수입이 없으면 그릴 것이 없다', () => {
    expect(monthWaterfall([entry({ date: '2026-08-01', kind: 'expense', amount: 100 })], '2026-08')).toEqual([]);
  });
});

describe('레이더 (이번 달 vs 평소)', () => {
  it('🔴 달이 둘 미만이면 비교할 평소가 없다', () => {
    expect(
      categoryRadar([entry({ date: '2026-08-01', kind: 'expense', amount: 100, category: '식비' })])
    ).toEqual([]);
  });

  it('⭐ 평균에 이번 달을 넣지 않는다 — 넣으면 자기 자신과 비교하게 된다', () => {
    const axes = categoryRadar([
      entry({ date: '2026-06-01', kind: 'expense', amount: 100, category: '식비' }),
      entry({ date: '2026-07-01', kind: 'expense', amount: 300, category: '식비' }),
      entry({ date: '2026-08-01', kind: 'expense', amount: 900, category: '식비' }),
      entry({ date: '2026-06-01', kind: 'expense', amount: 100, category: '주거' }),
      entry({ date: '2026-07-01', kind: 'expense', amount: 100, category: '주거' }),
      entry({ date: '2026-08-01', kind: 'expense', amount: 100, category: '주거' }),
      entry({ date: '2026-06-01', kind: 'expense', amount: 50, category: '교통' }),
      entry({ date: '2026-07-01', kind: 'expense', amount: 50, category: '교통' }),
      entry({ date: '2026-08-01', kind: 'expense', amount: 50, category: '교통' })
    ]);
    const food = axes.find((axis) => axis.label === '식비');

    expect(food?.latest).toBe(900);
    /* (100 + 300) / 2 = 200 — 이번 달 900 을 섞으면 433 이 된다. */
    expect(food?.average).toBe(200);
  });

  it('축이 셋 미만이면 도형이 안 되므로 그리지 않는다', () => {
    const axes = categoryRadar([
      entry({ date: '2026-07-01', kind: 'expense', amount: 100, category: '식비' }),
      entry({ date: '2026-08-01', kind: 'expense', amount: 200, category: '식비' })
    ]);

    expect(axes.length === 0 || axes.length >= RADAR_MIN_AXES).toBe(true);
  });
});
