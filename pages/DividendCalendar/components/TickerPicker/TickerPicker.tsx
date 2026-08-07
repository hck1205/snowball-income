import { useCallback, useId, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { Search } from 'lucide-react';
import { Chip } from '@/components/common';
import { DIVIDEND_CALENDAR_COPY } from '../../copy';
import { countByMarket, filterByMarket, isSchedulableState } from '../../utils';
import type { TickerMarket } from '../../utils';
import { ScheduleSourceBadge } from '../ScheduleSourceBadge';
import type { TickerPickerProps } from './TickerPicker.types';
import {
  ClearButton,
  CountToken,
  MarketTab,
  MarketTabCount,
  MarketTabs,
  NoResultText,
  PickerMetaRow,
  PickerRoot,
  ResultButton,
  ResultCount,
  ResultCountDivider,
  ResultItem,
  ResultList,
  ResultName,
  ResultTicker,
  SearchIconSlot,
  SearchInput,
  SearchRow,
  SelectedChipItem,
  SelectedChipList
} from './TickerPicker.styled';

const copy = DIVIDEND_CALENDAR_COPY;

/**
 * 검색 + 다중 선택 목록.
 *
 * 콤보박스/listbox 패턴을 쓰지 않는다 — 목록이 항상 보이므로 `button` + `aria-pressed`가 더 정확하고
 * 깨질 여지가 적다. 선택해도 **항목이 목록에서 사라지지 않는다**(사라지면 실수 해제가 어렵다).
 * 목록을 접는 아코디언도 한 번 시도했다가 되돌렸다(사용자 결정 2026-07-25 — 항상 펼쳐진 쪽이 낫다).
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
  const [market, setMarket] = useState<TickerMarket>('us');

  /*
   * 🔴 아래 개수·목록은 **탭이 걸린 뒤의 것**이다. 탭 라벨의 개수만 검색 결과 전체에서 센다 —
   * 그래야 "지금 탭엔 없지만 저 탭에 3종 있다"가 누르기 전에 보인다.
   */
  const visible = useMemo(() => filterByMarket(options, market), [options, market]);
  const usCount = countByMarket(options, 'us');
  const krCount = countByMarket(options, 'kr');
  /**
   * "데이터 준비 중"·"배당 없음" 판정은 목록 항목의 배지와 **같은 기준**(`source`)에서 온다.
   * 세는 대상도 지금 화면에 보이는 목록(`options`, 검색어 적용 후)이라 검색을 좁히면 숫자가
   * 같이 줄어든다 — 전체 유니버스를 세면 "3종목 · 준비 중 19종"처럼 읽히는 거짓말이 된다.
   *
   * 🔴 두 수를 **합치지 않는다**: 준비 중은 갱신되면 사라지는 임시 상태고, 배당 없음은 영구
   * 사실이다. 합쳐 세면 배당을 지급하지 않는 종목이 "곧 들어올 데이터"로 읽힌다(실제 신고).
   */
  const unavailableCount = visible.reduce((count, option) => (option.source === null ? count + 1 : count), 0);
  const nonDividendCount = visible.reduce(
    (count, option) => (option.source === 'nonDividend' ? count + 1 : count),
    0
  );

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
      {/* 시각 라벨 없이 아이콘 + placeholder 로 읽히게 하고, 접근성 이름은 aria-label 이 책임진다. */}
      {/*
        시장 탭 — 검색 **위**에 선다(어느 시장을 볼지가 무엇을 찾을지보다 먼저 정해진다).
        radiogroup 으로 말한다: 아래 목록이 통째로 바뀌는 필터라 tablist 의 계약(화살표 이동·
        aria-controls·패널 포커스)까지 질 이유가 없다. 근거는 MarketTabs 주석.
      */}
      <MarketTabs role="radiogroup" aria-label={copy.picker.marketGroupLabel}>
        <MarketTab
          type="button"
          role="radio"
          aria-checked={market === 'us'}
          $active={market === 'us'}
          onClick={() => setMarket('us')}
        >
          {copy.picker.marketUs}
          <MarketTabCount>{usCount}</MarketTabCount>
        </MarketTab>
        <MarketTab
          type="button"
          role="radio"
          aria-checked={market === 'kr'}
          $active={market === 'kr'}
          onClick={() => setMarket('kr')}
        >
          {copy.picker.marketKr}
          <MarketTabCount>{krCount}</MarketTabCount>
        </MarketTab>
      </MarketTabs>

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
          ref={searchRef}
          onChange={(event) => onKeywordChange(event.target.value)}
          onKeyDown={handleSearchKeyDown}
        />
      </SearchRow>

      <PickerMetaRow>
        {/* 검색 입력의 aria-describedby 가 이 문단을 가리킨다 — 준비 중 개수도 같은 문단에 담아
            "68종목"만 읽히고 끝나지 않게 한다(구분자만 장식으로 숨긴다). */}
        <ResultCount id={resultCountId}>
          <CountToken>{copy.picker.resultCount(visible.length)}</CountToken>
          {unavailableCount > 0 ? (
            <>
              <ResultCountDivider aria-hidden>·</ResultCountDivider>
              <CountToken>{copy.picker.unavailableCount(unavailableCount)}</CountToken>
            </>
          ) : null}
          {nonDividendCount > 0 ? (
            <>
              <ResultCountDivider aria-hidden>·</ResultCountDivider>
              <CountToken>{copy.picker.nonDividendCount(nonDividendCount)}</CountToken>
            </>
          ) : null}
        </ResultCount>
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

      {visible.length === 0 ? (
        <NoResultText>{copy.picker.noResult}</NoResultText>
      ) : (
        <ResultList>
          {visible.map((option) => {
            const isSelected = selectedSet.has(option.ticker);
            // 배당 없음도 준비 중과 마찬가지로 캘린더에 놓을 수 없다 — 사유만 다르고 선택은 불가.
            const isUnavailable = !isSchedulableState(option.source);

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
              </ResultItem>
            );
          })}
        </ResultList>
      )}
    </PickerRoot>
  );
}
