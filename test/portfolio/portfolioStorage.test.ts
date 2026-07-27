import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildPortfolioRecord,
  parsePortfolioRecord,
  readPortfolioRecord,
  writePortfolioRecord
} from '@/pages/Portfolio/utils';

/**
 * 보유 목록 영속(AC4-1·2·3) — **실제 IndexedDB 왕복**으로 검증한다.
 *
 * 이름을 상수로 다시 적는 이유: DB·스토어 이름이 바뀌면(=기존 사용자 데이터가 사라지면) 이 테스트가
 * 먼저 빨개져야 한다. 구현에서 import 하면 이름을 바꿔도 테스트가 따라가 버려 회귀를 못 잡는다.
 */
const PORTFOLIO_DB_NAME = 'snowball-portfolio';
const PORTFOLIO_STORE_NAME = 'holdings';
const PORTFOLIO_RECORD_KEY = 'holdings';

const deletePortfolioDb = () =>
  new Promise<void>((resolve) => {
    const request = indexedDB.deleteDatabase(PORTFOLIO_DB_NAME);
    request.onsuccess = () => resolve();
    request.onerror = () => resolve();
    request.onblocked = () => resolve();
  });

/** 구버전·손상 레코드를 저장소에 직접 심는다(정상 경로로는 만들 수 없는 상태). */
const putRawRecord = (value: unknown) =>
  new Promise<void>((resolve, reject) => {
    const open = indexedDB.open(PORTFOLIO_DB_NAME, 1);
    open.onupgradeneeded = () => {
      const db = open.result;
      if (!db.objectStoreNames.contains(PORTFOLIO_STORE_NAME)) db.createObjectStore(PORTFOLIO_STORE_NAME);
    };
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const db = open.result;
      const transaction = db.transaction(PORTFOLIO_STORE_NAME, 'readwrite');
      transaction.objectStore(PORTFOLIO_STORE_NAME).put(value, PORTFOLIO_RECORD_KEY);
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

beforeEach(async () => {
  await deletePortfolioDb();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('portfolioStorage — 저장·복원 왕복 (AC4-1·2)', () => {
  it('저장한 보유 목록·세율이 그대로 복원된다 (스키마 버전 포함)', async () => {
    await writePortfolioRecord(
      [
        { ticker: 'SCHD', quantity: 12.5 },
        { ticker: 'O', quantity: 0 },
        { ticker: 'TIGER200', quantity: 3, manual: { price: 21.4, dividendYield: 4.2 } }
      ],
      22
    );

    const result = await readPortfolioRecord();

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value).not.toBeNull();
    expect(result.value?.v).toBe(1);
    expect(result.value?.taxPercent).toBe(22);
    expect(result.value?.holdings).toEqual([
      { ticker: 'SCHD', quantity: 12.5 },
      { ticker: 'O', quantity: 0 },
      { ticker: 'TIGER200', quantity: 3, manual: { price: 21.4, dividendYield: 4.2 } }
    ]);
    expect(typeof result.value?.updatedAt).toBe('number');
    expect(result.value?.updatedAt).toBeGreaterThan(0);
  });

  it('수량 미입력(0) 행도 목록에 남는다 — 저장이 행을 삼키지 않는다', async () => {
    await writePortfolioRecord([{ ticker: 'SCHD', quantity: 0 }], 15.4);

    const result = await readPortfolioRecord();

    expect(result.ok && result.value?.holdings).toEqual([{ ticker: 'SCHD', quantity: 0 }]);
  });

  it('저장 시 티커·수량·세율을 M0 규칙으로 정규화한다', async () => {
    await writePortfolioRecord(
      [
        { ticker: ' schd ', quantity: 12.34567 },
        { ticker: 'SCHD', quantity: 999 },
        { ticker: '  ', quantity: 5 },
        { ticker: 'jepi', quantity: Number.NaN }
      ],
      500
    );

    const result = await readPortfolioRecord();

    expect(result.ok && result.value?.holdings).toEqual([
      // 소수 4자리 반올림, 중복 티커는 먼저 나온 행이 이긴다, 빈 티커는 버린다.
      { ticker: 'SCHD', quantity: 12.3457 },
      // NaN 은 미입력(0)이지 삭제가 아니다.
      { ticker: 'JEPI', quantity: 0 }
    ]);
    expect(result.ok && result.value?.taxPercent).toBe(100);
  });

  it('두 번째 저장이 이전 목록을 덮어쓴다 (레코드는 항상 한 벌)', async () => {
    await writePortfolioRecord([{ ticker: 'SCHD', quantity: 1 }], 15.4);
    await writePortfolioRecord([{ ticker: 'O', quantity: 2 }], 15.4);

    const result = await readPortfolioRecord();

    expect(result.ok && result.value?.holdings).toEqual([{ ticker: 'O', quantity: 2 }]);
  });

  it('빈 목록도 저장된다 — "저장 이력 없음"과 구분된다', async () => {
    await writePortfolioRecord([{ ticker: 'SCHD', quantity: 1 }], 15.4);
    await writePortfolioRecord([], 15.4);

    const result = await readPortfolioRecord();

    expect(result.ok).toBe(true);
    expect(result.ok && result.value).not.toBeNull();
    expect(result.ok && result.value?.holdings).toEqual([]);
  });

  it('시뮬레이터·캘린더 DB 는 열지도 않는다 (기존 저장 데이터 무변경 — AC4-4)', async () => {
    const spy = vi.spyOn(indexedDB, 'open');

    await writePortfolioRecord([{ ticker: 'SCHD', quantity: 1 }], 15.4);
    await readPortfolioRecord();

    expect(spy).toHaveBeenCalled();
    for (const call of spy.mock.calls) expect(call[0]).toBe(PORTFOLIO_DB_NAME);
  });
});

describe('portfolioStorage — 읽기 결과 구분 (AC4-3)', () => {
  it('저장한 적이 없으면 ok:true·value:null — "빈 목록"이지 "못 읽음"이 아니다', async () => {
    const result = await readPortfolioRecord();

    expect(result).toEqual({ ok: true, value: null });
  });

  it('모르는 스키마 버전은 읽지 않고 버린다', async () => {
    await putRawRecord({ v: 2, holdings: [{ ticker: 'SCHD', quantity: 1 }], taxPercent: 15.4, updatedAt: 1 });

    const result = await readPortfolioRecord();

    expect(result).toEqual({ ok: true, value: null });
  });

  it('손상된 레코드도 고치려 들지 않고 버린다', async () => {
    await putRawRecord({ v: 1, holdings: 'SCHD', taxPercent: 15.4, updatedAt: 1 });

    const result = await readPortfolioRecord();

    expect(result).toEqual({ ok: true, value: null });
  });

  it('IndexedDB 가 없는 환경은 ok:false 로 표면화된다 (조용한 빈 목록 금지)', async () => {
    vi.stubGlobal('indexedDB', undefined);

    await expect(readPortfolioRecord()).resolves.toEqual({ ok: false, reason: 'unavailable' });
  });

  it('열기가 실패하면 ok:false 로 사유를 돌려준다', async () => {
    vi.spyOn(indexedDB, 'open').mockImplementation(() => {
      throw new Error('quota exceeded');
    });

    const result = await readPortfolioRecord();

    expect(result.ok).toBe(false);
    expect(result.ok === false && result.reason).toBe('read-failed');
  });
});

describe('portfolioStorage — 쓰기 실패 전파 (무음 실패 금지)', () => {
  it('IndexedDB 가 없으면 reject 한다 (사유 포함)', async () => {
    vi.stubGlobal('indexedDB', undefined);

    await expect(writePortfolioRecord([{ ticker: 'SCHD', quantity: 1 }], 15.4)).rejects.toMatchObject({
      reason: 'unavailable'
    });
  });

  it('저장소가 던지면 그대로 reject 한다 (조용히 삼키지 않는다)', async () => {
    vi.spyOn(indexedDB, 'open').mockImplementation(() => {
      throw new Error('quota exceeded');
    });

    await expect(writePortfolioRecord([{ ticker: 'SCHD', quantity: 1 }], 15.4)).rejects.toThrow('quota exceeded');
  });
});

describe('parsePortfolioRecord / buildPortfolioRecord (순수)', () => {
  it('모양이 어긋나면 null', () => {
    expect(parsePortfolioRecord(null)).toBeNull();
    expect(parsePortfolioRecord(undefined)).toBeNull();
    expect(parsePortfolioRecord('SCHD')).toBeNull();
    expect(parsePortfolioRecord({ holdings: [] })).toBeNull();
    expect(parsePortfolioRecord({ v: 2, holdings: [] })).toBeNull();
    expect(parsePortfolioRecord({ v: 1, holdings: { ticker: 'SCHD' } })).toBeNull();
  });

  it('세율이 없거나 무효하면 기본값(15.4)으로 채운다', () => {
    expect(parsePortfolioRecord({ v: 1, holdings: [], updatedAt: 1 })?.taxPercent).toBe(15.4);
    expect(parsePortfolioRecord({ v: 1, holdings: [], taxPercent: 'x', updatedAt: 1 })?.taxPercent).toBe(15.4);
  });

  it('무효한 수동 입력은 버린다 — 행은 남고 데이터 없음으로 떨어진다', () => {
    const record = parsePortfolioRecord({
      v: 1,
      holdings: [
        { ticker: 'A', quantity: 1, manual: { price: 0, dividendYield: 3 } },
        { ticker: 'B', quantity: 1, manual: { price: 10, dividendYield: 500 } }
      ],
      taxPercent: 15.4,
      updatedAt: 1
    });

    expect(record?.holdings).toEqual([
      { ticker: 'A', quantity: 1 },
      // 배당률은 0..100 으로 가둔다(폼 검증을 통과하지 않은 값이 들어와도 계산이 오염되지 않게).
      { ticker: 'B', quantity: 1, manual: { price: 10, dividendYield: 100 } }
    ]);
  });

  it('v 와 저장 시각을 붙인다', () => {
    expect(buildPortfolioRecord([{ ticker: 'schd', quantity: 1 }], 15.4, 1_700_000_000_000)).toEqual({
      v: 1,
      holdings: [{ ticker: 'SCHD', quantity: 1 }],
      taxPercent: 15.4,
      updatedAt: 1_700_000_000_000
    });
  });
});
