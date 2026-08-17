import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  PORTFOLIO_DB_NAMES,
  PORTFOLIO_DB_STORE_NAME,
  PORTFOLIO_DB_VERSION,
  PORTFOLIO_STATE_KEY,
  buildDefaultPayload,
  readPersistedAppState,
  resetPortfolioDbNameCache,
  resolvePortfolioDbName,
  writePersistedAppState
} from '@/jotai';
import { storageKey } from '@/shared/lib/storage';

/**
 * IndexedDB 이름 이관(`snowball-income-db` → `hungryhippo-db`).
 *
 * 🔴 **이 저장소에서 가장 비싼 데이터다.** localStorage 쪽(팔레트·연결)은 잃어도 다시 설정하면
 * 그만이지만, 여기에는 사용자가 직접 입력한 포트폴리오와 저장 슬롯이 들어 있다 — 잃으면 복구가 없다.
 * 그래서 이 파일은 "옮겨졌는가"보다 **"어떤 경우에도 사라지지 않는가"** 를 먼저 본다.
 */

const MIGRATED_KEY = storageKey('idb-migrated:v1');

const deleteDb = (name: string) =>
  new Promise<void>((resolve) => {
    const request = indexedDB.deleteDatabase(name);
    request.onsuccess = () => resolve();
    request.onerror = () => resolve();
    request.onblocked = () => resolve();
  });

