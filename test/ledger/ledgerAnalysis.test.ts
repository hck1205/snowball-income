import { describe, expect, it } from 'vitest';
import type { LedgerEntry } from '@/shared/lib/googleSheets';
import {
  UNCLASSIFIED_LABEL,
  buildCategoryPivot,
  hasMultiplePayers,
  monthlyCashFlow,
  splitByFixity,
  topSpending,
  totalsByMethod,
  totalsByPayer
} from '@/pages/Ledger/utils';

/**
 * P4·P5 분석 집계.
 *
 * 이 파일이 지키는 것은 하나로 요약된다: **이체는 지출이 아니다.** 분석한 시트들이 저축을 지출
 * 항목에 넣어 지출 합계가 부풀고 저축률이 무너져 있었고, v2 가 그것을 바로잡는 근거가 여기다.
 * 집계 함수마다 그 규칙을 따로 잠근다 — 한 함수만 `else` 로 뭉뚱그려도 화면의 숫자가 갈린다.
 */

let seq = 0;
const entry = (overrides: Partial<LedgerEntry> = {}): LedgerEntry => {
  seq += 1;
  return {
    ref: { snapshotId: 'snap-1', rowNumber: seq },
    date: '2026-08-03',
    kind: 'expense',
    amount: 10_000,
    category: '식비',
    fixity: 'variable',
    seen: {},
    ...overrides
  };
};

describe('항목 × 월 피벗', () => {
  const entries = [
    entry({ date: '2026-07-05', category: '식비', amount: 30_000 }),
    entry({ date: '2026-08-05', category: '식비', amount: 20_000 }),
    entry({ date: '2026-08-06', category: '주거', amount: 700_000 })
  ];

  it('월이 오름차순으로 온다 (표의 열 순서)', () => {
    expect(buildCategoryPivot(entries).months).toEqual(['2026-07', '2026-08']);
  });

  it('큰 항목이 위에 온다', () => {
    expect(buildCategoryPivot(entries).rows[0].label).toBe('주거');
  });

  it('🔴 값이 없는 달도 0 으로 채운다 (열이 비면 차트 x축이 달마다 달라진다)', () => {
    const housing = buildCategoryPivot(entries).rows.find((row) => row.label === '주거');

    expect(housing?.cells).toHaveLength(2);
    expect(housing?.cells[0]).toEqual({ monthKey: '2026-07', amount: 0 });
  });

  it('⭐ 이체는 피벗에 들어가지 않는다', () => {
    const withTransfer = [...entries, entry({ kind: 'transfer', category: '저축·투자', amount: 500_000 })];

    expect(buildCategoryPivot(withTransfer).grandTotal).toBe(buildCategoryPivot(entries).grandTotal);
  });

  it('상세항목 깊이로 쪼갤 수 있다', () => {
    const detailed = buildCategoryPivot(
      [entry({ category: '식비', subcategory: '외식' }), entry({ category: '식비', subcategory: '배달' })],
      'subcategory'
    );

    expect(detailed.rows.map((row) => row.label).sort()).toEqual(['식비 · 배달', '식비 · 외식']);
  });

  it('🔴 분류가 빈 행은 미분류로 모은다 (기타로 뭉개지 않는다)', () => {
    expect(buildCategoryPivot([entry({ category: '  ' })]).rows[0].label).toBe(UNCLASSIFIED_LABEL);
  });
});

describe('고정비 vs 변동비', () => {
  it('⭐ 고정으로 표시된 것만 고정비다', () => {
    const split = splitByFixity([
      entry({ fixity: 'fixed', amount: 700_000 }),
      entry({ fixity: 'variable', amount: 30_000 })
    ]);

    expect(split.fixed).toBe(700_000);
    expect(split.variable).toBe(30_000);
    expect(split.fixedRatio).toBeCloseTo(700_000 / 730_000);
  });

  it('🔴 지출이 0 이면 비중은 null 이다 (0 나눗셈을 0% 로 위장하지 않는다)', () => {
    expect(splitByFixity([]).fixedRatio).toBeNull();
  });

  it('이체는 고정비에도 변동비에도 들어가지 않는다', () => {
    const split = splitByFixity([entry({ kind: 'transfer', fixity: 'fixed', amount: 500_000 })]);

    expect(split.total).toBe(0);
  });
});

