import { defaultYieldFormValues } from '@/shared/lib/snowball';
import type { PortfolioPersistedState } from '@/shared/types/snowball';
import type { PersistedAppStatePayload, PersistedInvestmentSettings } from '../types';
import { EMPTY_PORTFOLIO_STATE } from '../atoms';

const PORTFOLIO_DB_NAME = 'snowball-income-db';
const PORTFOLIO_DB_VERSION = 1;
const PORTFOLIO_STORE_NAME = 'app_state';
const PORTFOLIO_STATE_KEY = 'yield_architect_portfolio';
const SNAPSHOT_KEY_PREFIX = 'snapshot:';

type PersistedAppState = {
  portfolio: PortfolioPersistedState;
  investmentSettings: PersistedInvestmentSettings;
  savedName?: string;
};

type PortfolioStoreRecord = {
  key: string;
  value: PersistedAppState;
  updatedAt: number;
};

const DEFAULT_PERSISTED_INVESTMENT_SETTINGS: PersistedInvestmentSettings = {
  monthlyContribution: defaultYieldFormValues.monthlyContribution,
  targetMonthlyDividend: defaultYieldFormValues.targetMonthlyDividend,
  durationYears: defaultYieldFormValues.durationYears,
  reinvestDividends: defaultYieldFormValues.reinvestDividends,
  taxRate: defaultYieldFormValues.taxRate,
  reinvestTiming: defaultYieldFormValues.reinvestTiming,
  dpsGrowthMode: defaultYieldFormValues.dpsGrowthMode,
  showQuickEstimate: false,
  showSplitGraphs: false
};

const sanitizePortfolioState = (input: unknown): PortfolioPersistedState => {
  if (!input || typeof input !== 'object') return EMPTY_PORTFOLIO_STATE;
  const parsed = input as PortfolioPersistedState;
  const profiles = Array.isArray(parsed.tickerProfiles) ? parsed.tickerProfiles : [];
  const idSet = new Set(profiles.map((profile) => profile.id));
  const includedTickerIds = (Array.isArray(parsed.includedTickerIds) ? parsed.includedTickerIds : []).filter((id) => idSet.has(id));
  const weightByTickerId = Object.entries(parsed.weightByTickerId ?? {}).reduce<Record<string, number>>((acc, [id, value]) => {
    if (!idSet.has(id)) return acc;
    const next = Number(value);
    if (!Number.isFinite(next) || next < 0) return acc;
    acc[id] = next;
    return acc;
  }, {});
  const fixedByTickerId = Object.entries(parsed.fixedByTickerId ?? {}).reduce<Record<string, boolean>>((acc, [id, value]) => {
    if (!idSet.has(id)) return acc;
    acc[id] = Boolean(value);
    return acc;
  }, {});
  const selectedTickerId = parsed.selectedTickerId && idSet.has(parsed.selectedTickerId) ? parsed.selectedTickerId : null;

  return {
    tickerProfiles: profiles,
    includedTickerIds,
    weightByTickerId,
    fixedByTickerId,
    selectedTickerId
  };
};

const sanitizeInvestmentSettings = (input: unknown): PersistedInvestmentSettings => {
  if (!input || typeof input !== 'object') return DEFAULT_PERSISTED_INVESTMENT_SETTINGS;
  const parsed = input as Partial<PersistedInvestmentSettings>;
  const monthlyContribution = Number(parsed.monthlyContribution);
  const targetMonthlyDividend = Number(parsed.targetMonthlyDividend);
  const durationYears = Number(parsed.durationYears);
  const taxRate = parsed.taxRate === undefined ? undefined : Number(parsed.taxRate);

  return {
    monthlyContribution: Number.isFinite(monthlyContribution) ? Math.max(0, monthlyContribution) : DEFAULT_PERSISTED_INVESTMENT_SETTINGS.monthlyContribution,
    targetMonthlyDividend: Number.isFinite(targetMonthlyDividend) ? Math.max(0, targetMonthlyDividend) : DEFAULT_PERSISTED_INVESTMENT_SETTINGS.targetMonthlyDividend,
    durationYears: Number.isFinite(durationYears) ? Math.max(1, Math.trunc(durationYears)) : DEFAULT_PERSISTED_INVESTMENT_SETTINGS.durationYears,
    reinvestDividends:
      typeof parsed.reinvestDividends === 'boolean'
        ? parsed.reinvestDividends
        : DEFAULT_PERSISTED_INVESTMENT_SETTINGS.reinvestDividends,
    taxRate: taxRate !== undefined && Number.isFinite(taxRate) ? Math.max(0, Math.min(100, taxRate)) : DEFAULT_PERSISTED_INVESTMENT_SETTINGS.taxRate,
    reinvestTiming:
      parsed.reinvestTiming === 'sameMonth' || parsed.reinvestTiming === 'nextMonth'
        ? parsed.reinvestTiming
        : DEFAULT_PERSISTED_INVESTMENT_SETTINGS.reinvestTiming,
    dpsGrowthMode:
      parsed.dpsGrowthMode === 'annualStep' || parsed.dpsGrowthMode === 'monthlySmooth'
        ? parsed.dpsGrowthMode
        : DEFAULT_PERSISTED_INVESTMENT_SETTINGS.dpsGrowthMode,
    showQuickEstimate:
      typeof parsed.showQuickEstimate === 'boolean' ? parsed.showQuickEstimate : DEFAULT_PERSISTED_INVESTMENT_SETTINGS.showQuickEstimate,
    showSplitGraphs: typeof parsed.showSplitGraphs === 'boolean' ? parsed.showSplitGraphs : DEFAULT_PERSISTED_INVESTMENT_SETTINGS.showSplitGraphs
  };
};