/** 이관 대상이 될 **옛 DB** 를 직접 만든다 (앱 코드를 거치지 않는다 — 그게 검사 대상이므로). */
const seedLegacyDb = (records: { key: string; value: unknown }[]) =>
  new Promise<void>((resolve, reject) => {
    const request = indexedDB.open(PORTFOLIO_DB_NAMES.legacy, PORTFOLIO_DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(PORTFOLIO_DB_STORE_NAME)) {
        db.createObjectStore(PORTFOLIO_DB_STORE_NAME, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(PORTFOLIO_DB_STORE_NAME, 'readwrite');
      const store = transaction.objectStore(PORTFOLIO_DB_STORE_NAME);
      for (const record of records) store.put(record);
      transaction.oncomplete = () => {
        db.close();
        resolve();
      };
      transaction.onerror = () => {
        db.close();
        reject(transaction.error);
      };
    };

    request.onerror = () => reject(request.error);
  });

const readRecords = (name: string) =>
  new Promise<{ key: string; value: unknown }[]>((resolve, reject) => {
    const request = indexedDB.open(name, PORTFOLIO_DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(PORTFOLIO_DB_STORE_NAME)) {
        db.createObjectStore(PORTFOLIO_DB_STORE_NAME, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => {
      const db = request.result;
      const all = db.transaction(PORTFOLIO_DB_STORE_NAME, 'readonly').objectStore(PORTFOLIO_DB_STORE_NAME).getAll();
      all.onsuccess = () => {
        db.close();
        resolve(all.result as { key: string; value: unknown }[]);
      };
      all.onerror = () => {
        db.close();
        reject(all.error);
      };
    };

    request.onerror = () => reject(request.error);
  });

const listDatabaseNames = async (): Promise<string[]> => {
  const factory = indexedDB as IDBFactory & { databases?: () => Promise<{ name?: string }[]> };
  if (typeof factory.databases !== 'function') return [];
  const list = await factory.databases();
  return list.map((entry) => entry.name ?? '');
};

beforeEach(async () => {
  window.localStorage.clear();
  resetPortfolioDbNameCache();
  await deleteDb(PORTFOLIO_DB_NAMES.legacy);
  await deleteDb(PORTFOLIO_DB_NAMES.current);
});

describe('이관: 옛 DB 가 있는 기존 사용자', () => {
  it('레코드를 새 DB 로 옮기고 새 이름을 쓴다', async () => {
    await seedLegacyDb([{ key: PORTFOLIO_STATE_KEY, value: { savedName: '내 포트폴리오' } }]);

    const name = await resolvePortfolioDbName();

    expect(name).toBe(PORTFOLIO_DB_NAMES.current);
    const moved = await readRecords(PORTFOLIO_DB_NAMES.current);
    expect(moved).toHaveLength(1);
    expect(moved[0].key).toBe(PORTFOLIO_STATE_KEY);
    expect(moved[0].value).toEqual({ savedName: '내 포트폴리오' });
  });

  it('여러 레코드를 하나도 빠뜨리지 않는다', async () => {
    await seedLegacyDb([
      { key: PORTFOLIO_STATE_KEY, value: { savedName: '자동 저장' } },
      { key: 'slot-a', value: { savedName: '은퇴 계획' } },
      { key: 'slot-b', value: { savedName: '월세형' } }
    ]);

    await resolvePortfolioDbName();

    const moved = await readRecords(PORTFOLIO_DB_NAMES.current);
    expect(moved.map((record) => record.key).sort()).toEqual([PORTFOLIO_STATE_KEY, 'slot-a', 'slot-b'].sort());
  });

  it('이관을 마치면 표식을 남긴다 (다음 부팅은 그냥 건너뛴다)', async () => {
    await seedLegacyDb([{ key: PORTFOLIO_STATE_KEY, value: { savedName: 'x' } }]);

    await resolvePortfolioDbName();

    expect(window.localStorage.getItem(MIGRATED_KEY)).not.toBeNull();
  });

  it('옮긴 뒤 옛 DB 를 지운다', async () => {
    await seedLegacyDb([{ key: PORTFOLIO_STATE_KEY, value: { savedName: 'x' } }]);

    await resolvePortfolioDbName();

    const names = await listDatabaseNames();
    // `databases()` 가 없는 환경에서는 목록이 비어 검사를 건너뛴다(그 자체가 실패는 아니다).
    if (names.length > 0) expect(names).not.toContain(PORTFOLIO_DB_NAMES.legacy);
  });
});

describe('이관: 새 사용자', () => {
  it('옛 DB 가 없으면 새 이름을 쓰고 옛 DB 를 만들지 않는다', async () => {
    /**
     * 🔴 `indexedDB.open(옛이름)` 으로 존재를 확인하면 **없는 DB 를 만들어 버린다**. 첫 방문자
     * 브라우저에 빈 DB 를 남기는 것은 `workspaceMarker` 가 IndexedDB 를 안 읽는 이유와 같은 종류의
     * 오염이다.
     */
    const name = await resolvePortfolioDbName();

    expect(name).toBe(PORTFOLIO_DB_NAMES.current);
    const names = await listDatabaseNames();
    if (names.length > 0) expect(names).not.toContain(PORTFOLIO_DB_NAMES.legacy);
  });
});

describe('이관: 이미 끝난 브라우저', () => {
  it('표식이 있으면 옛 DB 를 쳐다보지도 않는다', async () => {
    window.localStorage.setItem(MIGRATED_KEY, '1');
    // 표식이 있는데도 옛 DB 를 읽으면 이 레코드가 새 DB 로 넘어올 것이다 — 넘어오면 안 된다.
    await seedLegacyDb([{ key: 'stale', value: { savedName: '옛 값' } }]);

    const name = await resolvePortfolioDbName();

    expect(name).toBe(PORTFOLIO_DB_NAMES.current);
    const current = await readRecords(PORTFOLIO_DB_NAMES.current);
    expect(current.map((record) => record.key)).not.toContain('stale');
  });
});

describe('이관: 새 DB 에 이미 값이 있을 때', () => {
  it('옛 값으로 덮어쓰지 않는다', async () => {
    // 새 코드가 이미 쓴 값이 정본이다. 옛 값에 밀리면 사용자가 방금 한 저장이 사라진다.
    await writePersistedAppState({ ...buildDefaultPayload(), savedName: '새로 저장' });
    resetPortfolioDbNameCache();
    window.localStorage.removeItem(MIGRATED_KEY);
    await seedLegacyDb([{ key: PORTFOLIO_STATE_KEY, value: { savedName: '옛 값' } }]);

    await resolvePortfolioDbName();

    const records = await readRecords(PORTFOLIO_DB_NAMES.current);
    const autosave = records.find((record) => record.key === PORTFOLIO_STATE_KEY);
    expect((autosave?.value as { savedName?: string } | undefined)?.savedName).toBe('새로 저장');
  });
});

describe('왕복: 이관된 데이터를 앱이 그대로 읽는다', () => {
  it('옛 DB 에 저장해 두었던 포트폴리오가 이관 뒤에도 열린다', async () => {
    /**
     * 🔴 이 테스트가 이 파일의 존재 이유다. 레코드가 새 DB 에 "있다"는 것과 **앱이 읽어 화면에 세운다**는
     * 것은 다른 문제다 — 스토어 이름·keyPath·버전 중 하나만 어긋나도 옮기기는 성공하고 읽기는 실패한다.
     */
    resetPortfolioDbNameCache();
    window.localStorage.setItem(MIGRATED_KEY, '1');
    await writePersistedAppState({ ...buildDefaultPayload(), savedName: '이사 전 저장' });

    // 방금 쓴 새 DB 를 옛 DB 인 것처럼 옮겨 놓고, 이관을 처음부터 다시 돌린다.
    const seeded = await readRecords(PORTFOLIO_DB_NAMES.current);
    await deleteDb(PORTFOLIO_DB_NAMES.current);
    await seedLegacyDb(seeded);
    window.localStorage.removeItem(MIGRATED_KEY);
    resetPortfolioDbNameCache();

    const result = await readPersistedAppState();

    expect(result.ok).toBe(true);
    expect(result.payload.savedName).toBe('이사 전 저장');
  });
});
