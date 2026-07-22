import type { Frequency } from '@/shared/types';

/**
 * 프리셋 수치 필터 상태.
 *
 * 경계 규칙(applyPresetFilters 와 일치): 각 범위는 **포함 경계**(min ≤ 값 ≤ max)다.
 * - `dyMax` 가 캡값(DIVIDEND_YIELD_CAP)이면 "상한 없음"(20%+ 커버드콜 포함)으로 취급.
 * - `etrMax` 가 캡값(EXPECTED_TOTAL_RETURN_CAP)이면 마찬가지로 상한 없음.
 * - `frequencies` 는 다중 선택 OR(빈 배열이면 주기 제약 없음).
 */
export type PresetFilterState = {
  dyMin: number;
  dyMax: number;
  priceMin: number;
  priceMax: number;
  etrMin: number;
  etrMax: number;
  frequencies: Frequency[];
};

/** 실제 프리셋 데이터에서 뽑은 슬라이더 상·하한. */
export type PresetRanges = {
  dyMin: number;
  dyMax: number;
  priceMin: number;
  priceMax: number;
  etrMin: number;
  etrMax: number;
};

/** 접힌 상태에서도 노출되는 제거형 활성 필터 태그. */
export type ActiveFilterTag = {
  id: 'dividendYield' | 'price' | 'expectedTotalReturn' | 'frequency';
  label: string;
  /** 이 필터만 초기화한 새 상태를 돌려준다(다른 필터는 보존). */
  clear: (state: PresetFilterState) => PresetFilterState;
};

/** 검색행 우측 아이콘 트리거. 드로어 열림/활성 개수를 반영한다. */
export type PresetFilterTriggerProps = {
  isOpen: boolean;
  activeCount: number;
  /** 여는 드로어의 id — `aria-controls` 로 짝을 맺는다. */
  drawerId: string;
  onToggle: () => void;
};

/** 검색행 아래 "필터 적용 중" 상태줄 + 제거형 태그(닫힌 상태에서도 노출). */
export type PresetFilterStatusProps = {
  filter: PresetFilterState;
  ranges: PresetRanges;
  onChange: (next: PresetFilterState) => void;
};

/** 모달 우측 슬라이드 드로어. 열릴 때만 마운트되며 포커스 트랩/ESC/포커스 복귀를 소유한다. */
export type PresetFilterDrawerProps = {
  open: boolean;
  drawerId: string;
  filter: PresetFilterState;
  ranges: PresetRanges;
  onChange: (next: PresetFilterState) => void;
  /** 텍스트+수치 필터가 모두 반영된 현재 결과 개수. */
  resultCount: number;
  onClose: () => void;
};
