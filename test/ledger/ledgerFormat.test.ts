// @vitest-environment node — DOM 을 쓰지 않는 순수 테스트 (기준: vitest.config.ts)
import { describe, expect, it } from 'vitest';
import type { LedgerEntry } from '@/shared/lib/googleSheets';
import {
  addMonths,
  collectCategories,
  formatEntryDate,
  latestMonthOf,
  monthLabelOf,
  nextRetryDelaySec,
  summarizeMonth,
  toRowModel
} from '@/pages/Ledger/utils';

/**
 * `/ledger` 표시 계층의 **순수 규칙**. 화면 테스트는 이미 포맷된 문자열을 받으므로, 그 문자열을
 * 만드는 자리를 여기서 따로 잠근다(그러지 않으면 부호·색·반올림 회귀가 뷰 테스트를 그냥 통과한다).
 */

const entry = (overrides: Partial<LedgerEntry> = {}): LedgerEntry => ({
  ref: { snapshotId: 'snap-1', rowNumber: 2 },
  date: '2026-08-03',
  kind: 'expense',
  amount: 12000,
  category: '식비',
  memo: '점심',
  seen: {},
  ...overrides
});

describe('행 금액 — 🔴 부호 없는 절대값', () => {
  it('시트에 음수로 적힌 지출도 표시는 절대값이다 (방향은 구분이 갖는다)', () => {
    const row = toRowModel(entry({ amount: -12000 }));

    expect(row.amount).toBe(12000);
    expect(row.amountText).toBe('₩12,000');
    expect(row.amountText).not.toContain('-');
    expect(row.kind).toBe('expense');
  });

  it('메모가 없으면 빈 문자열이다 — "—" 를 지어내지 않는다', () => {
    expect(toRowModel(entry({ memo: undefined })).memo).toBe('');
  });

  it('행 id 는 스냅샷에 묶인다 (물리 삭제로 행이 밀리면 다른 id 가 된다)', () => {
    expect(toRowModel(entry()).id).toBe('snap-1:2');
  });
});

describe('월 요약 — 순액만 부호를 갖는다', () => {
  it('수입·지출은 양수, 순액은 부호 포함', () => {
    const rows = [
      toRowModel(entry({ kind: 'income', amount: 1_000_000 })),
      toRowModel(entry({ ref: { snapshotId: 'snap-1', rowNumber: 3 }, kind: 'expense', amount: 1_320_000 }))
    ];

    expect(summarizeMonth(rows)).toEqual({
      incomeText: '₩1,000,000',
      expenseText: '₩1,320,000',
      netText: '-₩320,000',
      incomeCount: 1,
      expenseCount: 1
    });
  });

  it('0건이면 세 값이 모두 0원이다 (연결 정상의 증거라 숨기지 않는다)', () => {
    expect(summarizeMonth([])).toEqual({
      incomeText: '₩0',
      expenseText: '₩0',
      netText: '₩0',
      incomeCount: 0,
      expenseCount: 0
    });
  });
});

describe('날짜·월 커서', () => {
  it('ISO 날짜를 요일까지 읽고, 못 읽으면 시트 원문을 그대로 둔다', () => {
    expect(formatEntryDate('2026-08-03')).toBe('8월 3일 (월)');
    expect(formatEntryDate('2026-02-30')).toBe('2026-02-30');
    expect(formatEntryDate('8/3')).toBe('8/3');
  });

  it('12월 다음은 이듬해 1월, 1월 이전은 전해 12월', () => {
    expect(monthLabelOf(addMonths({ year: 2026, month: 12 }, 1))).toBe('2027년 1월');
    expect(monthLabelOf(addMonths({ year: 2026, month: 1 }, -1))).toBe('2025년 12월');
    expect(monthLabelOf(addMonths({ year: 2026, month: 8 }, -14))).toBe('2025년 6월');
  });

  it('가장 최근 기록이 있는 달을 찾는다 — 없으면 null(그 문장을 만들 수 없다)', () => {
    expect(latestMonthOf([])).toBeNull();
    expect(
      latestMonthOf([
        entry({ date: '2026-05-01' }),
        entry({ date: '2026-07-31' }),
        entry({ date: '2025-12-31' })
      ])
    ).toEqual({ year: 2026, month: 7 });
  });
});

describe('분류 자동완성 · 429 백오프', () => {
  it('시트에 등장한 분류만, 빈도 내림차순으로 준다', () => {
    expect(
      collectCategories([
        entry({ category: '식비' }),
        entry({ category: '교통' }),
        entry({ category: '식비' }),
        entry({ category: '  ' })
      ])
    ).toEqual(['식비', '교통']);
  });

  it('Retry-After 가 있으면 그 값, 없으면 30초에서 지수 백오프(상한 300)', () => {
    expect(nextRetryDelaySec(null, 12)).toBe(12);
    expect(nextRetryDelaySec(null, null)).toBe(30);
    expect(nextRetryDelaySec(30, null)).toBe(60);
    expect(nextRetryDelaySec(240, null)).toBe(300);
    expect(nextRetryDelaySec(300, null)).toBe(300);
    expect(nextRetryDelaySec(null, 9999)).toBe(300);
  });
});
