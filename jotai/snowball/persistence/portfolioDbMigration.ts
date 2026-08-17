import { storageKey } from '@/shared/lib/storage';

/**
 * 포트폴리오 IndexedDB 를 **옛 이름에서 새 이름으로** 한 번 옮긴다.
 *
 * ```
 * snowball-income-db  →  hungryhippo-db      (스토어 app_state 그대로)
 * ```
 *
 * ## 여기가 이 저장소에서 가장 비싼 데이터다
 * localStorage 쪽(팔레트·연결·마커)은 잃어도 사용자가 다시 설정하면 그만이다. 이 DB 는 **사용자가
 * 직접 입력한 포트폴리오와 저장 슬롯**이라 잃으면 복구가 없다. 그래서 이 파일의 모든 분기는
 * "확신이 없으면 옛 DB 를 계속 쓴다" 로 기운다 — 이름이 안 바뀌는 것은 불편이고, 데이터가 없어지는
 * 것은 사고다.
 *
 * ## 절차
 * 1. 마커가 있으면 **아무것도 하지 않는다**(새 이름 반환). 매 부팅 비용이 localStorage 읽기 하나다.
 * 2. 옛 DB 가 실제로 있는지 본다. 🔴 `indexedDB.open(옛이름)` 으로 확인하면 **없는 DB 를 만들어 버린다** —
 *    첫 방문자 브라우저에 빈 DB 를 남긴다. 그래서 `databases()` 를 먼저 쓰고, 없는 환경에서만
 *    `onupgradeneeded` 로 "방금 생겼다"를 감지해 되돌린다.
 * 3. 옛 DB 가 없으면(= 신규 사용자) 마커만 남기고 끝.
 * 4. 있으면 전체 레코드를 새 DB 로 복사하고 **개수를 검증**한 뒤에야 마커를 남긴다.
 * 5. 마커를 남긴 **다음에** 옛 DB 를 지운다. 지우기 실패는 무해하다(마커가 재이관을 막는다).
 * 6. 어느 단계든 실패하면 **마커를 남기지 않고 옛 이름을 반환**한다 — 이번 세션은 옛 DB 로 정상
 *    동작하고, 다음 부팅이 다시 시도한다.
 *
 * ⚠ 결과는 **모듈 스코프에 메모이즈**된다. 읽기·쓰기가 매번 이 절차를 밟으면 자동 저장마다 DB 를
 *   두 번 여는 꼴이 된다.
 */

const LEGACY_DB_NAME = 'snowball-income-db';
const DB_NAME = 'hungryhippo-db';
const STORE_NAME = 'app_state';
const DB_VERSION = 1;

/** 이관 완료 표식. 값에 뜻을 싣지 마라 — 존재 여부만 본다. */
const MIGRATED_KEY = storageKey('idb-migrated:v1');

/** 이 파일 밖에서도 같은 이름을 쓰도록 내보낸다(스토어·버전은 이관 전후가 같다). */
export const PORTFOLIO_DB_STORE_NAME = STORE_NAME;
export const PORTFOLIO_DB_VERSION = DB_VERSION;

const hasIndexedDb = (): boolean => typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined';

const readMigrationMark = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(MIGRATED_KEY) !== null;
  } catch {
    // 저장소를 못 쓰면 마커를 못 읽는다 → 매번 이관을 시도한다. 멱등이라 안전하다(느릴 뿐).
    return false;
  }
};

const writeMigrationMark = (): void => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(MIGRATED_KEY, '1');
  } catch {
    // 마커를 못 남기면 다음 부팅이 다시 이관을 시도한다. 이미 옮긴 뒤라 복사가 한 번 더 도는 것뿐이다.
  }
};

type StoreRecord = { key: string } & Record<string, unknown>;

const requestToPromise = <T>(request: IDBRequest<T>, message: string): Promise<T> =>
  new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error(message));
  });

/**
 * 옛 DB 가 **이미 존재하는지** 만든 적 없이 판정한다.
 *
 * `indexedDB.databases()` 는 크로미움·사파리에 있고 파이어폭스에는 없다(2026-08 기준). 없는 환경에서는
 * 버전 없이 열어 보되, `onupgradeneeded` 가 뜨면 그 순간 **우리가 만든 것**이므로 트랜잭션을 접고
 * 지운다.
 */
