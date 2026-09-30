import { Layers } from 'lucide-react';
import { PageFooter, PageHero } from '@/components/common';
import { assignSeries } from '@/shared/lib/tickerSeries';
import { TICKER_OVERLAP_COPY } from '../copy';
import { OverlapBasket, OverlapMatrix, OverlapPicker, OverlapStocks, OverlapVerdict } from './components';
import { PickerColumn, ResultColumn, Stack, Workbench } from './styled';
import type { TickerOverlapViewProps } from './TickerOverlapPage.types';

const copy = TICKER_OVERLAP_COPY;

/**
 * `/ticker/overlap` 의 뷰 — 섹션을 **배치만** 한다. 각 섹션의 그림은 `components/` 에 있다.
 *
 * 🔴 종목 색은 여기서 **한 번** 정해 모든 섹션에 내려준다(`assignSeries`). 섹션마다 정하면 같은 ETF 가
 *    바구니·매트릭스·종목 행에서 서로 다른 색이 되어 색이 길찾기 단서 구실을 못 한다.
 */
export default function TickerOverlapView({
  viewModel,
  onQueryChange,
  onSubmitQuery,
  onAdd,
  onRemove
}: TickerOverlapViewProps) {
  const { listStatus, query, candidates, isSearching, slots, isAtLimit, analysis, analyzedCount, change, asOfItems } =
    viewModel;

  const seriesByTicker = assignSeries(slots.map((slot) => slot.ticker));
  const seriesOf = (ticker: string): string => seriesByTicker.get(ticker) ?? 'transparent';
  const analyzedTickers = slots.filter((slot) => slot.status === 'ready').map((slot) => slot.ticker);

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
        <PickerColumn>
          <OverlapPicker
            listStatus={listStatus}
            query={query}
            candidates={candidates}
            isSearching={isSearching}
            isAtLimit={isAtLimit}
            seriesOf={seriesOf}
            onQueryChange={onQueryChange}
            onSubmitQuery={onSubmitQuery}
            onAdd={onAdd}
            onRemove={onRemove}
          />
        </PickerColumn>
        <ResultColumn>
          <OverlapBasket slots={slots} seriesOf={seriesOf} onRemove={onRemove} />
          <OverlapVerdict analysis={analysis} analyzedCount={analyzedCount} change={change} />
        </ResultColumn>
      </Workbench>

      <OverlapMatrix tickers={analyzedTickers} pairs={analysis.pairs} seriesOf={seriesOf} />
      <OverlapStocks stocks={analysis.stocks} tickers={analyzedTickers} seriesOf={seriesOf} />

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
