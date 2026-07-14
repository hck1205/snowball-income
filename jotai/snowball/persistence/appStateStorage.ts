import type { PersistedAppStatePayload } from '../types';
import { buildDefaultPayload, normalizePersistedAppState } from './appStateNormalize';
import {
  buildStoreRecord,
  resolveNextSavedName,
  toSavedStateSummaries,
  toSnapshotKey,
  PORTFOLIO_STATE_KEY,
  type PortfolioStoreRecord,
  type SavedStateSummary
} from './appStateRecords';

const PORTFOLIO_DB_NAME = 'snowball-income-db';
const PORTFOLIO_DB_VERSION = 1;
const PORTFOLIO_STORE_NAME = 'app_state';

/**
 * 읽기 결과. 실패해도 앱이 계속 돌아가도록 기본 페이로드를 함께 넘기되,
 * **실패했다는 사실 자체를 호출자가 알 수 있어야** 한다 (`ok: false`).
 * 호출자는 이 신호를 보고 자동 저장으로 기존 데이터를 덮어쓰지 않도록 막는다.
 */
export type PersistedAppStateReadResult =
  | { ok: true; payload: PersistedAppStatePayload }
  | { ok: false; payload: PersistedAppStatePayload; error: unknown };

/** 명시적 복구 결과. `backupJson` 은 삭제 직전 스냅샷 (읽기조차 실패하면 null). */
export type PortfolioDbRecovery = {
  deleted: boolean;
  backupJson: string | null;
};

const hasIndexedDb = (): boolean => typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined';

const warnPersistenceFailure = (operation: string, error: unknown): void => {
  // 삭제하지 않는다. 사용자에게는 호출부가 기존 에러 표시 경로로 알린다.
  console.warn(`[snowball] IndexedDB ${operation} 실패 — 저장된 데이터는 보존됩니다.`, error);
};

const openPortfolioDb = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    if (!hasIndexedDb()) {
      reject(new Error('IndexedDB unavailable'));
      return;
    }

    const request = window.indexedDB.open(PORTFOLIO_DB_NAME, PORTFOLIO_DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(PORTFOLIO_STORE_NAME)) {
        db.createObjectStore(PORTFOLIO_STORE_NAME, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Failed to open IndexedDB'));
    // 다른 탭이 잡고 있으면 예전에는 영원히 pending 이었다. 명시적으로 실패시킨다.
    request.onblocked = () => reject(new Error('IndexedDB open blocked by another tab'));
  });

/** DB 핸들을 확실히 닫는다 (예전에는 예외 경로에서 핸들이 새어 다음 열기를 막았다). */
const withPortfolioDb = async <T>(run: (db: IDBDatabase) => Promise<T>): Promise<T> => {
  const db = await openPortfolioDb();
  try {
    return await run(db);
  } finally {
    db.close();
  }
};

const requestToPromise = <T>(request: IDBRequest<T>, message: string): Promise<T> =>
  new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error(message));
  });

const getRecord = (db: IDBDatabase, key: string): Promise<PortfolioStoreRecord | undefined> =>
  requestToPromise(
    db.transaction(PORTFOLIO_STORE_NAME, 'readonly').objectStore(PORTFOLIO_STORE_NAME).get(key) as IDBRequest<
      PortfolioStoreRecord | undefined
    >,
    `Failed to read portfolio state: ${key}`
  );

/**
 * 자동 저장 슬롯을 읽는다.
 *
 * **어떤 실패에도 DB 를 삭제하지 않는다.** 예전에는 여기서 `resetPortfolioDb()` 를 불러
 * 일시적 오류(다른 탭의 blocked, 용량 초과, 사파리 ITP, 프라이빗 모드)만으로도
 * 사용자의 모든 저장 슬롯이 되돌릴 수 없이 지워졌다.
 */
export const readPersistedAppState = async (): Promise<PersistedAppStateReadResult> => {
  try {
    const record = await withPortfolioDb((db) => getRecord(db, PORTFOLIO_STATE_KEY));
    if (!record?.value) {
      return { ok: true, payload: buildDefaultPayload() };
    }
    return { ok: true, payload: normalizePersistedAppState(record.value) };
  } catch (error) {
    warnPersistenceFailure('read', error);
    return { ok: false, payload: buildDefaultPayload(), error };
  }
};

/** 실패를 빈 목록으로 위장하지 않는다 (빈 목록은 "저장한 게 없다"는 뜻이어야 한다). */
export const listPersistedStateNames = async (): Promise<SavedStateSummary[]> => {
  try {
    const records = await withPortfolioDb((db) =>
      requestToPromise(
        db.transaction(PORTFOLIO_STORE_NAME, 'readonly').objectStore(PORTFOLIO_STORE_NAME).getAll() as IDBRequest<
          PortfolioStoreRecord[]
        >,
        'Failed to list portfolio states'
      )
    );

    return toSavedStateSummaries(records ?? []);
  } catch (error) {
    warnPersistenceFailure('list', error);
    throw error;
  }
};

