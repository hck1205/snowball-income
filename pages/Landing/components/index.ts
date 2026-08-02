export { default as ClosingCta } from './ClosingCta';
export { default as CompoundExplainer } from './CompoundExplainer';
export { default as ConceptLadder } from './ConceptLadder';
export { default as LandingFaq } from './LandingFaq';
export { default as LandingSearch } from './LandingSearch';
export { default as LandingSection } from './LandingSection';
export { default as PayoutRhythm } from './PayoutRhythm';
export { default as PresetBrowser } from './PresetBrowser';
export { default as StartChecklist } from './StartChecklist';

export type { LandingSectionEmphasis, LandingSectionTone } from './LandingSection';
export type { LandingTickerEntry } from './LandingSearch';
export {
  LANDING_SEARCH_DEBOUNCE_MS,
  LANDING_SEARCH_FALLBACK_ENTRIES,
  LANDING_SEARCH_MIN_QUERY_LENGTH,
  LANDING_SEARCH_QUERY_PARAM,
  LANDING_SEARCH_RESULT_LIMIT,
  LANDING_TICKER_INDEX,
  isSearchableQuery,
  searchTickerPages
} from './LandingSearch';
export type { PayoutRhythmRow } from './PayoutRhythm';
export { RHYTHM_MONTHS, buildPayoutRhythmRows } from './PayoutRhythm';
export type { PresetAllocationSegment, PresetGroupTone } from './PresetBrowser';
export { buildAllocationSegments, formatAllocationText } from './PresetBrowser';
