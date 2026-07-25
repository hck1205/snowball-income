import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildCalendarSelectionRecord,
  parseCalendarSelectionRecord,
  readCalendarSelection,
  writeCalendarSelection
} from '@/pages/DividendCalendar/utils';

const CALENDAR_DB_NAME = 'snowball-dividend-calendar';

const deleteCalendarDb = () =>
  new Promise<void>((resolve) => {
    const request = indexedDB.deleteDatabase(CALENDAR_DB_NAME);
    request.onsuccess = () => resolve();
    request.onerror = () => resolve();
    request.onblocked = () => resolve();
  });

/** 손상된/구버전 레코드를 저장소에 직접 심는다. */
const putRawRecord = (value: unknown) =>
  new Promise<void>((resolve, reject) => {
    const open = indexedDB.open(CALENDAR_DB_NAME, 1);
    open.onupgradeneeded = () => {
      const db = open.result;
      if (!db.objectStoreNames.contains('selection')) db.createObjectStore('selection');
    };
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const db = open.result;
      const transaction = db.transaction('selection', 'readwrite');
      transaction.objectStore('selection').put(value, 'selection');
      transaction.oncomplete = () => {
        db.close();
        resolve();
      };
      transaction.onerror = () => {
        db.close();
        reject(transaction.error);
      };
    };
  });

describe('calendarStorage (IndexedDB)', () => {
  beforeEach(async () => {
    await deleteCalendarDb();
  });

  it('저장한 적이 없으면 null 이다 (기본 선택은 호출자가 정한다)', async () => {
    await expect(readCalendarSelection()).resolves.toBeNull();
  });

  it('선택을 저장하고 그대로 되읽는다', async () => {
    await writeCalendarSelection(['SCHD', 'JEPI', 'O']);

    await expect(readCalendarSelection()).resolves.toEqual(['SCHD', 'JEPI', 'O']);
  });

  it('저장 시 대문자로 정규화하고 중복·공백을 정리한다', async () => {
    await writeCalendarSelection([' schd ', 'SCHD', 'o', '']);

    await expect(readCalendarSelection()).resolves.toEqual(['SCHD', 'O']);
  });

  it('두 번째 저장이 이전 선택을 덮어쓴다 (레코드는 항상 한 벌)', async () => {
    await writeCalendarSelection(['SCHD']);
    await writeCalendarSelection(['O', 'JEPI']);

    await expect(readCalendarSelection()).resolves.toEqual(['O', 'JEPI']);
  });

  it('빈 선택도 저장된다 — null(=저장 없음)과 구분된다', async () => {
    await writeCalendarSelection(['SCHD']);
    await writeCalendarSelection([]);

    await expect(readCalendarSelection()).resolves.toEqual([]);
  });

  it('손상된 레코드는 고치려 들지 않고 null 로 흘린다', async () => {
    await putRawRecord({ v: 99, tickers: ['SCHD'], updatedAt: Date.now() });

    await expect(readCalendarSelection()).resolves.toBeNull();
  });

  it('IndexedDB 가 통째로 실패해도 throw 하지 않는다 (읽기=null, 쓰기=무해)', async () => {
    const spy = vi.spyOn(indexedDB, 'open').mockImplementation(() => {
      throw new Error('quota exceeded');
    });

    try {
      await expect(readCalendarSelection()).resolves.toBeNull();
      await expect(writeCalendarSelection(['SCHD'])).resolves.toBeUndefined();
    } finally {
      spy.mockRestore();
    }
  });

  it('시뮬레이터 자동저장 DB(snowball-income-db)에는 손대지 않는다', async () => {
    const spy = vi.spyOn(indexedDB, 'open');

    await writeCalendarSelection(['SCHD']);
    await readCalendarSelection();

    for (const call of spy.mock.calls) {
      expect(call[0]).toBe(CALENDAR_DB_NAME);
    }
    spy.mockRestore();
  });
});

describe('parseCalendarSelectionRecord', () => {
  it('올바른 레코드를 정규화해 돌려준다', () => {
    expect(parseCalendarSelectionRecord({ v: 1, tickers: ['schd', 'SCHD', ' o '], updatedAt: 1 })).toEqual([
      'SCHD',
      'O'
    ]);
  });

  it('모양이 어긋나면 null', () => {
    expect(parseCalendarSelectionRecord(null)).toBeNull();
    expect(parseCalendarSelectionRecord(undefined)).toBeNull();
    expect(parseCalendarSelectionRecord('SCHD,O')).toBeNull();
    expect(parseCalendarSelectionRecord({ tickers: ['SCHD'] })).toBeNull();
    expect(parseCalendarSelectionRecord({ v: 2, tickers: ['SCHD'], updatedAt: 1 })).toBeNull();
    expect(parseCalendarSelectionRecord({ v: 1, tickers: 'SCHD', updatedAt: 1 })).toBeNull();
    expect(parseCalendarSelectionRecord({ v: 1, tickers: ['SCHD', 3], updatedAt: 1 })).toBeNull();
  });
});

describe('buildCalendarSelectionRecord', () => {
  it('v=1 과 저장시각을 붙인다', () => {
    expect(buildCalendarSelectionRecord(['schd'], 1_700_000_000_000)).toEqual({
      v: 1,
      tickers: ['SCHD'],
      updatedAt: 1_700_000_000_000
    });
  });
});
