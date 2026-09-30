import { useId } from 'react';
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
  CandidateTicker,
  ListTitle,
  PickerHint,
  PreviewChip,
  SearchInput,
  UnavailableTag
} from './OverlapPicker.styled';

const copy = ETF_MIX_COPY.picker;

/**
 * 고르기 — 검색 + 목록. 검색어가 없으면 많이 찾는 ETF, 있으면 검색 결과다.
 * 목록 줄마다 "담으면 몇 %p"가 미리 붙는다(보유 종목을 받은 후보만).
 */
export default function OverlapPicker({
  listStatus,
  query,
  candidates,
  isSearching,
  isAtLimit,
  seriesOf,
  onQueryChange,
  onSubmitQuery,
  onAdd,
  onRemove
}: OverlapPickerProps) {
  const baseId = useId();
  const listLabel = isSearching ? copy.resultsTitle(candidates.length) : copy.popularTitle;

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
          <ListTitle>{listLabel}</ListTitle>
          {candidates.length === 0 ? (
            <EmptyNote>{isSearching ? copy.noResults(query.trim()) : copy.popularEmpty}</EmptyNote>
          ) : (
            <CandidateList aria-label={listLabel}>
              {candidates.map((candidate) => (
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
          )}
        </>
      ) : null}
    </PickSurface>
  );
}
