import { useLayoutEffect, useRef, useState } from 'react';
import { Button, Card } from '@/components/common';
import { ETF_MIX_COPY } from '../../../copy';
import { formatPercent } from '../../../utils';
import { EmptyNote, SectionHint, SeriesDot, VisuallyHidden } from '../../styled';
import type { OverlapStocksProps } from './OverlapStocks.types';
import {
  ExposureBar,
  ExposureFill,
  ExposureValue,
  HolderDots,
  StockList,
  StockName,
  StockRow
} from './OverlapStocks.styled';

const copy = ETF_MIX_COPY.stocks;

/** 한 번에 그리는 종목 행 수. 대형 지수 ETF 둘이면 겹치는 종목만 수백 개다. */
const STOCK_ROW_LIMIT = 60;

/**
 * 담고 뺄 때 순위가 바뀌면 행이 **제자리에서 미끄러지게** 한다(FLIP).
 * 🔴 모션을 줄이는 설정이거나 `Element.animate` 가 없는 환경(jsdom)에서는 그냥 새 자리에 선다.
 */
const useRowReorderMotion = (dependency: unknown) => {
  const listRef = useRef<HTMLUListElement>(null);
  const previousTops = useRef(new Map<string, number>());

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
  }, [dependency]);

  return listRef;
};

/** 종목별 중복 — 겹치는 종목만 보거나, 한 ETF 에만 있는 종목까지 펼친다. */
export default function OverlapStocks({ stocks, tickers, seriesOf }: OverlapStocksProps) {
  const [showSingles, setShowSingles] = useState(false);
  const analyzedCount = tickers.length;

  const visible = stocks.filter((stock) => showSingles || analyzedCount < 2 || stock.holders.length >= 2);
  const drawn = visible.slice(0, STOCK_ROW_LIMIT);
  const hiddenCount = visible.length - drawn.length;
  const maxExposure = Math.max(0.0001, ...drawn.map((stock) => stock.exposure));
  const listRef = useRowReorderMotion(drawn);

  return (
    <Card
      tone="default"
      title={copy.title}
      titleRight={
        analyzedCount >= 2 ? (
          <Button variant="ghost" size="sm" aria-pressed={showSingles} onClick={() => setShowSingles((value) => !value)}>
            {showSingles ? copy.hideSingles : copy.showSingles}
          </Button>
        ) : undefined
      }
    >
      {analyzedCount === 0 ? (
        <EmptyNote>{copy.needOne}</EmptyNote>
      ) : drawn.length === 0 ? (
        <EmptyNote>{copy.none}</EmptyNote>
      ) : (
        <>
          <StockList ref={listRef}>
            {drawn.map((stock) => {
              const holders = new Set(stock.holders.map((holder) => holder.ticker));
              const shared = stock.holders.length >= 2;
              const detail = stock.holders
                .map((holder) => `${holder.ticker} ${formatPercent(holder.weight)}%`)
                .join(' · ');
              return (
                <StockRow key={stock.key} data-key={stock.key} $shared={shared}>
                  <StockName>
                    <strong title={stock.name}>{stock.name}</strong>
                    <span>{stock.symbol ? `${stock.symbol} · ${detail}` : detail}</span>
                  </StockName>
                  <HolderDots aria-label={copy.holdersAria(stock.holders.map((holder) => holder.ticker).join(', '))}>
                    {tickers.map((ticker) => (
                      <SeriesDot key={ticker} $series={seriesOf(ticker)} $off={!holders.has(ticker)} aria-hidden />
                    ))}
                  </HolderDots>
                  <ExposureBar aria-hidden>
                    <ExposureFill $shared={shared} $ratio={stock.exposure / maxExposure} />
                  </ExposureBar>
                  <ExposureValue>
                    <VisuallyHidden>{copy.exposureHeader} </VisuallyHidden>
                    {formatPercent(stock.exposure)}%
                  </ExposureValue>
                </StockRow>
              );
            })}
          </StockList>
          {hiddenCount > 0 ? <SectionHint>{copy.moreHidden(hiddenCount)}</SectionHint> : null}
        </>
      )}
    </Card>
  );
}
