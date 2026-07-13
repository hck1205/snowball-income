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

const openPortfolioDb = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || typeof window.indexedDB === 'undefined') {
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
  });

const resetPortfolioDb = async (): Promise<void> => {
  if (typeof window === 'undefined' || typeof window.indexedDB === 'undefined') return;

  await new Promise<void>((resolve) => {
    const request = window.indexedDB.deleteDatabase(PORTFOLIO_DB_NAME);
    request.onsuccess = () => resolve();
    request.onerror = () => resolve();
    request.onblocked = () => resolve();
  });
};

export const readPersistedAppState = async (): Promise<PersistedAppStatePayload> => {
  try {
    const db = await openPortfolioDb();
    const result = await new Promise<PortfolioStoreRecord | undefined>((resolve, reject) => {
      const tx = db.transaction(PORTFOLIO_STORE_NAME, 'readonly');
      const store = tx.objectStore(PORTFOLIO_STORE_NAME);
      const request = store.get(PORTFOLIO_STATE_KEY);
      request.onsuccess = () => resolve(request.result as PortfolioStoreRecord | undefined);
      request.onerror = () => reject(request.error ?? new Error('Failed to read portfolio state'));
    });
    db.close();
    if (!result?.value) {
      return buildDefaultPayload();
    }
    return normalizePersistedAppState(result.value);
  } catch {
    await resetPortfolioDb();
    return buildDefaultPayload();
  }
};

export const listPersistedStateNames = async (): Promise<SavedStateSummary[]> => {
  try {
    const db = await openPortfolioDb();
    const records = await new Promise<PortfolioStoreRecord[]>((resolve, reject) => {
      const tx = db.transaction(PORTFOLIO_STORE_NAME, 'readonly');
      const store = tx.objectStore(PORTFOLIO_STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => resolve((request.result as PortfolioStoreRecord[]) ?? []);
      request.onerror = () => reject(request.error ?? new Error('Failed to list portfolio states'));
    });
    db.close();

    return toSavedStateSummaries(records);
  } catch {
    await resetPortfolioDb();
    return [];
  }
};

export const readPersistedAppStateByName = async (name: string): Promise<PersistedAppStatePayload | null> => {
  const snapshotKey = toSnapshotKey(name);
  if (!snapshotKey) return null;

  try {
    const db = await openPortfolioDb();
    const record = await new Promise<PortfolioStoreRecord | undefined>((resolve, reject) => {
      const tx = db.transaction(PORTFOLIO_STORE_NAME, 'readonly');
      const store = tx.objectStore(PORTFOLIO_STORE_NAME);
      const request = store.get(snapshotKey);
      request.onsuccess = () => resolve(request.result as PortfolioStoreRecord | undefined);
      request.onerror = () => reject(request.error ?? new Error('Failed to read named portfolio state'));
    });
    db.close();

    if (!record) return null;
    return normalizePersistedAppState(record.value);
  } catch {
    await resetPortfolioDb();
    return null;
  }
};

export const writePersistedAppStateByName = async (name: string, state: PersistedAppStatePayload): Promise<void> => {
  const trimmedName = name.trim();
  const snapshotKey = toSnapshotKey(trimmedName);
  if (!snapshotKey) return;

  try {
    const db = await openPortfolioDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(PORTFOLIO_STORE_NAME, 'readwrite');
      const store = tx.objectStore(PORTFOLIO_STORE_NAME);
      const request = store.put(buildStoreRecord(snapshotKey, state, trimmedName, Date.now()));
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error ?? new Error('Failed to write named portfolio state'));
    });
    db.close();
  } catch {
    await resetPortfolioDb();
    // ignore persist failures to avoid blocking UI flow
  }
};

export const deletePersistedAppStateByName = async (name: string): Promise<boolean> => {
  const snapshotKey = toSnapshotKey(name);
  if (!snapshotKey) return false;

  try {
    const db = await openPortfolioDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(PORTFOLIO_STORE_NAME, 'readwrite');
      const store = tx.objectStore(PORTFOLIO_STORE_NAME);
      const request = store.delete(snapshotKey);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error ?? new Error('Failed to delete named portfolio state'));
    });
    db.close();
    return true;
  } catch {
    await resetPortfolioDb();
    return false;
  }
};

export const writePersistedAppState = async (state: PersistedAppStatePayload): Promise<void> => {
  try {
    const db = await openPortfolioDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(PORTFOLIO_STORE_NAME, 'readwrite');
      const store = tx.objectStore(PORTFOLIO_STORE_NAME);
      const readRequest = store.get(PORTFOLIO_STATE_KEY);
      readRequest.onerror = () => reject(readRequest.error ?? new Error('Failed to read previous portfolio state'));
      readRequest.onsuccess = () => {
        const previous = readRequest.result as PortfolioStoreRecord | undefined;
        const nextSavedName = resolveNextSavedName(previous?.value?.savedName, state.savedName);

        const writeRequest = store.put(buildStoreRecord(PORTFOLIO_STATE_KEY, state, nextSavedName, Date.now()));
        writeRequest.onsuccess = () => resolve();
        writeRequest.onerror = () => reject(writeRequest.error ?? new Error('Failed to write portfolio state'));
      };
    });
    db.close();
  } catch {
    await resetPortfolioDb();
    // ignore persist failures to avoid blocking UI flow
  }
};
