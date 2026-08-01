// @vitest-environment node — 셀 문자열 ↔ 도메인 값. 순수 함수만.
import { describe, expect, it } from 'vitest';

import {
  APP_SHEET_MAPPING,
  columnLetter,
  columnSpanRange,
  draftToCells,
  escapeFormulaText,
  formatAmountCell,
  formatKindCell,
  parseAmount,
  parseLedgerColumns,
  parseLedgerDate,
  parseLedgerKind,
  parseLedgerRow,
  parseSingleColumnRange,
  patchToCells,
  quoteSheetTitle,
  validateLedgerDraft,
  type ColumnMapping
} from '@/shared/lib/googleSheets';

describe('금액 파싱 — 남의 가계부 표기를 견딘다', () => {
  it.each([
    ['1200', 1200],
    ['1,200', 1200],
    ['₩1,200', 1200],
    ['1,200원', 1200],
    ['  12 000 ', 12000],
    ['-500', -500],
    ['(500)', -500],
    ['△500', -500],
    ['1234.56', 1234.56],
    ['1200 KRW', 1200]
  ])('%s → %s', (raw, expected) => {
    expect(parseAmount(raw)).toBe(expected);
  });

  it.each([[''], ['   '], ['abc'], ['1,2a00'], ['--5'], ['1.2.3']])('%s 는 읽을 수 없다', (raw) => {
    expect(parseAmount(raw)).toBeNull();
  });

  it('빈 칸을 0으로 위장하지 않는다', () => {
    // 0원 지출과 "못 읽은 칸"은 다른 사실이다.
    expect(parseAmount('')).toBeNull();
    expect(parseAmount('0')).toBe(0);
  });
});

describe('날짜 파싱', () => {
  it.each([
    ['2026-08-01', '2026-08-01'],
    ['2026/8/1', '2026-08-01'],
    ['2026.08.01', '2026-08-01'],
    ['2026. 8. 1', '2026-08-01'],
    ['2026년 8월 1일', '2026-08-01'],
    ['20260801', '2026-08-01']
  ])('%s → %s', (raw, expected) => {
    expect(parseLedgerDate(raw)).toBe(expected);
  });

  it('존재하지 않는 날짜는 읽을 수 없다', () => {
    expect(parseLedgerDate('2026-02-30')).toBeNull();
    expect(parseLedgerDate('2026-13-01')).toBeNull();
  });

  it('연도가 뒤에 오는 표기는 일부러 받지 않는다', () => {
    // 8/1/2026 은 로케일마다 8월 1일 / 1월 8일로 갈린다 — 조용히 다른 날짜로 읽는 것보다 못 읽는 편이 낫다.
    expect(parseLedgerDate('8/1/2026')).toBeNull();
  });
});

describe('구분 파싱', () => {
  it.each([['수입'], ['입금'], ['income'], ['+']])('%s 는 수입이다', (raw) => {
    expect(parseLedgerKind(raw)).toBe('income');
  });

  it.each([['지출'], ['출금'], ['expense'], ['-']])('%s 는 지출이다', (raw) => {
    expect(parseLedgerKind(raw)).toBe('expense');
  });

  it('모르는 말을 지출로 몰지 않는다', () => {
    expect(parseLedgerKind('이체')).toBeNull();
    expect(parseLedgerKind('')).toBeNull();
  });
});

describe('행 파싱 — 한 행이 이상해도 전체가 실패하지 않는다', () => {
  it('필수 4필드를 읽으면 성공이다', () => {
    const parsed = parseLedgerRow(
      { date: '2026-08-01', kind: '지출', amount: '₩1,200', category: '식비', memo: '점심' },
      5
    );
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.entry).toMatchObject({
      rowNumber: 5,
      date: '2026-08-01',
      kind: 'expense',
      amount: 1200,
      category: '식비',
      memo: '점심'
    });
  });

  it('읽을 수 없는 칸은 사유와 함께 그 행만 실패한다', () => {
    const parsed = parseLedgerRow({ date: 'ㅁㅁ', kind: '지출', amount: '', category: '식비' }, 7);
    expect(parsed.ok).toBe(false);
    if (parsed.ok) return;
    expect(parsed.unreadable.rowNumber).toBe(7);
    expect(parsed.unreadable.reasons).toHaveLength(2);
  });

  it('분류가 비어 있어도 통과한다', () => {
    const parsed = parseLedgerRow({ date: '2026-08-01', kind: '수입', amount: '100', category: '' }, 2);
    expect(parsed.ok).toBe(true);
  });

  it('본 값(seen)을 그대로 들고 다닌다 — 동시 편집 비교의 기준이다', () => {
    const cells = { date: '2026-08-01', kind: '지출', amount: '₩1,200', category: '식비' };
    const parsed = parseLedgerRow(cells, 2);
    expect(parsed.ok && parsed.entry.seen).toEqual(cells);
  });
});