const sanitizeSavedName = (input: unknown): string | undefined => {
  if (typeof input !== 'string') return undefined;
  const trimmed = input.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

export const normalizePersistedAppState = (rawValue: unknown): PersistedAppStatePayload => {
  if (rawValue && typeof rawValue === 'object' && !('portfolio' in (rawValue as PersistedAppState))) {
    return {
      portfolio: sanitizePortfolioState(rawValue),
      investmentSettings: DEFAULT_PERSISTED_INVESTMENT_SETTINGS,
      savedName: undefined
    };
  }

  const parsed = rawValue as PersistedAppState | undefined;
  return {
    portfolio: sanitizePortfolioState(parsed?.portfolio),
    investmentSettings: sanitizeInvestmentSettings(parsed?.investmentSettings),
    savedName: sanitizeSavedName(parsed?.savedName)
  };
};

export const parsePersistedAppStateJson = (jsonText: string): PersistedAppStatePayload => {
  const parsed = JSON.parse(jsonText);
  return normalizePersistedAppState(parsed);
};

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
    return normalizePersistedAppState(result?.value);
  } catch {
    return {
      portfolio: EMPTY_PORTFOLIO_STATE,
      investmentSettings: DEFAULT_PERSISTED_INVESTMENT_SETTINGS,
      savedName: undefined
    };
  }
};

export const listPersistedStateNames = async (): Promise<Array<{ name: string; updatedAt: number }>> => {
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

    return records
      .filter((record) => record.key.startsWith(SNAPSHOT_KEY_PREFIX))
      .map((record) => ({
        name: sanitizeSavedName(record.value?.savedName) ?? record.key.slice(SNAPSHOT_KEY_PREFIX.length),
        updatedAt: Number.isFinite(record.updatedAt) ? record.updatedAt : 0
      }))
      .filter((item) => item.name.length > 0)
      .sort((a, b) => b.updatedAt - a.updatedAt);
  } catch {
    return [];
  }
};

export const readPersistedAppStateByName = async (name: string): Promise<PersistedAppStatePayload | null> => {
  const trimmedName = name.trim();
  if (!trimmedName) return null;

  try {
    const db = await openPortfolioDb();
    const record = await new Promise<PortfolioStoreRecord | undefined>((resolve, reject) => {
      const tx = db.transaction(PORTFOLIO_STORE_NAME, 'readonly');
      const store = tx.objectStore(PORTFOLIO_STORE_NAME);
      const request = store.get(`${SNAPSHOT_KEY_PREFIX}${trimmedName}`);
      request.onsuccess = () => resolve(request.result as PortfolioStoreRecord | undefined);
      request.onerror = () => reject(request.error ?? new Error('Failed to read named portfolio state'));
    });
    db.close();

    if (!record) return null;
    return normalizePersistedAppState(record.value);
  } catch {
    return null;
  }
};

export const writePersistedAppStateByName = async (name: string, state: PersistedAppStatePayload): Promise<void> => {
  const trimmedName = name.trim();
  if (!trimmedName) return;

  try {
    const db = await openPortfolioDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(PORTFOLIO_STORE_NAME, 'readwrite');
      const store = tx.objectStore(PORTFOLIO_STORE_NAME);
      const request = store.put({
        key: `${SNAPSHOT_KEY_PREFIX}${trimmedName}`,
        value: {
          ...state,
          savedName: trimmedName
        },
        updatedAt: Date.now()
      } satisfies PortfolioStoreRecord);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error ?? new Error('Failed to write named portfolio state'));
    });
    db.close();
  } catch {
    // ignore persist failures to avoid blocking UI flow
  }
};

export const deletePersistedAppStateByName = async (name: string): Promise<boolean> => {
  const trimmedName = name.trim();
  if (!trimmedName) return false;

  try {
    const db = await openPortfolioDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(PORTFOLIO_STORE_NAME, 'readwrite');
      const store = tx.objectStore(PORTFOLIO_STORE_NAME);
      const request = store.delete(`${SNAPSHOT_KEY_PREFIX}${trimmedName}`);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error ?? new Error('Failed to delete named portfolio state'));
    });
    db.close();
    return true;
  } catch {
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
        const previousSavedName = sanitizeSavedName(previous?.value?.savedName);
        const nextSavedName = sanitizeSavedName(state.savedName) ?? previousSavedName;

        const writeRequest = store.put({
          key: PORTFOLIO_STATE_KEY,
          value: {
            ...state,
            savedName: nextSavedName
          },
          updatedAt: Date.now()
        } satisfies PortfolioStoreRecord);
        writeRequest.onsuccess = () => resolve();
        writeRequest.onerror = () => reject(writeRequest.error ?? new Error('Failed to write portfolio state'));
      };
    });
    db.close();
  } catch {
    // ignore persist failures to avoid blocking UI flow
  }
};
