import { defaultYieldFormValues } from '@/shared/lib/snowball';
import { PRESET_TICKERS } from '@/shared/constants';
import type { PortfolioPersistedState, TickerProfile } from '@/shared/types/snowball';
import type { YearlySeriesKey } from '@/shared/constants';
import type { PersistedAppStatePayload, PersistedInvestmentSettings } from '../types';
import { EMPTY_PORTFOLIO_STATE } from '../atoms';

const PORTFOLIO_DB_NAME = 'snowball-income-db';
const PORTFOLIO_DB_VERSION = 1;
const PORTFOLIO_STORE_NAME = 'app_state';
const PORTFOLIO_STATE_KEY = 'yield_architect_portfolio';
const SNAPSHOT_KEY_PREFIX = 'snapshot:';
// 2026-02-16 11:30:00 KST (UTC+9) == 2026-02-16 02:30:00 UTC
const LEGACY_DATA_DELETE_CUTOFF_AT = Date.parse('2026-02-16T02:30:00.000Z');
const DEFAULT_VISIBLE_YEARLY_SERIES: Record<YearlySeriesKey, boolean> = {
  totalContribution: false,
  assetValue: false,
  annualDividend: false,
  monthlyDividend: true,
  cumulativeDividend: false
};

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

export const shouldDeleteLegacyState = (updatedAt: unknown): boolean => {
  const timestamp = Number(updatedAt);
  if (!Number.isFinite(timestamp) || timestamp <= 0) return true;
  return timestamp < LEGACY_DATA_DELETE_CUTOFF_AT;
};

const logLegacyDecision = (stateKey: string, updatedAt: unknown, shouldDelete: boolean) => {
  const timestamp = Number(updatedAt);
  const updatedAtIso = Number.isFinite(timestamp) && timestamp > 0 ? new Date(timestamp).toISOString() : 'unknown';
  const cutoffIso = new Date(LEGACY_DATA_DELETE_CUTOFF_AT).toISOString();

  if (shouldDelete) {
    console.info('[cleanup] 삭제 대상', { stateKey, updatedAt: updatedAtIso, cutoffAt: cutoffIso });
  } else {
    console.info('[cleanup] 유지', { stateKey, updatedAt: updatedAtIso, cutoffAt: cutoffIso });
  }
};

const DEFAULT_PERSISTED_INVESTMENT_SETTINGS: PersistedInvestmentSettings = {
  initialInvestment: defaultYieldFormValues.initialInvestment,
  monthlyContribution: defaultYieldFormValues.monthlyContribution,
  targetMonthlyDividend: defaultYieldFormValues.targetMonthlyDividend,
  investmentStartDate: defaultYieldFormValues.investmentStartDate,
  durationYears: defaultYieldFormValues.durationYears,
  reinvestDividends: defaultYieldFormValues.reinvestDividends,
  taxRate: defaultYieldFormValues.taxRate,
  reinvestTiming: defaultYieldFormValues.reinvestTiming,
  dpsGrowthMode: defaultYieldFormValues.dpsGrowthMode,
  showQuickEstimate: false,
  showSplitGraphs: false,
  isResultCompact: false,
  isYearlyAreaFillOn: false,
  showPortfolioDividendCenter: false,
  visibleYearlySeries: DEFAULT_VISIBLE_YEARLY_SERIES
};

const createSamplePortfolioState = (): PortfolioPersistedState => {
  const sampleTickers = [
    { preset: PRESET_TICKERS.JEPI, weight: 40 },
    { preset: PRESET_TICKERS.SCHD, weight: 40 },
    { preset: PRESET_TICKERS.DGRO, weight: 20 }
  ];
  const tickerProfiles = sampleTickers.map(({ preset }, index) => ({
    id: `sample-${preset.ticker.toLowerCase()}-${index + 1}`,
    ...preset
  }));
  const includedTickerIds = tickerProfiles.map((profile) => profile.id);
  const weightByTickerId = tickerProfiles.reduce<Record<string, number>>((acc, profile, index) => {
    acc[profile.id] = sampleTickers[index]?.weight ?? 0;
    return acc;
  }, {});
  const fixedByTickerId = tickerProfiles.reduce<Record<string, boolean>>((acc, profile) => {
    acc[profile.id] = false;
    return acc;
  }, {});

  return {
    tickerProfiles,
    includedTickerIds,
    weightByTickerId,
    fixedByTickerId,
    selectedTickerId: tickerProfiles[0]?.id ?? null
  };
};

