import { useCallback, useId, useRef } from 'react';
import type { KeyboardEvent } from 'react';
import { Search } from 'lucide-react';
import { Chip } from '@/components/common';
import { DIVIDEND_CALENDAR_COPY } from '../../copy';
import { ScheduleSourceBadge } from '../ScheduleSourceBadge';
import type { TickerPickerProps } from './TickerPicker.types';
import {
  ClearButton,
  NoResultText,
  PickerMetaRow,
  PickerRoot,
  ResultButton,
  ResultCount,
  ResultItem,
  ResultList,
  ResultName,
  ResultTicker,
  SearchIconSlot,
  SearchInput,
  SearchLabel,
  SearchRow,
  SelectedChipItem,
  SelectedChipList,
  UnavailableHint
} from './TickerPicker.styled';

const copy = DIVIDEND_CALENDAR_COPY;

/**
 * 검색 + 다중 선택 목록.
 *
 * 콤보박스/listbox 패턴을 쓰지 않는다 — 목록이 항상 보이므로 `button` + `aria-pressed`가 더 정확하고
 * 깨질 여지가 적다. 선택해도 **항목이 목록에서 사라지지 않는다**(사라지면 실수 해제가 어렵다).
 */
export default function TickerPicker({
  options,
  selected,
  keyword,
  onKeywordChange,
  onToggle,
  onClear
}: TickerPickerProps) {
  const searchId = useId();
  const resultCountId = useId();
  const searchRef = useRef<HTMLInputElement | null>(null);
  const selectedSet = new Set(selected);

  const handleSearchKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      // 이 페이지엔 모달이 없다 — Escape는 검색어만 지우고, 선택은 건드리지 않는다.
      if (event.key !== 'Escape' || keyword.length === 0) return;
      event.preventDefault();
      onKeywordChange('');
    },
    [keyword, onKeywordChange]
  );

  const handleRemoveChip = useCallback(
    (ticker: string) => {
      onToggle(ticker);
      // 제거 버튼이 사라지면 포커스가 body로 떨어진다 — 키보드 사용자가 위치를 잃지 않게 검색으로 돌린다.
      searchRef.current?.focus();
    },
    [onToggle]
  );

  return (
    <PickerRoot>
      <SearchLabel htmlFor={searchId}>{copy.picker.searchLabel}</SearchLabel>
      <SearchRow>
        <SearchIconSlot>
          <Search size={16} strokeWidth={1.8} aria-hidden focusable={false} />
        </SearchIconSlot>
        <SearchInput
          id={searchId}
          type="search"
          autoComplete="off"
          value={keyword}
          placeholder={copy.picker.searchPlaceholder}
          aria-describedby={resultCountId}
          ref={searchRef}
          onChange={(event) => onKeywordChange(event.target.value)}
          onKeyDown={handleSearchKeyDown}
        />
      </SearchRow>

      <PickerMetaRow>
        <ResultCount id={resultCountId}>{copy.picker.resultCount(options.length)}</ResultCount>
        {selected.length > 0 ? (
          <ClearButton type="button" onClick={onClear}>
            {copy.picker.clear}
          </ClearButton>
        ) : null}
      </PickerMetaRow>

      {selected.length > 0 ? (
        <SelectedChipList>
          {selected.map((ticker) => (
            <SelectedChipItem key={ticker}>
              <Chip
                selected
                removeAriaLabel={copy.picker.removeChip(ticker)}
                onRemove={() => handleRemoveChip(ticker)}
              >
                {ticker}
              </Chip>
            </SelectedChipItem>
          ))}
        </SelectedChipList>
      ) : null}

      {options.length === 0 ? (
        <NoResultText>{copy.picker.noResult}</NoResultText>
      ) : (
        <ResultList>
          {options.map((option) => {
            const isSelected = selectedSet.has(option.ticker);
            const isUnavailable = option.source === null;

            return (
              <ResultItem key={option.ticker}>
                <ResultButton
                  type="button"
                  $selected={isSelected}
                  $disabled={isUnavailable}
                  aria-pressed={isSelected}
                  aria-disabled={isUnavailable || undefined}
                  onClick={() => {
                    if (isUnavailable) return;
                    onToggle(option.ticker);
                  }}
                >
                  <ResultTicker>{option.ticker}</ResultTicker>
                  <ResultName>{option.koreanName}</ResultName>
                  <ScheduleSourceBadge source={option.source} />
                </ResultButton>
                {isUnavailable ? <UnavailableHint>{copy.picker.unavailableHint}</UnavailableHint> : null}
              </ResultItem>
            );
          })}
        </ResultList>
      )}
    </PickerRoot>
  );
}
