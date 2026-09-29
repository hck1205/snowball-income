import { useId, useLayoutEffect, useRef, useState } from 'react';
import { Layers, Plus, X } from 'lucide-react';
import { Button, Card, PageFooter, PageHero } from '@/components/common';
import { ICON } from '@/shared/styles';
import { assignSeries } from '@/shared/lib/tickerSeries';
import type { StockExposure } from '@/shared/lib/etfOverlap';
import { TICKER_OVERLAP_COPY } from '../copy';
import { useTweenedNumber } from '../hooks';
import { MAX_OVERLAP_ETFS, formatDelta, formatPercent, overlapLevel } from '../utils';
import type { TickerOverlapViewProps } from './TickerOverlapPage.types';
import {
  CandidateActions,
  CandidateBody,
  CandidateItem,
  CandidateList,
  CandidateName,
  CandidateTicker,
  DeltaChip,
  EmptyNote,
  ExposureBar,
  ExposureFill,
  ExposureValue,
  Gauge,
  GaugeCenter,
  GaugeFill,
  GaugeTrack,
  HolderDots,
  ListTitle,
  MatrixCell,
  MatrixHead,
  MatrixScroller,
  MatrixSelf,
  MatrixTable,
  PickSurface,
  PickerColumn,
  PickerHint,
  PreviewChip,
  ResultColumn,
  SearchInput,
  SectionHint,
  SeriesDot,
  Slot,
  SlotBody,
  SlotGhost,
  SlotGrid,
  SlotMeta,
  SlotRemove,
  SlotTicker,
  Stack,
  Stat,
  StatGrid,
  StockList,
  StockName,
  StockRow,
  SurfaceCount,
  SurfaceHead,
  SurfaceTitle,
  UnavailableTag,
  Verdict,
  VerdictBody,
  VerdictEyebrow,
  VerdictNote,
  VerdictSentence,
  VerdictText,
  VerdictUnit,
  VerdictValue,
  VisuallyHidden,
  Workbench
} from './TickerOverlapPage.styled';

const copy = TICKER_OVERLAP_COPY;

/** 링 게이지 반지름(viewBox 120 기준). 둘레는 여기서 파생한다 — 손으로 적은 326.7 같은 숫자를 두지 않는다. */
const GAUGE_RADIUS = 52;
const GAUGE_CIRCUMFERENCE = 2 * Math.PI * GAUGE_RADIUS;

/** 한 번에 그리는 종목 행 수. 대형 지수 ETF 둘이면 겹치는 종목만 수백 개다. */
const STOCK_ROW_LIMIT = 60;

const toneOf = (delta: number): 'up' | 'down' | 'flat' => {
  const rounded = Math.round(delta * 10) / 10;
  if (rounded > 0) return 'up';
  if (rounded < 0) return 'down';
  return 'flat';
};

/**
 * 종목 행 목록 — 담고 뺄 때 순위가 바뀌면 행이 **제자리에서 미끄러지게** 한다(FLIP).
 * 🔴 모션을 줄이는 설정이거나 `Element.animate` 가 없는 환경(jsdom)에서는 그냥 새 자리에 선다.
 */
function StockRows({
  stocks,
  seriesOf,
  basket
}: {
  stocks: readonly StockExposure[];
  seriesOf: (ticker: string) => string;
  basket: readonly string[];
}) {
  const listRef = useRef<HTMLUListElement>(null);
  const previousTops = useRef(new Map<string, number>());
  const maxExposure = Math.max(0.0001, ...stocks.map((stock) => stock.exposure));

  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const nextTops = new Map<string, number>();
    for (const element of Array.from(list.children) as HTMLElement[]) {
      const key = element.dataset.key;
      if (!key) continue;
      const top = element.getBoundingClientRect().top;
      nextTops.set(key, top);
      const before = previousTops.current.get(key);
      if (reduce || before === undefined || typeof element.animate !== 'function') continue;
      const shift = before - top;
      if (Math.abs(shift) > 1) {
        element.animate([{ transform: `translateY(${shift}px)` }, { transform: 'none' }], {
          duration: 320,
          easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)'
        });
      }
    }
    previousTops.current = nextTops;
  }, [stocks]);

  return (
    <StockList ref={listRef}>
      {stocks.map((stock) => {
        const holders = new Map(stock.holders.map((holder) => [holder.ticker, holder.weight]));
        const shared = stock.holders.length >= 2;
        const detail = stock.holders.map((holder) => `${holder.ticker} ${formatPercent(holder.weight)}%`).join(' · ');
        return (
          <StockRow key={stock.key} data-key={stock.key} $shared={shared}>
            <StockName>
              <strong title={stock.name}>{stock.name}</strong>
              <span>{stock.symbol ? `${stock.symbol} · ${detail}` : detail}</span>
            </StockName>
            <HolderDots aria-label={copy.stocks.holdersAria(stock.holders.map((holder) => holder.ticker).join(', '))}>
              {basket.map((ticker) => (
                <SeriesDot key={ticker} $series={seriesOf(ticker)} $off={!holders.has(ticker)} aria-hidden />
              ))}
            </HolderDots>
            <ExposureBar aria-hidden>
              <ExposureFill $shared={shared} $ratio={stock.exposure / maxExposure} />
            </ExposureBar>
            <ExposureValue>
              <VisuallyHidden>{copy.stocks.exposureHeader} </VisuallyHidden>
              {formatPercent(stock.exposure)}%
            </ExposureValue>
          </StockRow>
        );
      })}
    </StockList>
  );
}