describe('주체별 — 2인 가구 지원의 본체', () => {
  it('⭐ 항목과 무관하게 누가 썼는지로 센다', () => {
    const totals = totalsByPayer([
      entry({ payer: '남편', category: '식비', amount: 30_000 }),
      entry({ payer: '아내', category: '식비', amount: 20_000 }),
      entry({ payer: '남편', category: '교통·차량', amount: 10_000 })
    ]);

    expect(totals[0]).toMatchObject({ payer: '남편', amount: 40_000 });
    expect(totals[1]).toMatchObject({ payer: '아내', amount: 20_000 });
  });

  it('🔴 빈 주체는 공동으로 센다 (1인 가구는 이 칸을 영영 비운다)', () => {
    const totals = totalsByPayer([entry({ payer: undefined }), entry({ payer: '   ' })]);

    expect(totals).toHaveLength(1);
    expect(totals[0].payer).toBe('공동');
    expect(totals[0].ratio).toBe(1);
  });

  it('주체를 아무도 안 적었으면 여러 사람의 가계부가 아니다 (칸을 숨길 근거)', () => {
    expect(hasMultiplePayers([entry(), entry()])).toBe(false);
    expect(hasMultiplePayers([entry({ payer: '남편' })])).toBe(true);
  });
});

describe('결제수단별 — 나중에 카드 추천의 입력', () => {
  it('금액 내림차순으로 온다', () => {
    const totals = totalsByMethod([
      entry({ method: '신한카드', amount: 30_000 }),
      entry({ method: '현금', amount: 5_000 }),
      entry({ method: '신한카드', amount: 20_000 })
    ]);

    expect(totals[0]).toEqual({ method: '신한카드', amount: 50_000, count: 2 });
  });

  it('🔴 수단을 안 적은 건은 현금으로 단정하지 않고 빠진다', () => {
    expect(totalsByMethod([entry({ method: undefined })])).toEqual([]);
  });
});

describe('월별 현금흐름 (P5)', () => {
  const entries = [
    entry({ date: '2026-08-01', kind: 'income', amount: 4_000_000 }),
    entry({ date: '2026-08-05', kind: 'expense', amount: 1_500_000 }),
    entry({ date: '2026-08-10', kind: 'transfer', amount: 1_000_000 })
  ];

  it('⭐ 이체는 지출에 들어가지 않는다', () => {
    const [august] = monthlyCashFlow(entries);

    expect(august.expense).toBe(1_500_000);
    expect(august.transferred).toBe(1_000_000);
  });

  it('⭐ 순액이 이체 때문에 줄지 않는다 (내 돈이 내 통장에 남아 있다)', () => {
    const [august] = monthlyCashFlow(entries);

    expect(august.net).toBe(2_500_000);
  });

  it('저축률 = (수입 − 지출) / 수입', () => {
    const [august] = monthlyCashFlow(entries);

    expect(august.savingRate).toBeCloseTo(2_500_000 / 4_000_000);
  });

  it('🔴 수입이 0 인 달은 저축률이 null 이다 (0% 와 다른 사실이다)', () => {
    const [month] = monthlyCashFlow([entry({ date: '2026-08-05', kind: 'expense', amount: 10_000 })]);

    expect(month.savingRate).toBeNull();
  });

  it('월이 시간 순으로 온다', () => {
    const flow = monthlyCashFlow([
      entry({ date: '2026-09-01', kind: 'income', amount: 100 }),
      entry({ date: '2026-08-01', kind: 'income', amount: 100 })
    ]);

    expect(flow.map((month) => month.monthKey)).toEqual(['2026-08', '2026-09']);
  });
});

describe('상세항목 Top N', () => {
  it('많이 쓴 순으로 온다', () => {
    const top = topSpending([
      entry({ subcategory: '외식', amount: 30_000 }),
      entry({ subcategory: '배달', amount: 50_000 }),
      entry({ subcategory: '외식', amount: 30_000 })
    ]);

    expect(top[0]).toEqual({ label: '외식', amount: 60_000, count: 2 });
  });

  it('상세항목이 없으면 항목 이름으로 센다 (빈 이름으로 줄을 만들지 않는다)', () => {
    expect(topSpending([entry({ category: '주거', subcategory: undefined })])[0].label).toBe('주거');
  });

  it('상한을 지킨다', () => {
    const many = Array.from({ length: 20 }, (_, index) => entry({ subcategory: `항목${index}` }));

    expect(topSpending(many, 5)).toHaveLength(5);
  });
});
