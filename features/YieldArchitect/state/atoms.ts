import { atom } from 'jotai';
import type { YieldFormValues } from '@/shared/types';
import { defaultYieldFormValues } from '../feature.utils';
import type { PortfolioPersistedState, TickerDraft, TickerModalMode, TickerProfile } from '../feature.types';

export const yieldFormAtom = atom<YieldFormValues>(defaultYieldFormValues);

const toTickerDraft = (values: {
  ticker: string;
  initialPrice: number;
  dividendYield: number;
  dividendGrowth: number;
  priceGrowth: number;
  frequency: YieldFormValues['frequency'];
}): TickerDraft => ({
  ticker: values.ticker,
  initialPrice: values.initialPrice,
  dividendYield: values.dividendYield,
  dividendGrowth: values.dividendGrowth,
  priceGrowth: values.priceGrowth,
  frequency: values.frequency
});

const EMPTY_PORTFOLIO_STATE: PortfolioPersistedState = {
  tickerProfiles: [],
  includedTickerIds: [],
  weightByTickerId: {},
  fixedByTickerId: {},
  selectedTickerId: null
};

const PORTFOLIO_DB_NAME = 'snowball-income-db';
const PORTFOLIO_DB_VERSION = 1;
const PORTFOLIO_STORE_NAME = 'app_state';
const PORTFOLIO_STATE_KEY = 'yield_architect_portfolio';

type PortfolioStoreRecord = {
  key: string;
  value: PersistedAppState;
  updatedAt: number;
};

type PersistedInvestmentSettings = {
  monthlyContribution: number;
  targetMonthlyDividend: number;
  durationYears: number;
  reinvestDividends: boolean;
  taxRate?: number;
  reinvestTiming: YieldFormValues['reinvestTiming'];
  dpsGrowthMode: YieldFormValues['dpsGrowthMode'];
  showQuickEstimate: boolean;
  showSplitGraphs: boolean;
};

type PersistedAppState = {
  portfolio: PortfolioPersistedState;
  investmentSettings: PersistedInvestmentSettings;
};

export type PersistedAppStatePayload = {
  portfolio: PortfolioPersistedState;
  investmentSettings: PersistedInvestmentSettings;
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
    const rawValue = result?.value;

    // Backward compatibility: old schema stored only portfolio object in `value`.
    if (rawValue && typeof rawValue === 'object' && !('portfolio' in rawValue)) {
      return {
        portfolio: sanitizePortfolioState(rawValue),
        investmentSettings: DEFAULT_PERSISTED_INVESTMENT_SETTINGS
      };
    }

    return {
      portfolio: sanitizePortfolioState(rawValue?.portfolio),
      investmentSettings: sanitizeInvestmentSettings(rawValue?.investmentSettings)
    };
  } catch {
    return {
      portfolio: EMPTY_PORTFOLIO_STATE,
      investmentSettings: DEFAULT_PERSISTED_INVESTMENT_SETTINGS
    };
  }
};

export const writePersistedAppState = async (state: PersistedAppStatePayload): Promise<void> => {
  try {
    const db = await openPortfolioDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(PORTFOLIO_STORE_NAME, 'readwrite');
      const store = tx.objectStore(PORTFOLIO_STORE_NAME);
      const request = store.put({
        key: PORTFOLIO_STATE_KEY,
        value: state,
        updatedAt: Date.now()
      } satisfies PortfolioStoreRecord);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error ?? new Error('Failed to write portfolio state'));
    });
    db.close();
  } catch {
    // ignore persist failures to avoid blocking UI flow
  }
};

export const activeHelpAtom = atom<string | null>(null);
export const isTickerModalOpenAtom = atom(false);
export const isConfigDrawerOpenAtom = atom(false);
export const tickerModalModeAtom = atom<TickerModalMode>('create');
export const editingTickerIdAtom = atom<string | null>(null);
export const showQuickEstimateAtom = atom(false);
export const tickerProfilesAtom = atom<TickerProfile[]>(EMPTY_PORTFOLIO_STATE.tickerProfiles);
export const selectedTickerIdAtom = atom<string | null>(EMPTY_PORTFOLIO_STATE.selectedTickerId);
export const includedTickerIdsAtom = atom<string[]>(EMPTY_PORTFOLIO_STATE.includedTickerIds);
export const weightByTickerIdAtom = atom<Record<string, number>>(EMPTY_PORTFOLIO_STATE.weightByTickerId);
export const fixedByTickerIdAtom = atom<Record<string, boolean>>(EMPTY_PORTFOLIO_STATE.fixedByTickerId);
export const tickerDraftAtom = atom<TickerDraft>(toTickerDraft(defaultYieldFormValues));
export const selectedPresetAtom = atom<
  'custom' | 'SCHD' | 'JEPI' | 'VIG' | 'DGRO' | 'VYM' | 'HDV' | 'DIVO' | 'NOBL' | 'SDY' | 'SPYD'
>('custom');
