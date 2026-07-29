// per-icon named import → 이 아이콘만 번들에 포함된다(트리셰이킹).
import { Search } from 'lucide-react';
import { ModalBody } from '@/components/common';
import {
  ModalTickerSearchIcon,
  ModalTickerSearchInput,
  ModalTickerSearchWrap,
  PresetChipButton,
  PresetChipGrid,
  PresetChipScrollArea
} from '@/pages/Main/Main.shared.styled';
import { PresetFilterStatus, PresetFilterTrigger, countActiveFilters } from '@/pages/Main/components/PresetFilterPanel';
import { ANALYTICS_EVENT, trackEvent } from '@/shared/lib/analytics';
// 부모 배럴(../../index.ts)을 경유하면 TickerModal ↔ 하위 컴포넌트 순환이 된다 — 상대 경로로 직접 가져온다.
import { ModalCaption } from '../../TickerModal.styled';
import type { PresetTickerPickerProps } from './PresetTickerPicker.types';

/**
 * "프리셋" 탭의 상단 — 검색행(+ 필터 트리거)·활성 필터 상태줄·안내 캡션·프리셋 칩 목록.
 * TickerModal 본체에서 뷰 조각만 분리했다 — 필터 상태와 드로어 개폐는 부모가 소유한다.
 */
function PresetTickerPicker({
  presetTickers,
  selectedPreset,
  presetSearchKeyword,
  onChangeSearchKeyword,
  filterTriggerRef,
  isFilterDrawerOpen,
  drawerId,
  onToggleFilterDrawer,
  presetFilter,
  presetRanges,
  onChangeFilter,
  filteredPresetKeys,
  totalPresetCount,
  onSelectPreset
}: PresetTickerPickerProps) {
  return (
    <>
      <ModalTickerSearchWrap>
        <ModalTickerSearchIcon aria-hidden="true">
          <Search size={14} strokeWidth={1.8} aria-hidden focusable={false} />
        </ModalTickerSearchIcon>
        <ModalTickerSearchInput
          type="text"
          value={presetSearchKeyword}
          aria-label="프리셋 티커 검색"
          placeholder="프리셋 티커 검색"
          onChange={(event) => onChangeSearchKeyword(event.target.value)}
        />
        <PresetFilterTrigger
          ref={filterTriggerRef}
          isOpen={isFilterDrawerOpen}
          activeCount={countActiveFilters(presetFilter, presetRanges)}
          drawerId={drawerId}
          onToggle={onToggleFilterDrawer}
        />
      </ModalTickerSearchWrap>
      <PresetFilterStatus filter={presetFilter} ranges={presetRanges} onChange={onChangeFilter} />
      <ModalCaption>
        주의: 실시간 데이터가 아니기 때문에 실제 데이터와 다를 수 있습니다. 참고용으로만 사용해 주세요.
      </ModalCaption>
      <ModalCaption>
        표시: {filteredPresetKeys.length} / 전체: {totalPresetCount}
      </ModalCaption>
      {filteredPresetKeys.length > 0 ? (
        <PresetChipScrollArea>
          <PresetChipGrid role="listbox" aria-label="프리셋 티커 목록">
            {filteredPresetKeys.map((presetKey) => (
              <PresetChipButton
                key={presetKey}
                type="button"
                role="option"
                selected={selectedPreset === presetKey}
                aria-selected={selectedPreset === presetKey}
                aria-label={`${presetTickers[presetKey].ticker} 선택`}
                onClick={() => {
                  trackEvent(ANALYTICS_EVENT.CTA_CLICK, {
                    cta_name: 'ticker_preset_select',
                    ticker: presetTickers[presetKey].ticker
                  });
                  onSelectPreset(presetKey);
                }}
              >
                {presetTickers[presetKey].ticker}
              </PresetChipButton>
            ))}
          </PresetChipGrid>
        </PresetChipScrollArea>
      ) : (
        <ModalBody>일치하는 프리셋 티커가 없습니다. 입력 탭에서 직접 생성해주세요.</ModalBody>
      )}
    </>
  );
}

export default PresetTickerPicker;