/** `null` 은 "그 이름의 저장 항목이 없다"는 뜻이다. IO 실패는 던진다 (구분되어야 한다). */
export const readPersistedAppStateByName = async (name: string): Promise<PersistedAppStatePayload | null> => {
  const snapshotKey = toSnapshotKey(name);
  if (!snapshotKey) return null;

  try {
    const record = await withPortfolioDb((db) => getRecord(db, snapshotKey));
    if (!record) return null;
    return normalizePersistedAppState(record.value);
  } catch (error) {
    warnPersistenceFailure('read-named', error);
    throw error;
  }
};

export const writePersistedAppStateByName = async (name: string, state: PersistedAppStatePayload): Promise<void> => {
  const trimmedName = name.trim();
  const snapshotKey = toSnapshotKey(trimmedName);
  if (!snapshotKey) return;

  try {
    await withPortfolioDb((db) =>
      requestToPromise(
        db
          .transaction(PORTFOLIO_STORE_NAME, 'readwrite')
          .objectStore(PORTFOLIO_STORE_NAME)
          .put(buildStoreRecord(snapshotKey, state, trimmedName, Date.now())),
        'Failed to write named portfolio state'
      )
    );
  } catch (error) {
    // 조용히 삼키면 사용자는 저장된 줄 안다. 호출부(TickerCreation)가 '저장에 실패했습니다'를 띄운다.
    warnPersistenceFailure('write-named', error);
    throw error;
  }
};

/** `false` 는 "이름이 비어 삭제할 대상이 없다"는 뜻이다. IO 실패는 던진다. */
export const deletePersistedAppStateByName = async (name: string): Promise<boolean> => {
  const snapshotKey = toSnapshotKey(name);
  if (!snapshotKey) return false;

  try {
    await withPortfolioDb((db) =>
      requestToPromise(
        db.transaction(PORTFOLIO_STORE_NAME, 'readwrite').objectStore(PORTFOLIO_STORE_NAME).delete(snapshotKey),
        'Failed to delete named portfolio state'
      )
    );
    return true;
  } catch (error) {
    warnPersistenceFailure('delete-named', error);
    throw error;
  }
};

export const writePersistedAppState = async (state: PersistedAppStatePayload): Promise<void> => {
  try {
    await withPortfolioDb(
      (db) =>
        new Promise<void>((resolve, reject) => {
          const store = db.transaction(PORTFOLIO_STORE_NAME, 'readwrite').objectStore(PORTFOLIO_STORE_NAME);
          const readRequest = store.get(PORTFOLIO_STATE_KEY);

          readRequest.onerror = () => reject(readRequest.error ?? new Error('Failed to read previous portfolio state'));
          readRequest.onsuccess = () => {
            const previous = readRequest.result as PortfolioStoreRecord | undefined;
            const nextSavedName = resolveNextSavedName(previous?.value?.savedName, state.savedName);

            const writeRequest = store.put(buildStoreRecord(PORTFOLIO_STATE_KEY, state, nextSavedName, Date.now()));
            writeRequest.onsuccess = () => resolve();
            writeRequest.onerror = () => reject(writeRequest.error ?? new Error('Failed to write portfolio state'));
          };
        })
    );
  } catch (error) {
    warnPersistenceFailure('write', error);
    throw error;
  }
};

/**
 * 진짜로 손상된 DB(스키마 불일치/`VersionError` 등 open 자체가 실패)를 위한 **명시적** 복구 경로.
 *
 * 어떤 자동 경로에서도 호출하지 않는다 — 자동 삭제가 바로 이 버그의 원인이었다.
 * 지우기 전에 현재 버전 그대로 열어(버전 미지정) 전체 레코드를 JSON 으로 백업해 돌려준다.
 * 호출자는 이 JSON 을 사용자에게 내려받게 한 뒤에야 삭제를 확정해야 한다.
 */
export const recoverCorruptedPortfolioDb = async (): Promise<PortfolioDbRecovery> => {
  if (!hasIndexedDb()) return { deleted: false, backupJson: null };

  const backupJson = await backupPortfolioDb();

  const deleted = await new Promise<boolean>((resolve) => {
    const request = window.indexedDB.deleteDatabase(PORTFOLIO_DB_NAME);
    request.onsuccess = () => resolve(true);
    request.onerror = () => resolve(false);
    request.onblocked = () => resolve(false);
  });

  return { deleted, backupJson };
};

/** 버전을 지정하지 않고 열어 업그레이드를 트리거하지 않는다 → 손상된 DB 도 읽을 가능성이 남는다. */
const backupPortfolioDb = async (): Promise<string | null> => {
  try {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = window.indexedDB.open(PORTFOLIO_DB_NAME);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error('Failed to open IndexedDB for backup'));
      request.onblocked = () => reject(new Error('IndexedDB backup blocked by another tab'));
    });

    try {
      if (!db.objectStoreNames.contains(PORTFOLIO_STORE_NAME)) return JSON.stringify([]);

      const records = await requestToPromise(
        db.transaction(PORTFOLIO_STORE_NAME, 'readonly').objectStore(PORTFOLIO_STORE_NAME).getAll() as IDBRequest<
          PortfolioStoreRecord[]
        >,
        'Failed to back up portfolio states'
      );

      return JSON.stringify(records ?? []);
    } finally {
      db.close();
    }
  } catch (error) {
    warnPersistenceFailure('backup', error);
    return null;
  }
};
