import type { PresetTickerKey } from '@/shared/constants';
import { toExpectedTotalReturnPercent } from '@/shared/lib/snowball';
import type { TickerDraft, TickerModalMode } from '@/shared/types/snowball';
import { getTickerDisplayName } from '@/shared/utils';

export type ListedTickerMeta = { name: string; issuer?: string };
export type ListedTickerMap = Record<string, ListedTickerMeta>;
export type TickerSearchRow = { ticker: string; name: string; issuer: string; tickerUpper: string; nameUpper: string };
export type ScoredTickerSearchRow = TickerSearchRow & { score: number };

/** Merges two listed-ticker maps into search rows; `primary` wins on duplicate tickers. */
export const buildTickerSearchRows = (primary: ListedTickerMap, secondary: ListedTickerMap): TickerSearchRow[] => {
  const merged = new Map<string, ListedTickerMeta>();
  for (const [ticker, meta] of Object.entries(primary)) merged.set(ticker.toUpperCase(), meta);
  for (const [ticker, meta] of Object.entries(secondary)) {
    const normalizedTicker = ticker.toUpperCase();
    if (!merged.has(normalizedTicker)) merged.set(normalizedTicker, meta);
  }

  return Array.from(merged.entries()).map(([ticker, meta]) => ({
    ticker,
    name: meta.name ?? '',
    issuer: meta.issuer ?? '',
    tickerUpper: ticker,
    nameUpper: (meta.name ?? '').toUpperCase()
  }));
};

/**
 * Ranks rows against a keyword: exact ticker > prefix > substring, plus a bonus per matching character.
 * Ties break alphabetically. Empty keyword yields no results.
 */
export const scoreTickerSearch = ({
  rows,
  keyword,
  maxResults
}: {
  rows: TickerSearchRow[];
  keyword: string;
  maxResults: number;
}): ScoredTickerSearchRow[] => {
  const query = keyword.toUpperCase();
  if (!query) return [];

  const queryChars = Array.from(new Set(query.replace(/[^A-Z0-9]/g, '').split('').filter(Boolean)));

  return rows
    .map((row) => {
      const searchableTicker = row.tickerUpper;
      const includesQuery = searchableTicker.includes(query);
      const charHitCount = queryChars.reduce((count, char) => (searchableTicker.includes(char) ? count + 1 : count), 0);
      if (!includesQuery && charHitCount === 0) return null;

      let score = charHitCount * 12;
      if (row.tickerUpper === query) score += 1200;
      else if (row.tickerUpper.startsWith(query)) score += 800;
      else if (row.tickerUpper.includes(query)) score += 520;

      return { ...row, score };
    })
    .filter((item): item is ScoredTickerSearchRow => item !== null)
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      return left.ticker.localeCompare(right.ticker, 'en', { sensitivity: 'base' });
    })
    .slice(0, maxResults);
};

/** Sorts preset keys by their display label. */
export const sortPresetKeys = (presetTickers: Record<PresetTickerKey, TickerDraft>): PresetTickerKey[] =>
  (Object.keys(presetTickers) as PresetTickerKey[]).sort((leftKey, rightKey) => {
    const leftLabel = getTickerDisplayName(presetTickers[leftKey].ticker, presetTickers[leftKey].name);
    const rightLabel = getTickerDisplayName(presetTickers[rightKey].ticker, presetTickers[rightKey].name);
    return leftLabel.localeCompare(rightLabel, 'en', { sensitivity: 'base' });
  });

/** Keeps preset keys whose ticker, display name, or Korean name contains the keyword. */
export const filterPresetKeys = ({
  presetKeys,
  presetTickers,
  koreanNameByTicker,
  keyword
}: {
  presetKeys: PresetTickerKey[];
  presetTickers: Record<PresetTickerKey, TickerDraft>;
  koreanNameByTicker: Record<PresetTickerKey, string>;
  keyword: string;
}): PresetTickerKey[] => {
  const query = keyword.trim().toUpperCase();
  if (!query) return presetKeys;

  return presetKeys.filter((presetKey) => {
    const ticker = presetTickers[presetKey].ticker.toUpperCase();
    const displayName = getTickerDisplayName(presetTickers[presetKey].ticker, presetTickers[presetKey].name).toUpperCase();
    const koreanName = koreanNameByTicker[presetKey].toUpperCase();
    return ticker.includes(query) || displayName.includes(query) || koreanName.includes(query);
  });
};

/** True while the user is typing a brand new ticker instead of picking a preset. */
export const isCustomTickerInput = (mode: TickerModalMode, selectedPreset: 'custom' | PresetTickerKey): boolean =>
  mode === 'create' && selectedPreset === 'custom';

/** Blocks the create button while a hand-written draft is missing its ticker or has a blank number field. */
export const isTickerCreateDisabled = ({
  mode,
  selectedPreset,
  tickerDraft
}: {
  mode: TickerModalMode;
  selectedPreset: 'custom' | PresetTickerKey;
  tickerDraft: TickerDraft;
}): boolean =>
  isCustomTickerInput(mode, selectedPreset) &&
  (tickerDraft.ticker.trim() === '' ||
    Number.isNaN(tickerDraft.initialPrice) ||
    Number.isNaN(tickerDraft.dividendYield) ||
    Number.isNaN(tickerDraft.dividendGrowth) ||
    Number.isNaN(tickerDraft.expectedTotalReturn));

/** Empty number inputs become NaN so the draft stays visibly blank instead of snapping to 0. */
export const parseNumericInputOrNaN = (rawValue: string): number => (rawValue === '' ? Number.NaN : Number(rawValue));

/**
 * 정합 모델: `expectedTotalReturn` 은 입력이 아니라 파생값이다 (r = y + g).
 * 배당률/배당 성장률이 바뀔 때마다 드래프트의 총수익률을 다시 계산해 둔다.
 */
export const withDerivedTotalReturn = (draft: TickerDraft): TickerDraft => ({
  ...draft,
  expectedTotalReturn: toExpectedTotalReturnPercent(draft.dividendYield, draft.dividendGrowth)
});

/** 총수익률 분해 캡션. 값이 아직 비어 있으면 null 을 돌려 캡션을 감춘다. */
export const toTotalReturnCaption = (draft: TickerDraft): string | null => {
  if (!Number.isFinite(draft.dividendYield) || !Number.isFinite(draft.dividendGrowth)) return null;

  const totalReturn = toExpectedTotalReturnPercent(draft.dividendYield, draft.dividendGrowth);

  return `총수익률 ${totalReturn}% (배당 ${draft.dividendYield}% + 성장 ${draft.dividendGrowth}%)`;
};
