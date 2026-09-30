import { useEffect, useId, useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/common';
import { ICON } from '@/shared/styles';
import { ETF_MIX_COPY } from '../../../copy';
import { deltaTone, formatDelta } from '../../../utils';
import { EmptyNote, PickSurface, SeriesDot, SurfaceHead, SurfaceTitle } from '../../styled';
import type { OverlapPickerProps } from './OverlapPicker.types';
import {
  CandidateActions,
  CandidateBody,
  CandidateItem,
  CandidateList,
  CandidateName,
  CandidateScroller,
  CandidateTicker,
  FilterToggle,
  ListHead,
  ListTitle,
  PickerHint,
  PreviewChip,
  SearchInput,
  UnavailableTag
} from './OverlapPicker.styled';

const copy = ETF_MIX_COPY.picker;

/**
 * 목록은 한 번에 다 그리지 않는다 — 전체가 4,000여 줄이라 한꺼번에 DOM 에 올리면 입력·스크롤이 버벅인다.
 * 처음 이만큼 그리고, 스크롤이 바닥 근처에 닿을 때마다 이만큼씩 더 그린다.
 */
const ROWS_PER_PAGE = 50;
/** 바닥에서 이만큼(px) 남으면 다음 줄들을 미리 그린다 — 닿고 나서 그리면 한 박자 비어 보인다. */
const LOAD_AHEAD_PX = 240;

/**
 * 고르기 — 검색 + 목록. 검색어가 없으면 많이 찾는 ETF, 있으면 검색 결과다.
 * 목록 줄마다 "담으면 몇 %p"가 미리 붙는다(보유 종목을 받은 후보만).
 */
export default function OverlapPicker({
  listStatus,
  query,
  candidates,
  isSearching,
  onlyWithHoldings,
  isAtLimit,
  seriesOf,
  onQueryChange,
  onSubmitQuery,
  onToggleOnlyWithHoldings,
  onAdd,
  onRemove
}: OverlapPickerProps) {
  const baseId = useId();
  const count = candidates.length.toLocaleString('ko-KR');
  const listLabel = isSearching
    ? copy.resultsTitle(candidates.length)
    : onlyWithHoldings
      ? copy.browseAvailableTitle(count)
      : copy.browseTitle(count);

  /* 목록이 바뀌면(검색어·필터) 처음 한 쪽부터 다시 — 이전 목록에서 늘려 둔 줄 수를 들고 가지 않는다. */
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(ROWS_PER_PAGE);
  useEffect(() => {
    setVisibleCount(ROWS_PER_PAGE);
    scrollerRef.current?.scrollTo?.({ top: 0 });
  }, [query, onlyWithHoldings]);
  const drawn = candidates.slice(0, visibleCount);

  const handleScroll = () => {
    const scroller = scrollerRef.current;
    if (!scroller || visibleCount >= candidates.length) return;
    if (scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - LOAD_AHEAD_PX) {
      setVisibleCount((value) => Math.min(candidates.length, value + ROWS_PER_PAGE));
    }
  };

  const hint = isAtLimit
    ? copy.atLimit
    : listStatus === 'loading'
      ? copy.loadingList
      : listStatus === 'error'
        ? copy.listError
        : isSearching && candidates.length > 0
          ? copy.enterHint
          : null;

  return (
    <PickSurface aria-labelledby={`${baseId}-title`}>
      <SurfaceHead>
        <SurfaceTitle id={`${baseId}-title`}>{copy.title}</SurfaceTitle>
      </SurfaceHead>

      <SearchInput
        id={`${baseId}-search`}
        type="search"
        value={query}
        placeholder={copy.searchPlaceholder}
        aria-label={copy.searchLabel}
        aria-describedby={hint ? `${baseId}-hint` : undefined}
        autoComplete="off"
        disabled={listStatus !== 'ready'}
        onChange={(event) => onQueryChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            onSubmitQuery();
          }
        }}
      />
      {hint ? <PickerHint id={`${baseId}-hint`}>{hint}</PickerHint> : null}

      {listStatus === 'ready' ? (
        <>
          <ListHead>
            <ListTitle>{listLabel}</ListTitle>
            {/* 검색 결과에는 적용하지 않는다 — 찾는 티커가 "준비 중"이라도 찾았다는 사실은 보여야 한다. */}
            {!isSearching ? (
              <FilterToggle type="button" aria-pressed={onlyWithHoldings} onClick={onToggleOnlyWithHoldings}>
                {copy.onlyAvailable}
              </FilterToggle>
            ) : null}
          </ListHead>
          {candidates.length === 0 ? (
            <EmptyNote>{isSearching ? copy.noResults(query.trim()) : copy.browseEmpty}</EmptyNote>
          ) : (
            <CandidateScroller ref={scrollerRef} onScroll={handleScroll}>
              <CandidateList aria-label={listLabel}>
                {drawn.map((candidate) => (
                  <CandidateItem key={candidate.ticker} $inBasket={candidate.inBasket}>
                    <CandidateBody>
                      <CandidateTicker>
                        {candidate.inBasket ? <SeriesDot $series={seriesOf(candidate.ticker)} aria-hidden /> : null}
                        {candidate.ticker}
                      </CandidateTicker>
                      <CandidateName title={candidate.name}>{candidate.name}</CandidateName>
                    </CandidateBody>
                    <CandidateActions>
                      {candidate.inBasket ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label={copy.removeAria(candidate.ticker)}
                          onClick={() => onRemove(candidate.ticker)}
                        >
                          {copy.remove}
                        </Button>
                      ) : candidate.hasHoldings ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          startIcon={<Plus size={ICON.sm} strokeWidth={ICON.stroke} aria-hidden focusable={false} />}
                          aria-label={copy.addAria(candidate.ticker)}
                          disabled={isAtLimit}
                          onClick={() => onAdd(candidate.ticker)}
                        >
                          {copy.add}
                        </Button>
                      ) : (
                        <UnavailableTag title={copy.unavailableTitle}>{copy.unavailable}</UnavailableTag>
                      )}
                      {candidate.preview !== null && !candidate.inBasket ? (
                        <PreviewChip
                          $tone={deltaTone(candidate.preview)}
                          aria-label={copy.previewAria(candidate.ticker, formatDelta(candidate.preview))}
                        >
                          {deltaTone(candidate.preview) === 'flat'
                            ? copy.previewFlat
                            : copy.previewLabel(formatDelta(candidate.preview))}
                        </PreviewChip>
                      ) : null}
                    </CandidateActions>
                  </CandidateItem>
                ))}
              </CandidateList>
            </CandidateScroller>
          )}
        </>
      ) : null}
    </PickSurface>
  );
}
