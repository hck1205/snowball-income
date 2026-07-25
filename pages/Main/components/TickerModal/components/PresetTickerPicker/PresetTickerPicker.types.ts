import type { RefObject } from 'react';
import type { PresetTickerKey } from '@/shared/constants';
import type { TickerDraft } from '@/shared/types/snowball';
import type { PresetFilterState, PresetRanges } from '@/pages/Main/components/PresetFilterPanel';

export type PresetTickerPickerProps = {
  presetTickers: Record<PresetTickerKey, TickerDraft>;
  selectedPreset: 'custom' | PresetTickerKey;
  presetSearchKeyword: string;
  onChangeSearchKeyword: (keyword: string) => void;
  /** 드로어를 닫을 때 포커스를 되돌릴 트리거 — 포커스 복귀는 뷰(부모)가 소유한다. */
  filterTriggerRef: RefObject<HTMLButtonElement>;
  isFilterDrawerOpen: boolean;
  /** 트리거가 `aria-controls` 로 짝지을 드로어 id. */
  drawerId: string;
  onToggleFilterDrawer: () => void;
  presetFilter: PresetFilterState;
  presetRanges: PresetRanges;
  onChangeFilter: (next: PresetFilterState) => void;
  /** 텍스트 + 수치 필터가 모두 반영된 최종 목록. */
  filteredPresetKeys: PresetTickerKey[];
  /** 필터 이전 전체 프리셋 개수. */
  totalPresetCount: number;
  onSelectPreset: (preset: 'custom' | PresetTickerKey) => void;
};