const DEFAULT_PERSISTED_PORTFOLIO_STATE = createSamplePortfolioState();
const DEFAULT_SAMPLE_INVESTMENT_SETTINGS: PersistedInvestmentSettings = {
  ...DEFAULT_PERSISTED_INVESTMENT_SETTINGS,
  monthlyContribution: 2_000_000,
  targetMonthlyDividend: 1_000_000,
  durationYears: 10,
  reinvestDividends: true,
  showPortfolioDividendCenter: true
};

const sanitizeTickerProfile = (input: unknown): TickerProfile | null => {
  if (!input || typeof input !== 'object') return null;

  const parsed = input as Record<string, unknown>;
  const ticker = typeof parsed.ticker === 'string' ? parsed.ticker.trim() : '';
  const id = typeof parsed.id === 'string' ? parsed.id.trim() : '';
  const initialPrice = Number(parsed.initialPrice);
  const dividendYield = Number(parsed.dividendYield);
  const dividendGrowth = Number(parsed.dividendGrowth);
  const expectedTotalReturnRaw = Number(parsed.expectedTotalReturn);
  const legacyPriceGrowth = Number(parsed.priceGrowth);
  const frequency = parsed.frequency;

  if (!id || !ticker) return null;
  if (!Number.isFinite(initialPrice) || initialPrice <= 0) return null;
  if (!Number.isFinite(dividendYield) || dividendYield < 0) return null;
  if (!Number.isFinite(dividendGrowth) || dividendGrowth < 0) return null;
  if (frequency !== 'monthly' && frequency !== 'quarterly' && frequency !== 'semiannual' && frequency !== 'annual') return null;

  const expectedTotalReturn =
    Number.isFinite(expectedTotalReturnRaw)
      ? expectedTotalReturnRaw
      : (Number.isFinite(legacyPriceGrowth) ? legacyPriceGrowth + dividendYield : dividendYield);

  return {
    id,
    ticker,
    initialPrice,
    dividendYield,
    dividendGrowth,
    expectedTotalReturn,
    frequency
  };
};

