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
import { PickerHintRow } from '../../TickerModal.styled';
import type { PresetTickerPickerProps } from './PresetTickerPicker.types';

/**
 * "프리셋" 탭의 상단 — 검색행(+ 필터 트리거)·활성 필터 상태줄·안내 캡션·프리셋 칩 목록.
 * TickerModal 본체에서 뷰 조각만 분리했다 — 필터 상태와 드로어 개폐는 부모가 소유한다.
 */
function PresetTickerPicker({
  presetTickers,
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
  stagedPresetKeys,
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
      {/*
        캡션 세 줄(면책 · 개수 · 다중선택 안내)을 **한 줄**로 눕혔다 — 셋 다 훑고 지나가는 정보인데
        쌓아 두면 목록보다 큰 덩어리가 됐다(2026-08-11). 면책은 같은 뜻의 짧은 형태로 줄였다.
      */}
      <PickerHintRow>
        <span>
          표시: {filteredPresetKeys.length} / 전체: {totalPresetCount}
        </span>
        <span>여러 개를 눌러 담기 · 참고용 시세(실시간 아님)</span>
      </PickerHintRow>
      {filteredPresetKeys.length > 0 ? (
        <PresetChipScrollArea>
          {/*
            🔴 `aria-multiselectable` 이다(2026-08-10 다중 생성). 칩 하나를 누르면 담기고 다시 누르면
               빠지므로, 단일 선택 목록이라고 낭독되면 스크린리더 사용자는 "여러 개를 담을 수 있다"를
               알 수 없다.
          */}
          <PresetChipGrid role="listbox" aria-multiselectable="true" aria-label="프리셋 티커 목록">
            {filteredPresetKeys.map((presetKey) => (
              <PresetChipButton
                key={presetKey}
                type="button"
                role="option"
                /* 선택 표시 = **담겼는가**. 미리보기 대상(`selectedPreset`)과 다르다. */
                selected={stagedPresetKeys.includes(presetKey)}
                aria-selected={stagedPresetKeys.includes(presetKey)}
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