describe('열 → 행 정렬', () => {
  const mapping: ColumnMapping = { date: 0, kind: 1, amount: 2, category: 3 };

  it('열마다 길이가 달라도 같은 행끼리 묶인다', () => {
    // 마지막 값 뒤의 빈 칸은 응답에서 잘려 온다 — 짧은 열을 빈 문자열로 채우지 않으면 행이 밀린다.
    const columns = new Map<number, readonly string[]>([
      [0, ['2026-08-01', '2026-08-02', '2026-08-03']],
      [1, ['지출', '지출', '수입']],
      [2, ['1000', '2000', '3000']],
      [3, ['식비']]
    ]);
    const parsed = parseLedgerColumns({ mapping, columns });

    expect(parsed.lastDataRow).toBe(4);
    expect(parsed.rows).toHaveLength(3);
    expect(parsed.rows[0].ok && parsed.rows[0].entry.category).toBe('식비');
    expect(parsed.rows[1].ok && parsed.rows[1].entry.date).toBe('2026-08-02');
    expect(parsed.rows[2].ok && parsed.rows[2].entry.amount).toBe(3000);

    // 🔴 짧은 열의 뒷행은 **빈 칸**이어야 한다. 마지막 값을 이어 쓰면 다른 행의 값을 그 행의 것으로 읽는다.
    expect(parsed.rows[1].ok && parsed.rows[1].entry.category).toBe('');
    expect(parsed.rows[2].ok && parsed.rows[2].entry.category).toBe('');
    expect(parsed.rows[1].ok && parsed.rows[1].entry.seen.category).toBe('');
  });

  it('완전히 빈 행은 건너뛴다', () => {
    const columns = new Map<number, readonly string[]>([
      [0, ['2026-08-01', '', '2026-08-03']],
      [1, ['지출', '', '수입']],
      [2, ['1000', '', '3000']],
      [3, ['식비', '', '급여']]
    ]);
    const parsed = parseLedgerColumns({ mapping, columns });
    expect(parsed.rows).toHaveLength(2);
    expect(parsed.rows.every((row) => row.ok)).toBe(true);
    expect(parsed.lastDataRow).toBe(4);
  });

  it('데이터가 하나도 없으면 마지막 데이터 행은 헤더 행이다', () => {
    const columns = new Map<number, readonly string[]>([
      [0, []],
      [1, []],
      [2, []],
      [3, []]
    ]);
    expect(parseLedgerColumns({ mapping, columns }).lastDataRow).toBe(1);
  });
});

describe('셀로 쓰기 — 남의 시트에 수식을 심지 않는다', () => {
  it.each([['=SUM(A1:A9)'], ['+1'], ['-1'], ['@here']])('%s 는 글자 그대로 고정한다', (text) => {
    expect(escapeFormulaText(text)).toBe(`'${text}`);
  });

  it('평범한 글자는 그대로 둔다', () => {
    expect(escapeFormulaText('점심 식사')).toBe('점심 식사');
  });

  it('금액은 통화기호·천단위 없이 쓴다 — 표시 서식은 사용자 시트의 권한이다', () => {
    expect(formatAmountCell(-1200)).toBe('-1200');
    expect(formatAmountCell(1200)).toBe('1200');
  });

  it('구분은 사람이 읽는 한국어로 쓴다', () => {
    expect(formatKindCell('income')).toBe('수입');
    expect(formatKindCell('expense')).toBe('지출');
  });

  it('새 항목은 상태 칸을 비운 채 시작한다 (앱이 만든 시트)', () => {
    const cells = draftToCells(
      { date: '2026-08-01', kind: 'expense', amount: 1200, category: '식비', memo: '=1+1' },
      { withStatus: true }
    );
    expect(cells).toEqual({ date: '2026-08-01', kind: '지출', amount: '1200', category: '식비', memo: "'=1+1", status: '' });
  });

  it('수정은 넣은 필드만 셀로 만든다', () => {
    expect(patchToCells({ amount: 3000 })).toEqual({ amount: '3000' });
    expect(Object.keys(patchToCells({ memo: '' }))).toEqual(['memo']);
  });
});

describe('새 항목 검증', () => {
  it('통과하면 빈 배열이다', () => {
    expect(validateLedgerDraft({ date: '2026-08-01', kind: 'expense', amount: 1200, category: '식비' })).toEqual([]);
  });

  it('문제가 된 필드만 돌려준다', () => {
    expect(
      validateLedgerDraft({ date: '2026-13-01', kind: 'expense', amount: Number.NaN, category: '식비' })
    ).toEqual(['date', 'amount']);
  });
});

describe('A1 표기', () => {
  it.each([
    [0, 'A'],
    [25, 'Z'],
    [26, 'AA'],
    [27, 'AB'],
    [51, 'AZ'],
    [52, 'BA']
  ])('열 %i → %s', (index, letter) => {
    expect(columnLetter(index)).toBe(letter);
  });

  it('탭 제목의 작은따옴표를 이스케이프한다', () => {
    expect(quoteSheetTitle("가계'부")).toBe("'가계''부'");
  });

  it('만든 범위를 되읽을 수 있다', () => {
    const range = columnSpanRange('가계부', 2, 4, 6);
    expect(range).toBe("'가계부'!C4:C6");
    expect(parseSingleColumnRange(range)).toEqual({
      sheetTitle: '가계부',
      columnIndex: 2,
      startRow: 4,
      endRow: 6
    });
  });

  it('두 열을 걸치는 범위는 해석하지 않는다 — 이 성질이 행 단위 덮어쓰기 탐지의 근거다', () => {
    expect(parseSingleColumnRange("'가계부'!A2:F2")).toBeNull();
  });

  it('앱 스키마 매핑은 헤더 순서와 같다', () => {
    expect(APP_SHEET_MAPPING).toEqual({ date: 0, kind: 1, amount: 2, category: 3, memo: 4, status: 5 });
  });
});