const sanitizePortfolioState = (input: unknown): PortfolioPersistedState => {
  if (!input || typeof input !== 'object') return EMPTY_PORTFOLIO_STATE;
  const parsed = input as PortfolioPersistedState;
  const profiles = (Array.isArray(parsed.tickerProfiles) ? parsed.tickerProfiles : [])
    .map((profile) => sanitizeTickerProfile(profile))
    .filter((profile): profile is TickerProfile => profile !== null);
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
  const initialInvestment = Number(parsed.initialInvestment);
  const monthlyContribution = Number(parsed.monthlyContribution);
  const targetMonthlyDividend = Number(parsed.targetMonthlyDividend);
  const durationYears = Number(parsed.durationYears);
  const taxRate = parsed.taxRate === undefined ? undefined : Number(parsed.taxRate);
  const investmentStartDate = typeof parsed.investmentStartDate === 'string' ? parsed.investmentStartDate : '';
  const rawVisibleYearlySeries = parsed.visibleYearlySeries as Record<string, unknown> | undefined;
  const visibleYearlySeries: Record<YearlySeriesKey, boolean> = {
    totalContribution:
      typeof rawVisibleYearlySeries?.totalContribution === 'boolean'
        ? rawVisibleYearlySeries.totalContribution
        : DEFAULT_VISIBLE_YEARLY_SERIES.totalContribution,
    assetValue:
      typeof rawVisibleYearlySeries?.assetValue === 'boolean'
        ? rawVisibleYearlySeries.assetValue
        : DEFAULT_VISIBLE_YEARLY_SERIES.assetValue,
    annualDividend:
      typeof rawVisibleYearlySeries?.annualDividend === 'boolean'
        ? rawVisibleYearlySeries.annualDividend
        : DEFAULT_VISIBLE_YEARLY_SERIES.annualDividend,
    monthlyDividend:
      typeof rawVisibleYearlySeries?.monthlyDividend === 'boolean'
        ? rawVisibleYearlySeries.monthlyDividend
        : DEFAULT_VISIBLE_YEARLY_SERIES.monthlyDividend,
    cumulativeDividend:
      typeof rawVisibleYearlySeries?.cumulativeDividend === 'boolean'
        ? rawVisibleYearlySeries.cumulativeDividend
        : DEFAULT_VISIBLE_YEARLY_SERIES.cumulativeDividend
  };

  return {
    initialInvestment: Number.isFinite(initialInvestment) ? Math.max(0, initialInvestment) : DEFAULT_PERSISTED_INVESTMENT_SETTINGS.initialInvestment,
    monthlyContribution: Number.isFinite(monthlyContribution) ? Math.max(0, monthlyContribution) : DEFAULT_PERSISTED_INVESTMENT_SETTINGS.monthlyContribution,
    targetMonthlyDividend: Number.isFinite(targetMonthlyDividend) ? Math.max(0, targetMonthlyDividend) : DEFAULT_PERSISTED_INVESTMENT_SETTINGS.targetMonthlyDividend,
    investmentStartDate: /^\d{4}-\d{2}-\d{2}$/.test(investmentStartDate)
      ? investmentStartDate
      : DEFAULT_PERSISTED_INVESTMENT_SETTINGS.investmentStartDate,
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
    showSplitGraphs: typeof parsed.showSplitGraphs === 'boolean' ? parsed.showSplitGraphs : DEFAULT_PERSISTED_INVESTMENT_SETTINGS.showSplitGraphs,
    isResultCompact:
      typeof parsed.isResultCompact === 'boolean' ? parsed.isResultCompact : DEFAULT_PERSISTED_INVESTMENT_SETTINGS.isResultCompact,
    isYearlyAreaFillOn:
      typeof parsed.isYearlyAreaFillOn === 'boolean' ? parsed.isYearlyAreaFillOn : DEFAULT_PERSISTED_INVESTMENT_SETTINGS.isYearlyAreaFillOn,
    showPortfolioDividendCenter:
      typeof parsed.showPortfolioDividendCenter === 'boolean'
        ? parsed.showPortfolioDividendCenter
        : DEFAULT_PERSISTED_INVESTMENT_SETTINGS.showPortfolioDividendCenter,
    visibleYearlySeries
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

const buildDefaultPayload = (): PersistedAppStatePayload => ({
  portfolio: DEFAULT_PERSISTED_PORTFOLIO_STATE,
  investmentSettings: DEFAULT_SAMPLE_INVESTMENT_SETTINGS,
  savedName: undefined
});

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

const deleteStateByKey = async (key: string): Promise<void> => {
  const db = await openPortfolioDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(PORTFOLIO_STORE_NAME, 'readwrite');
    const store = tx.objectStore(PORTFOLIO_STORE_NAME);
    const request = store.delete(key);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error ?? new Error('Failed to delete portfolio state'));
  });
  db.close();
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
    const shouldDelete = shouldDeleteLegacyState(result.updatedAt);
    logLegacyDecision(PORTFOLIO_STATE_KEY, result.updatedAt, shouldDelete);
    if (shouldDelete) {
      console.info('[cleanup] 삭제 시작', { stateKey: PORTFOLIO_STATE_KEY });
      await deleteStateByKey(PORTFOLIO_STATE_KEY);
      return buildDefaultPayload();
    }
    return normalizePersistedAppState(result.value);
  } catch {
    return buildDefaultPayload();
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
      .filter((record) => !shouldDeleteLegacyState(record.updatedAt))
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
    const stateKey = `${SNAPSHOT_KEY_PREFIX}${trimmedName}`;
    const shouldDelete = shouldDeleteLegacyState(record.updatedAt);
    logLegacyDecision(stateKey, record.updatedAt, shouldDelete);
    if (shouldDelete) {
      console.info('[cleanup] 삭제 시작', { stateKey });
      await deleteStateByKey(stateKey);
      return null;
    }
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
