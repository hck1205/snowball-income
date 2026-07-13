import type { Frequency } from '@/shared/types';
import type { TickerDraft, TickerModalMode, TickerProfile } from '@/shared/types/snowball';

export const toTickerDraft = (values: {
  ticker: string;
  name?: string;
  initialPrice: number;
  dividendYield: number;
  dividendGrowth: number;
  expectedTotalReturn: number;
  frequency: Frequency;
}): TickerDraft => ({
  ticker: values.ticker,
  name: values.name ?? '',
  initialPrice: values.initialPrice,
  dividendYield: values.dividendYield,
  dividendGrowth: values.dividendGrowth,
  expectedTotalReturn: values.expectedTotalReturn,
  frequency: values.frequency
});

/** Effectful id generator; inject a deterministic one in tests. */
export const createTickerId = (): string => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

/** A draft is saveable when it has a non-blank ticker and every numeric field is finite. */
export const isTickerDraftValid = (draft: TickerDraft): boolean => {
  const hasTickerName = draft.ticker.trim() !== '';
  const hasFiniteNumbers = [draft.initialPrice, draft.dividendYield, draft.dividendGrowth, draft.expectedTotalReturn].every((value) =>
    Number.isFinite(value)
  );

  return hasTickerName && hasFiniteNumbers;
};

/**
 * Normalizes a draft into a persistable profile.
 * Creating from a preset drops the display name; editing keeps the existing id.
 */
export const buildTickerProfileFromDraft = ({
  draft,
  mode,
  isCustomPreset,
  editingTickerId,
  generateId
}: {
  draft: TickerDraft;
  mode: TickerModalMode;
  isCustomPreset: boolean;
  editingTickerId: string | null;
  generateId: () => string;
}): TickerProfile => {
  const displayName = draft.name.trim();

  return {
    ...draft,
    ticker: draft.ticker.trim(),
    name: mode === 'create' && !isCustomPreset ? '' : displayName,
    id: editingTickerId ?? generateId()
  };
};

export type TickerRemovalMode =
  /** Drops the profile entirely (ticker modal delete). */
  | 'delete'
  /** Keeps the profile but takes it out of the portfolio (chip x button). */
  | 'exclude';

export type TickerPortfolioState = {
  tickerProfiles: TickerProfile[];
  includedTickerIds: string[];
  weightByTickerId: Record<string, number>;
  fixedByTickerId: Record<string, boolean>;
  selectedTickerId: string | null;
};

export type TickerRemovalResult = TickerPortfolioState & {
  removedProfile: TickerProfile | null;
  /** Set only when the removal moved the selection; the caller applies it to the form. */
  nextSelectedProfile: TickerProfile | null;
  didChangeSelection: boolean;
};

/**
 * Recomputes the four portfolio maps and the selection after removing a ticker.
 * The selection falls back to the first remaining included ticker.
 */
export const applyTickerRemoval = (
  state: TickerPortfolioState,
  removingTickerId: string,
  mode: TickerRemovalMode
): TickerRemovalResult => {
  const removedProfile = state.tickerProfiles.find((profile) => profile.id === removingTickerId) ?? null;
  const includedTickerIds = state.includedTickerIds.filter((id) => id !== removingTickerId);
  const isDelete = mode === 'delete';

  const tickerProfiles = isDelete ? state.tickerProfiles.filter((profile) => profile.id !== removingTickerId) : state.tickerProfiles;

  let weightByTickerId = state.weightByTickerId;
  let fixedByTickerId = state.fixedByTickerId;
  if (isDelete) {
    const nextWeights = { ...state.weightByTickerId };
    delete nextWeights[removingTickerId];
    weightByTickerId = nextWeights;

    const nextFixed = { ...state.fixedByTickerId };
    delete nextFixed[removingTickerId];
    fixedByTickerId = nextFixed;
  } else {
    fixedByTickerId = { ...state.fixedByTickerId, [removingTickerId]: false };
  }

  const didChangeSelection = state.selectedTickerId === removingTickerId;
  const selectedTickerId = didChangeSelection ? includedTickerIds[0] ?? null : state.selectedTickerId;
  const nextSelectedProfile =
    didChangeSelection && selectedTickerId ? tickerProfiles.find((profile) => profile.id === selectedTickerId) ?? null : null;

  return {
    tickerProfiles,
    includedTickerIds,
    weightByTickerId,
    fixedByTickerId,
    selectedTickerId,
    removedProfile,
    nextSelectedProfile,
    didChangeSelection
  };
};
