import { describe, expect, it } from 'vitest';
import { draftToCells } from '@/shared/lib/googleSheets';
import type { LedgerEntry } from '@/shared/lib/googleSheets';
import { collectFieldValues, summarizeMonth, toRowModel } from '@/pages/Ledger/utils';
import type { LedgerRowModel } from '@/pages/Ledger/types';

/**
 * P2 입력 — **v2 축이 실제로 저장되고, 이체가 지출로 세지지 않는다.**
 *
 * 화면 조립(모달 마크업)은 `ledgerOverlays.test.tsx` 가 본다. 여기서는 그 아래의 규칙만 잠근다 —
 * 규칙이 틀리면 화면이 아무리 맞아도 시트에 틀린 값이 들어간다.
 */

const entry = (overrides: Partial<LedgerEntry> = {}): LedgerEntry => ({
  ref: { snapshotId: 'snap-1', rowNumber: 2 },
  date: '2026-08-03',
  kind: 'expense',
  amount: 12000,
  category: '식비',
  fixity: 'variable',
  seen: {},
  ...overrides
});

describe('이체는 지출이 아니다 (월 요약)', () => {
  const row = (kind: LedgerRowModel['kind'], amount: number): LedgerRowModel =>
    toRowModel(entry({ kind, amount }));

  it('⭐ 저축 이체가 지출 합계에 들어가지 않는다', () => {
    const summary = summarizeMonth([row('expense', 30_000), row('transfer', 500_000)]);

    expect(summary.expenseText).toBe(summarizeMonth([row('expense', 30_000)]).expenseText);
    expect(summary.expenseCount).toBe(1);
  });

  it('이체는 수입에도 들어가지 않는다 (양쪽 어디도 아니다)', () => {
    const summary = summarizeMonth([row('income', 100_000), row('transfer', 500_000)]);

    expect(summary.incomeCount).toBe(1);
    expect(summary.incomeText).toBe(summarizeMonth([row('income', 100_000)]).incomeText);
  });

  it('🔴 순액이 이체 때문에 작아지지 않는다', () => {
    const withoutTransfer = summarizeMonth([row('income', 1_000_000), row('expense', 300_000)]);
    const withTransfer = summarizeMonth([
      row('income', 1_000_000),
      row('expense', 300_000),
      row('transfer', 400_000)
    ]);

    expect(withTransfer.netText).toBe(withoutTransfer.netText);
  });
});

describe('v2 축이 시트 셀로 나간다', () => {
  it('⭐ 상세항목·주체·결제수단·고정이 각자의 칸으로 간다', () => {
    const cells = draftToCells({
      date: '2026-08-03',
      kind: 'expense',
      amount: 29_000,
      category: '식비',
      subcategory: '식료품',
      payer: '남편',
      method: '신한카드',
      fixity: 'fixed',
      memo: '하나로마트'
    });

    expect(cells.subcategory).toBe('식료품');
    expect(cells.payer).toBe('남편');
    expect(cells.method).toBe('신한카드');
    expect(cells.fixity).toBe('고정');
  });

  it('🔴 비워 두면 빈 칸이다 — 기본값 글자가 시트를 어지럽히지 않는다', () => {
    const cells = draftToCells({ date: '2026-08-03', kind: 'expense', amount: 1000, category: '식비' });

    expect(cells.subcategory).toBe('');
    expect(cells.payer).toBe(''); // 공동
    expect(cells.method).toBe('');
    expect(cells.fixity).toBe(''); // 변동
  });

  it('공동이라고 적어도 시트에는 빈 칸으로 나간다', () => {
    const cells = draftToCells({
      date: '2026-08-03',
      kind: 'expense',
      amount: 1000,
      category: '식비',
      payer: '공동'
    });

    expect(cells.payer).toBe('');
  });
});

describe('자동완성 후보 — 시트가 정본, 사전은 제안', () => {
  const entries = [
    entry({ category: '식비', subcategory: '외식', payer: '남편', method: '신한카드' }),
    entry({ category: '식비', subcategory: '배달', payer: '아내', method: '신한카드' }),
    entry({ category: '주거', subcategory: '월세', method: '계좌이체' })
  ];

  it('빈도 내림차순으로 온다', () => {
    expect(collectFieldValues(entries, 'category')[0]).toBe('식비');
    expect(collectFieldValues(entries, 'method')[0]).toBe('신한카드');
  });

  it('⭐ 관측값이 사전값보다 앞이다 (사용자가 쓰던 낱말을 밀어내지 않는다)', () => {
    const options = collectFieldValues(entries, 'category', { seed: ['교통·차량', '금융'] });

    expect(options.indexOf('식비')).toBeLessThan(options.indexOf('교통·차량'));
  });

  it('사전값이 관측값과 겹치면 두 번 나오지 않는다', () => {
    const options = collectFieldValues(entries, 'category', { seed: ['식비'] });

    expect(options.filter((option) => option === '식비')).toHaveLength(1);
  });

  it('주체·결제수단은 시드가 없다 — 처음에는 비어 있는 것이 정상이다', () => {
    expect(collectFieldValues([], 'payer')).toEqual([]);
    expect(collectFieldValues([], 'method')).toEqual([]);
  });

  it('빈 값은 후보가 되지 않는다', () => {
    expect(collectFieldValues([entry({ payer: undefined })], 'payer')).toEqual([]);
  });
});
