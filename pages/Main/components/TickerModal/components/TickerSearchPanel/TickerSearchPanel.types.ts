import type { PresetTickerKey } from '@/shared/constants';
import type { TickerDraft } from '@/shared/types/snowball';
import type { ScoredTickerSearchRow } from '../../TickerModal.utils';

export type TickerSearchPanelProps = {
  searchKeyword: string;
  /** 디바운스가 끝난 키워드 — 결과/안내문 분기의 기준이다. */
  debouncedSearchKeyword: string;
  searchResults: ScoredTickerSearchRow[];
  onChangeSearchKeyword: (keyword: string) => void;
  onSelectPreset: (preset: 'custom' | PresetTickerKey) => void;
  onChangeDraft: (updater: (prev: TickerDraft) => TickerDraft) => void;
};