export default function TickerOverlapView({
  viewModel,
  onQueryChange,
  onSubmitQuery,
  onAdd,
  onRemove
}: TickerOverlapViewProps) {
  const baseId = useId();
  const [showSingles, setShowSingles] = useState(false);
  const { listStatus, query, candidates, isSearching, slots, isAtLimit, analysis, analyzedCount, change, asOfItems } =
    viewModel;

  const basket = slots.map((slot) => slot.ticker);
  const seriesByTicker = assignSeries(basket);
  const seriesOf = (ticker: string): string => seriesByTicker.get(ticker) ?? 'transparent';

  const rate = analysis.overlapRate;
  const shownRate = useTweenedNumber(rate);
  const level = overlapLevel(rate, analyzedCount);
  const topShared = analysis.stocks.find((stock) => stock.holders.length >= 2);
  const emptySlotCount = Math.max(0, MAX_OVERLAP_ETFS - slots.length);

  const visibleStocks = analysis.stocks.filter(
    (stock) => showSingles || analyzedCount < 2 || stock.holders.length >= 2
  );
  const drawnStocks = visibleStocks.slice(0, STOCK_ROW_LIMIT);
  const hiddenStockCount = visibleStocks.length - drawnStocks.length;

  const pairValue = (a: string, b: string) =>
    analysis.pairs.find((pair) => (pair.a === a && pair.b === b) || (pair.a === b && pair.b === a));
  const analyzedTickers = slots.filter((slot) => slot.status === 'ready').map((slot) => slot.ticker);

  const pickerHint = isAtLimit
    ? copy.picker.atLimit
    : listStatus === 'loading'
      ? copy.picker.loadingList
      : listStatus === 'error'
        ? copy.picker.listError
        : isSearching && candidates.length > 0
          ? copy.picker.enterHint
          : null;

  return (
    <Stack>
      <PageHero
        icon={<Layers size={20} strokeWidth={1.8} aria-hidden focusable={false} />}
        title={copy.hero.title}
        titleAs="h1"
        lede={copy.hero.lede}
        mascot="/images/hippo/hippo_analyzing.png"
      />

      <Workbench>
        {/* 고르기 — 검색 + 목록. 목록 줄마다 "담으면 몇 %p"가 미리 붙는다. */}
        <PickerColumn>
          <PickSurface aria-labelledby={`${baseId}-picker`}>
            <SurfaceHead>
              <SurfaceTitle id={`${baseId}-picker`}>{copy.picker.title}</SurfaceTitle>
            </SurfaceHead>

            <SearchInput
              id={`${baseId}-search`}
              type="search"
              value={query}
              placeholder={copy.picker.searchPlaceholder}
              aria-label={copy.picker.searchLabel}
              aria-describedby={pickerHint ? `${baseId}-hint` : undefined}
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
            {pickerHint ? <PickerHint id={`${baseId}-hint`}>{pickerHint}</PickerHint> : null}

            {listStatus === 'ready' ? (
              <>
                <ListTitle>
                  {isSearching ? copy.picker.resultsTitle(candidates.length) : copy.picker.popularTitle}
                </ListTitle>
                {candidates.length === 0 ? (
                  <EmptyNote>{isSearching ? copy.picker.noResults(query.trim()) : copy.picker.popularEmpty}</EmptyNote>
                ) : (
                  <CandidateList aria-label={isSearching ? copy.picker.resultsTitle(candidates.length) : copy.picker.popularTitle}>
                    {candidates.map((candidate) => {
                      const tone = candidate.preview === null ? null : toneOf(candidate.preview);
                      return (
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
                                aria-label={copy.picker.removeAria(candidate.ticker)}
                                onClick={() => onRemove(candidate.ticker)}
                              >
                                {copy.picker.remove}
                              </Button>
                            ) : candidate.hasHoldings ? (
                              <Button
                                variant="secondary"
                                size="sm"
                                startIcon={<Plus size={ICON.sm} strokeWidth={ICON.stroke} aria-hidden focusable={false} />}
                                aria-label={copy.picker.addAria(candidate.ticker)}
                                disabled={isAtLimit}
                                onClick={() => onAdd(candidate.ticker)}
                              >
                                {copy.picker.add}
                              </Button>
                            ) : (
                              <UnavailableTag title={copy.picker.unavailableTitle}>{copy.picker.unavailable}</UnavailableTag>
                            )}
                            {tone && candidate.preview !== null && !candidate.inBasket ? (
                              <PreviewChip
                                $tone={tone}
                                aria-label={copy.picker.previewAria(candidate.ticker, formatDelta(candidate.preview))}
                              >
                                {tone === 'flat' ? copy.picker.previewFlat : copy.picker.previewLabel(formatDelta(candidate.preview))}
                              </PreviewChip>
                            ) : null}
                          </CandidateActions>
                        </CandidateItem>
                      );
                    })}
                  </CandidateList>
                )}
              </>
            ) : null}
          </PickSurface>
        </PickerColumn>

        <ResultColumn>
          {/* 바구니 — 비교 화면의 덱과 같은 모양. 빈 자리가 남은 개수를 도형으로 말한다. */}
          <PickSurface aria-labelledby={`${baseId}-basket`}>
            <SurfaceHead>
              <SurfaceTitle id={`${baseId}-basket`}>{copy.basket.title}</SurfaceTitle>
              <SurfaceCount>
                <VisuallyHidden>{copy.basket.countLabel} </VisuallyHidden>
                {copy.basket.count(slots.length)}
              </SurfaceCount>
            </SurfaceHead>
            <SlotGrid aria-label={copy.basket.slotsLabel}>
              {slots.map((slot) => (
                <Slot key={slot.ticker} $series={seriesOf(slot.ticker)}>
                  <SlotBody>
                    <SlotTicker>{slot.ticker}</SlotTicker>
                    <SlotMeta>
                      {slot.status === 'loading'
                        ? copy.basket.loading
                        : slot.status === 'error'
                          ? copy.basket.loadError
                          : slot.asOfDate}
                    </SlotMeta>
                  </SlotBody>
                  <SlotRemove type="button" aria-label={copy.picker.removeAria(slot.ticker)} onClick={() => onRemove(slot.ticker)}>
                    <X size={ICON.sm} strokeWidth={ICON.stroke} aria-hidden focusable={false} />
                  </SlotRemove>
                </Slot>
              ))}
              {Array.from({ length: emptySlotCount }, (_, index) => (
                <SlotGhost key={`ghost-${index}`} aria-hidden>
                  {copy.basket.emptySlot}
                </SlotGhost>
              ))}
            </SlotGrid>
          </PickSurface>

          {/* 결론 — 이 화면의 초점. 담을 때마다 숫자가 새 값으로 흘러가고, 방금 바뀐 폭이 칩으로 붙는다. */}
          <Verdict aria-labelledby={`${baseId}-verdict`}>
            <VerdictBody>
              <Gauge>
                <svg viewBox="0 0 120 120" aria-hidden focusable={false}>
                  <GaugeTrack cx="60" cy="60" r={GAUGE_RADIUS} strokeWidth="12" />
                  <GaugeFill
                    $high={level === 'high'}
                    cx="60"
                    cy="60"
                    r={GAUGE_RADIUS}
                    strokeWidth="12"
                    strokeDasharray={GAUGE_CIRCUMFERENCE}
                    strokeDashoffset={GAUGE_CIRCUMFERENCE * (1 - Math.min(100, Math.max(0, rate)) / 100)}
                  />
                </svg>
                <GaugeCenter>
                  <VerdictEyebrow id={`${baseId}-verdict`}>{copy.verdict.eyebrow}</VerdictEyebrow>
                  <VerdictValue>
                    <VisuallyHidden>{copy.verdict.valueLabel(formatPercent(rate))}</VisuallyHidden>
                    <span aria-hidden>{formatPercent(shownRate)}</span>
                    <VerdictUnit aria-hidden>{copy.verdict.unit}</VerdictUnit>
                  </VerdictValue>
                </GaugeCenter>
              </Gauge>

              <VerdictText>
                {/* 방금 한 동작의 결과는 낭독 영역에서 한 번 읽힌다(숫자가 흐르는 동안의 중간값은 읽지 않는다). */}
                <div aria-live="polite">
                  {change ? (
                    <DeltaChip key={change.id} $tone={toneOf(change.delta)}>
                      {change.kind === 'added'
                        ? copy.verdict.changeAdded(change.ticker, formatDelta(change.delta))
                        : copy.verdict.changeRemoved(change.ticker, formatDelta(change.delta))}
                    </DeltaChip>
                  ) : null}
                </div>
                <VerdictSentence>{copy.verdict.sentence[level]}</VerdictSentence>
                <VerdictNote>{copy.verdict.assumption}</VerdictNote>
              </VerdictText>
            </VerdictBody>

            <StatGrid>
              <Stat>
                <dt>{copy.verdict.stats.unique}</dt>
                <dd>{analysis.uniqueCount.toLocaleString('ko-KR')}</dd>
              </Stat>
              <Stat>
                <dt>{copy.verdict.stats.shared}</dt>
                <dd>{analysis.sharedCount.toLocaleString('ko-KR')}</dd>
              </Stat>
              <Stat>
                <dt>{copy.verdict.stats.top}</dt>
                <dd title={topShared?.name}>
                  {topShared
                    ? copy.verdict.stats.topValue(topShared.symbol ?? topShared.name, topShared.holders.length)
                    : copy.verdict.stats.none}
                </dd>
              </Stat>
            </StatGrid>
          </Verdict>
        </ResultColumn>
      </Workbench>

      <Card tone="default" title={copy.matrix.title}>
        {analyzedTickers.length < 2 ? (
          <EmptyNote>{copy.matrix.needTwo}</EmptyNote>
        ) : (
          <>
            <MatrixScroller>
              <MatrixTable>
                <caption>
                  <VisuallyHidden>{copy.matrix.title}</VisuallyHidden>
                </caption>
                <thead>
                  <tr>
                    <td />
                    {analyzedTickers.map((ticker) => (
                      <MatrixHead key={ticker} scope="col" $series={seriesOf(ticker)}>
                        {ticker}
                      </MatrixHead>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {analyzedTickers.map((rowTicker) => (
                    <tr key={rowTicker}>
                      <MatrixHead scope="row" $series={seriesOf(rowTicker)}>
                        {rowTicker}
                      </MatrixHead>
                      {analyzedTickers.map((columnTicker) => {
                        if (rowTicker === columnTicker) {
                          return <MatrixSelf key={columnTicker}>{copy.matrix.self}</MatrixSelf>;
                        }
                        const pair = pairValue(rowTicker, columnTicker);
                        const value = pair?.overlap ?? 0;
                        return (
                          <MatrixCell
                            key={columnTicker}
                            $intensity={value / 100}
                            aria-label={copy.matrix.cellAria(rowTicker, columnTicker, formatPercent(value), pair?.sharedCount ?? 0)}
                          >
                            <strong>{formatPercent(value)}%</strong>
                            <span>{copy.matrix.sharedCount(pair?.sharedCount ?? 0)}</span>
                          </MatrixCell>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </MatrixTable>
            </MatrixScroller>
            <SectionHint>{copy.matrix.hint}</SectionHint>
          </>
        )}
      </Card>

      <Card
        tone="default"
        title={copy.stocks.title}
        titleRight={
          analyzedCount >= 2 ? (
            <Button variant="ghost" size="sm" aria-pressed={showSingles} onClick={() => setShowSingles((value) => !value)}>
              {showSingles ? copy.stocks.hideSingles : copy.stocks.showSingles}
            </Button>
          ) : undefined
        }
      >
        {analyzedCount === 0 ? (
          <EmptyNote>{copy.stocks.needOne}</EmptyNote>
        ) : drawnStocks.length === 0 ? (
          <EmptyNote>{copy.stocks.none}</EmptyNote>
        ) : (
          <>
            <StockRows stocks={drawnStocks} seriesOf={seriesOf} basket={analyzedTickers} />
            {hiddenStockCount > 0 ? <SectionHint>{copy.stocks.moreHidden(hiddenStockCount)}</SectionHint> : null}
          </>
        )}
      </Card>

      <PageFooter
        notesTitle={copy.footnote.title}
        notes={[
          copy.footnote.source,
          ...(asOfItems.length > 0 ? [copy.footnote.asOf(asOfItems.join(' · '))] : []),
          copy.footnote.truncated,
          copy.footnote.disclaimer
        ]}
      />
    </Stack>
  );
}