const legacyDbExists = async (): Promise<boolean> => {
  const factory = window.indexedDB as IDBFactory & { databases?: () => Promise<{ name?: string }[]> };

  if (typeof factory.databases === 'function') {
    try {
      const list = await factory.databases();
      return list.some((entry) => entry.name === LEGACY_DB_NAME);
    } catch {
      // 목록 조회 실패 → 아래 탐침으로 떨어진다.
    }
  }

  return new Promise<boolean>((resolve) => {
    let created = false;
    const request = window.indexedDB.open(LEGACY_DB_NAME);

    request.onupgradeneeded = () => {
      // 버전 없이 열었는데 업그레이드가 걸렸다 = 방금 생겼다 = 원래 없었다.
      created = true;
    };
    request.onsuccess = () => {
      request.result.close();
      if (created) {
        window.indexedDB.deleteDatabase(LEGACY_DB_NAME);
        resolve(false);
        return;
      }
      resolve(true);
    };
    request.onerror = () => resolve(false);
    request.onblocked = () => resolve(false);
  });
};

const openDb = (name: string, version?: number): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const request = version === undefined ? window.indexedDB.open(name) : window.indexedDB.open(name, version);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME, { keyPath: 'key' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error(`Failed to open ${name}`));
    request.onblocked = () => reject(new Error(`${name} open blocked by another tab`));
  });

const readAllRecords = async (db: IDBDatabase): Promise<StoreRecord[]> => {
  if (!db.objectStoreNames.contains(STORE_NAME)) return [];
  return requestToPromise(
    db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).getAll() as IDBRequest<StoreRecord[]>,
    'Failed to read legacy portfolio records'
  );
};

const writeAllRecords = (db: IDBDatabase, records: StoreRecord[]): Promise<void> =>
  new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    // 🔴 새 DB 에 이미 값이 있으면 그쪽이 정본이다(새 코드가 이미 썼다). 옛 값으로 덮지 않는다.
    for (const record of records) {
      store.add(record).onerror = (event) => {
        // add 는 키가 이미 있으면 실패한다 — 그건 정상 경로이므로 트랜잭션을 죽이지 않는다.
        event.preventDefault();
        event.stopPropagation();
      };
    }

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('Failed to write migrated records'));
    transaction.onabort = () => reject(transaction.error ?? new Error('Migration transaction aborted'));
  });

/** 복사가 실제로 끝났는지 **새 DB 를 다시 열어** 센다. 트랜잭션 성공만 믿지 않는다. */
const verifyMigration = async (expectedKeys: string[]): Promise<boolean> => {
  if (expectedKeys.length === 0) return true;

  const db = await openDb(DB_NAME, DB_VERSION);
  try {
    const records = await readAllRecords(db);
    const actual = new Set(records.map((record) => record.key));
    return expectedKeys.every((key) => actual.has(key));
  } finally {
    db.close();
  }
};

const deleteLegacyDb = (): Promise<void> =>
  new Promise((resolve) => {
    const request = window.indexedDB.deleteDatabase(LEGACY_DB_NAME);
    // 어떤 결과든 진행한다 — 마커가 이미 있어 재이관은 없고, 남은 DB 는 용량만 차지한다.
    request.onsuccess = () => resolve();
    request.onerror = () => resolve();
    request.onblocked = () => resolve();
  });

const runMigration = async (): Promise<string> => {
  if (!hasIndexedDb()) return DB_NAME;
  if (readMigrationMark()) return DB_NAME;

  try {
    if (!(await legacyDbExists())) {
      writeMigrationMark();
      return DB_NAME;
    }

    const legacyDb = await openDb(LEGACY_DB_NAME);
    let records: StoreRecord[];
    try {
      records = await readAllRecords(legacyDb);
    } finally {
      legacyDb.close();
    }

    const nextDb = await openDb(DB_NAME, DB_VERSION);
    try {
      await writeAllRecords(nextDb, records);
    } finally {
      nextDb.close();
    }

    if (!(await verifyMigration(records.map((record) => record.key)))) {
      // 검증 실패 = 옮겨졌다고 믿을 수 없다. 옛 DB 를 그대로 쓰고 다음 부팅이 다시 시도한다.
      return LEGACY_DB_NAME;
    }

    writeMigrationMark();
    await deleteLegacyDb();
    return DB_NAME;
  } catch (error) {
    console.warn('[hungryhippo] IndexedDB 이관 실패 — 기존 데이터베이스를 그대로 사용합니다.', error);
    return LEGACY_DB_NAME;
  }
};

let pending: Promise<string> | null = null;

/**
 * 이번 세션이 실제로 열어야 할 DB 이름. **처음 한 번만** 이관을 돌리고 이후에는 같은 약속을 돌려준다.
 *
 * ⚠ 테스트에서 여러 시나리오를 돌리려면 `resetPortfolioDbNameCache()` 로 메모를 비워라.
 */
export const resolvePortfolioDbName = (): Promise<string> => {
  pending ??= runMigration();
  return pending;
};

/** 테스트 전용 — 모듈 스코프 메모를 비운다. */
export const resetPortfolioDbNameCache = (): void => {
  pending = null;
};

/** 테스트·진단용 이름 상수. */
export const PORTFOLIO_DB_NAMES = { current: DB_NAME, legacy: LEGACY_DB_NAME } as const;
