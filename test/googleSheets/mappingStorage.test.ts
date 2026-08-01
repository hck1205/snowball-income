/**
 * 열 매핑의 로컬 보관 — jsdom 의 localStorage 를 쓴다.
 *
 * 여기서 확인하는 계약은 하나다: **저장되는 것은 연결 정보뿐이고, 가계부 행은 저장되지 않는다.**
 */
import { beforeEach, describe, expect, it } from 'vitest';

import {
  LEDGER_LINK_STORAGE_KEY,
  loadSheetLinks,
  removeSheetLink,
  saveSheetLink,
  type ColumnMapping
} from '@/shared/lib/googleSheets';

const MAPPING: ColumnMapping = { date: 0, kind: 1, amount: 2, category: 3, memo: 4 };

describe('연결 정보 로컬 보관', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('저장하고 다시 읽는다', () => {
    expect(saveSheetLink({ spreadsheetId: 'abc', sheetId: 0, mapping: MAPPING, createdByApp: false })).toBe(true);
    expect(loadSheetLinks()).toEqual([
      { spreadsheetId: 'abc', sheetId: 0, mapping: MAPPING, createdByApp: false }
    ]);
  });

  it('같은 시트·같은 탭은 덮어쓴다', () => {
    saveSheetLink({ spreadsheetId: 'abc', sheetId: 0, mapping: MAPPING, createdByApp: false });
    saveSheetLink({
      spreadsheetId: 'abc',
      sheetId: 0,
      mapping: { ...MAPPING, amount: 9 },
      createdByApp: false
    });
    expect(loadSheetLinks()).toHaveLength(1);
    expect(loadSheetLinks()[0].mapping.amount).toBe(9);
  });

  it('다른 탭은 별개로 남는다', () => {
    saveSheetLink({ spreadsheetId: 'abc', sheetId: 0, mapping: MAPPING, createdByApp: false });
    saveSheetLink({ spreadsheetId: 'abc', sheetId: 7, mapping: MAPPING, createdByApp: false });
    expect(loadSheetLinks()).toHaveLength(2);
  });

  it('연결을 끊으면 지운다', () => {
    saveSheetLink({ spreadsheetId: 'abc', sheetId: 0, mapping: MAPPING, createdByApp: false });
    expect(removeSheetLink('abc', 0)).toBe(true);
    expect(loadSheetLinks()).toEqual([]);
  });

  it('🔴 저장된 원문에 가계부 값·시트 제목이 없다', () => {
    saveSheetLink({ spreadsheetId: 'abc', sheetId: 0, mapping: MAPPING, createdByApp: true });
    const raw = window.localStorage.getItem(LEDGER_LINK_STORAGE_KEY) ?? '';
    expect(raw).toContain('abc');
    expect(raw).not.toContain('sheetTitle');
    expect(raw).not.toContain('date":"'); // 날짜 값이 아니라 열 인덱스만 들어간다
  });

  it('저장소에 이상한 값이 들어 있어도 던지지 않는다', () => {
    window.localStorage.setItem(LEDGER_LINK_STORAGE_KEY, 'not json');
    expect(loadSheetLinks()).toEqual([]);
  });
});
