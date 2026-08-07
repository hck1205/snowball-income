// @vitest-environment node — 헤더 매핑 추론과 직렬화. 저장소 접근은 별도 파일(jsdom)에서 본다.
import { describe, expect, it } from 'vitest';

import {
  STORED_SHEET_LINK_KEYS,
  findDuplicateColumns,
  isCompleteMapping,
  mappedColumnIndices,
  matchesAppSheetHeaders,
  parseStoredSheetLinks,
  serializeStoredSheetLinks,
  suggestColumnMapping,
  toStoredSheetLink,
  validateColumnMapping,
  type ColumnMapping
} from '@/shared/lib/googleSheets';

describe('헤더에서 열 매핑 후보 제시', () => {
  it('앱 스키마 헤더는 그대로 잡는다', () => {
    const { mapping, missing } = suggestColumnMapping([
      '날짜', '구분', '항목', '상세항목', '금액', '주체', '결제수단', '고정', '내용', '상태'
    ]);
    expect(mapping).toEqual({
      date: 0,
      kind: 1,
      category: 2,
      subcategory: 3,
      amount: 4,
      payer: 5,
      method: 6,
      fixity: 7,
      memo: 8,
      status: 9
    });
    expect(missing).toEqual([]);
  });

  it('🔴 `구분`(수입/지출)과 `분류`(카테고리)를 서로 잡아먹지 않는다', () => {
    // 글자가 비슷해 포함 매칭만 쓰면 한쪽이 다른 쪽 열을 가져간다 — 완전 일치를 먼저 보는 이유다.
    const { mapping } = suggestColumnMapping(['일자', '분류', '구분', '거래금액']);
    expect(mapping.category).toBe(1);
    expect(mapping.kind).toBe(2);
  });

  it('다른 말로 쓴 헤더도 후보를 찾는다', () => {
    const { mapping, missing } = suggestColumnMapping(['거래일자', '입출금', '금액', '카테고리', '비고']);
    expect(mapping).toEqual({ date: 0, kind: 1, amount: 2, category: 3, memo: 4 });
    expect(missing).toEqual([]);
  });

  it('한 열이 두 필드에 배정되지 않는다', () => {
    const { mapping } = suggestColumnMapping(['날짜', '금액', '메모']);
    expect(findDuplicateColumns(mapping)).toEqual([]);
  });

  it('못 찾은 필수 필드를 알려준다 — 사용자가 직접 고르면 된다', () => {
    const { missing } = suggestColumnMapping(['날짜', '금액', '메모']);
    expect(missing).toEqual(['kind', 'category']);
  });

  it('빈 헤더 칸은 후보가 되지 않는다', () => {
    const { mapping } = suggestColumnMapping(['', '날짜', '', '금액']);
    expect(mapping.date).toBe(1);
    expect(mapping.amount).toBe(3);
  });
});

describe('매핑 검증', () => {
  it('필수 4필드가 있어야 완성이다', () => {
    expect(isCompleteMapping({ date: 0, kind: 1, amount: 2, category: 3 })).toBe(true);
    expect(isCompleteMapping({ date: 0, kind: 1, amount: 2 })).toBe(false);
  });

  it('같은 열에 두 필드가 배정되면 저장하지 않는다', () => {
    const result = validateColumnMapping({ date: 0, kind: 1, amount: 2, category: 2 });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.duplicated).toEqual([2]);
  });

  it('앱 영역 = 매핑된 열 목록(중복 제거·오름차순)', () => {
    const mapping: ColumnMapping = { date: 3, kind: 1, amount: 2, category: 0, memo: 5 };
    expect(mappedColumnIndices(mapping)).toEqual([0, 1, 2, 3, 5]);
  });

  it('앱이 만든 시트인지 헤더로 판정한다', () => {
    expect(matchesAppSheetHeaders(['날짜', '구분', '항목', '상세항목', '금액', '주체', '결제수단', '고정', '내용', '상태'])).toBe(true);
    expect(matchesAppSheetHeaders(['날짜', '금액', '분류'])).toBe(false);
  });
});

describe('🔴 로컬에 저장되는 것은 연결 정보뿐 — 가계부 행은 없다', () => {
  const link = {
    spreadsheetId: 'sheet-abc',
    sheetId: 0,
    mapping: { date: 0, kind: 1, amount: 2, category: 3 } as ColumnMapping,
    createdByApp: false
  };

  it('허용된 키 밖의 것은 저장 페이로드에서 떨어진다', () => {
    const polluted = {
      ...link,
      sheetTitle: '우리집 가계부',
      entries: [{ date: '2026-08-01', amount: 1200 }]
    } as unknown as typeof link;

    const stored = toStoredSheetLink(polluted);
    expect(Object.keys(stored).sort()).toEqual([...STORED_SHEET_LINK_KEYS].sort());
  });

  it('직렬화 결과에 가계부 값도 시트 제목도 들어가지 않는다', () => {
    const serialized = serializeStoredSheetLinks([
      { ...link, mapping: { ...link.mapping, memo: 4 } } as typeof link
    ]);
    expect(serialized).not.toContain('우리집');
    expect(serialized).not.toContain('1200');
    expect(serialized).not.toContain('sheetTitle');
    expect(JSON.parse(serialized)).toEqual([
      { spreadsheetId: 'sheet-abc', sheetId: 0, mapping: { date: 0, kind: 1, amount: 2, category: 3, memo: 4 }, createdByApp: false }
    ]);
  });

  it('형태가 어긋난 항목은 조용히 버리고 나머지를 살린다', () => {
    const parsed = parseStoredSheetLinks(
      JSON.stringify([
        { spreadsheetId: 'ok', sheetId: 0, mapping: { date: 0, kind: 1, amount: 2, category: 3 } },
        { spreadsheetId: 'no-mapping', sheetId: 1 },
        { sheetId: 2, mapping: { date: 0, kind: 1, amount: 2, category: 3 } },
        'not-an-object'
      ])
    );
    expect(parsed.map((item) => item.spreadsheetId)).toEqual(['ok']);
  });

  it('망가진 문자열이어도 던지지 않는다 — 연결이 실패하면 안 된다', () => {
    expect(parseStoredSheetLinks('{{{')).toEqual([]);
    expect(parseStoredSheetLinks(null)).toEqual([]);
  });
});
