import type { PersistedAppStatePayload } from '../types';
import { buildDefaultPayload, normalizePersistedAppState } from './appStateNormalize';
import {
  buildStoreRecord,
  resolveNextSavedName,
  PORTFOLIO_STATE_KEY,
  type PortfolioStoreRecord
} from './appStateRecords';
import {
  PORTFOLIO_DB_STORE_NAME,
  PORTFOLIO_DB_VERSION,
  resolvePortfolioDbName
} from './portfolioDbMigration';
import { clearWorkspaceMarker, markWorkspaceStored } from './workspaceMarker';

/**
 * 🔴 DB **이름은 상수가 아니라 약속**이다(2026-08-17). 이름을 `snowball-income-db` →
 * `hungryhippo-db` 로 옮기면서, 이관이 끝났는지에 따라 이번 세션이 열어야 할 DB 가 달라진다 —
 * 이관 실패 시 옛 DB 를 계속 써야 사용자 포트폴리오가 살아 있다. 판정과 복사는
 * `portfolioDbMigration` 이 소유하고, 이 파일은 **그 결과 이름만 받아 쓴다**.
 * ⚠ 이름을 여기서 다시 하드코딩하지 마라 — 이관 실패 경로가 조용히 죽는다.
 */
const PORTFOLIO_STORE_NAME = PORTFOLIO_DB_STORE_NAME;

/**
 * 읽기 결과. 실패해도 앱이 계속 돌아가도록 기본 페이로드를 함께 넘기되,
 * **실패했다는 사실 자체를 호출자가 알 수 있어야** 한다 (`ok: false`).
 * 호출자는 이 신호를 보고 자동 저장으로 기존 데이터를 덮어쓰지 않도록 막는다.
 *
 * `updatedAt`(성공 시, 가법적 optional): autosave 레코드에 심긴 **클라이언트 저장시각**(Date.now()).
 * 세션 시작 latest-wins 동기화가 로컬 vs 클라우드 최신성을 비교하는 기준이다. 저장된 레코드가 없거나
 * (기본 페이로드) 구버전이라 시각이 없으면 undefined. 기존 `{ok, payload}` 계약은 그대로 유지된다.
 */
export type PersistedAppStateReadResult =
  | { ok: true; payload: PersistedAppStatePayload; updatedAt?: number }
  | { ok: false; payload: PersistedAppStatePayload; error: unknown };

/** 명시적 복구 결과. `backupJson` 은 삭제 직전 스냅샷 (읽기조차 실패하면 null). */
export type PortfolioDbRecovery = {
  deleted: boolean;
  backupJson: string | null;
};

const hasIndexedDb = (): boolean => typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined';

const warnPersistenceFailure = (operation: string, error: unknown): void => {
  // 삭제하지 않는다. 사용자에게는 호출부가 기존 에러 표시 경로로 알린다.
  console.warn(`[hungryhippo] IndexedDB ${operation} 실패 — 저장된 데이터는 보존됩니다.`, error);
};

const openPortfolioDb = async (): Promise<IDBDatabase> => {
  if (!hasIndexedDb()) throw new Error('IndexedDB unavailable');

  // 첫 호출에서만 이관이 돌고, 이후에는 메모된 이름이 즉시 온다.
  const databaseName = await resolvePortfolioDbName();

  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = window.indexedDB.open(databaseName, PORTFOLIO_DB_VERSION);

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
};

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
    const updatedAt = Number.isFinite(record.updatedAt) ? record.updatedAt : undefined;
    return { ok: true, payload: normalizePersistedAppState(record.value), updatedAt };
  } catch (error) {
    warnPersistenceFailure('read', error);
    return { ok: false, payload: buildDefaultPayload(), error };
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
    // 저장이 **성공한 뒤에만** 마커를 남긴다(랜딩의 "이어서 계산하기" 판단용 부기값).
    // 마커가 없던 기존 사용자도 다음 저장에서 자동 백필된다. 실패해도 저장은 이미 끝났다.
    markWorkspaceStored();
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
  // 이관이 끝났으면 새 DB, 실패했으면 옛 DB — 지금 실제로 쓰고 있는 쪽을 지워야 복구가 성립한다.
  const databaseName = await resolvePortfolioDbName();

  const deleted = await new Promise<boolean>((resolve) => {
    const request = window.indexedDB.deleteDatabase(databaseName);
    request.onsuccess = () => resolve(true);
    request.onerror = () => resolve(false);
    request.onblocked = () => resolve(false);
  });

  // 실제로 지워졌을 때만 마커를 거둔다 — blocked/실패면 데이터가 그대로 남아 있으므로 마커도 참이다.
  if (deleted) clearWorkspaceMarker();

  return { deleted, backupJson };
};

/** 버전을 지정하지 않고 열어 업그레이드를 트리거하지 않는다 → 손상된 DB 도 읽을 가능성이 남는다. */
const backupPortfolioDb = async (): Promise<string | null> => {
  try {
    const databaseName = await resolvePortfolioDbName();
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = window.indexedDB.open(databaseName);
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
