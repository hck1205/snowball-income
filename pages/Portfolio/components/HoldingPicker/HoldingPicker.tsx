import { useCallback, useId } from 'react';
import type { KeyboardEvent } from 'react';
import { Search } from 'lucide-react';
import { PORTFOLIO_COPY } from '../../copy';
import { FreshnessBadge } from '../FreshnessBadge';
import type { HoldingPickerProps } from './HoldingPicker.types';
import {
  HeldBadge,
  NoResultText,
  PickerRoot,
  ResultButton,
  ResultCount,
  ResultItem,
  ResultList,
  ResultName,
  ResultTicker,
  SearchIconSlot,
  SearchInput,
  SearchRow
} from './HoldingPicker.styled';

const copy = PORTFOLIO_COPY;

/**
 * 검색 + 결과 목록. 선택해도 항목이 목록에서 **사라지지 않고**(사라지면 실수를 되돌리기 어렵다)
 * 드로어도 닫히지 않는다(연속 추가).
 *
 * Escape 는 여기서 **검색어만 지운다** — 드로어의 document 핸들러가 `defaultPrevented` 를 먼저 보므로,
 * 지울 게 있으면 패널이 닫히지 않고 지울 게 없을 때만 닫힌다.
 */
export default function HoldingPicker({
  keyword,
  onKeywordChange,
  options,
  heldTickers,
  onAdd,
  onFocusHeld
}: HoldingPickerProps) {
  const searchId = useId();
  const resultCountId = useId();
  const heldSet = new Set(heldTickers);

  const handleSearchKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key !== 'Escape' || keyword.length === 0) return;
      event.preventDefault();
      onKeywordChange('');
    },
    [keyword, onKeywordChange]
  );

  return (
    <PickerRoot>
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
          aria-label={copy.picker.searchLabel}
          aria-describedby={resultCountId}
          onChange={(event) => onKeywordChange(event.target.value)}
          onKeyDown={handleSearchKeyDown}
        />
      </SearchRow>

      <ResultCount id={resultCountId}>{copy.picker.resultCount(options.length)}</ResultCount>

      {options.length === 0 ? (
        <NoResultText>{copy.picker.noResult}</NoResultText>
      ) : (
        <ResultList>
          {options.map((option) => {
            const isHeld = heldSet.has(option.ticker);

            return (
              <ResultItem key={option.ticker}>
                <ResultButton
                  type="button"
                  $held={isHeld}
                  aria-label={isHeld ? copy.picker.heldAria(option.ticker) : copy.picker.addAria(option.ticker)}
                  onClick={() => (isHeld ? onFocusHeld(option.ticker) : onAdd(option.ticker))}
                >
                  <ResultTicker>{option.ticker}</ResultTicker>
                  <ResultName>{option.name}</ResultName>
                  {/* 유니버스 종목은 수동일 수 없다 — 스냅샷 밖이면 "시세 미갱신"만 표시한다. */}
                  <FreshnessBadge tone={option.freshness === 'preset' ? 'stale-price' : null} />
                  {isHeld ? <HeldBadge>{copy.badge.held}</HeldBadge> : null}
                </ResultButton>
              </ResultItem>
            );
          })}
        </ResultList>
      )}
    </PickerRoot>
  );
}
