import { Card } from '@/components/common';
import { ETF_MIX_COPY } from '../../../copy';
import { formatPercent } from '../../../utils';
import { EmptyNote, SectionHint, VisuallyHidden } from '../../styled';
import type { OverlapMatrixProps } from './OverlapMatrix.types';
import { MatrixCell, MatrixHead, MatrixScroller, MatrixSelf, MatrixTable } from './OverlapMatrix.styled';

const copy = ETF_MIX_COPY.matrix;

/** 짝을 순서와 무관하게 찾는 열쇠. `pairs` 는 a 가 b 보다 앞인 쪽만 담는다. */
const pairKey = (a: string, b: string): string => (a < b ? `${a}|${b}` : `${b}|${a}`);

/** 두 ETF끼리 겹치는 비중 — 대각선은 같은 ETF, 칸의 진하기가 겹침 크기다. */
export default function OverlapMatrix({ tickers, pairs, seriesOf }: OverlapMatrixProps) {
  const byPair = new Map(pairs.map((pair) => [pairKey(pair.a, pair.b), pair]));

  return (
    <Card tone="default" title={copy.title}>
      {tickers.length < 2 ? (
        <EmptyNote>{copy.needTwo}</EmptyNote>
      ) : (
        <>
          <MatrixScroller>
            <MatrixTable>
              <caption>
                <VisuallyHidden>{copy.title}</VisuallyHidden>
              </caption>
              <thead>
                <tr>
                  <td />
                  {tickers.map((ticker) => (
                    <MatrixHead key={ticker} scope="col" $series={seriesOf(ticker)}>
                      {ticker}
                    </MatrixHead>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tickers.map((rowTicker) => (
                  <tr key={rowTicker}>
                    <MatrixHead scope="row" $series={seriesOf(rowTicker)}>
                      {rowTicker}
                    </MatrixHead>
                    {tickers.map((columnTicker) => {
                      if (rowTicker === columnTicker) {
                        return <MatrixSelf key={columnTicker}>{copy.self}</MatrixSelf>;
                      }
                      const pair = byPair.get(pairKey(rowTicker, columnTicker));
                      const value = pair?.overlap ?? 0;
                      const sharedCount = pair?.sharedCount ?? 0;
                      return (
                        <MatrixCell
                          key={columnTicker}
                          $intensity={value / 100}
                          aria-label={copy.cellAria(rowTicker, columnTicker, formatPercent(value), sharedCount)}
                        >
                          <strong>{formatPercent(value)}%</strong>
                          <span>{copy.sharedCount(sharedCount)}</span>
                        </MatrixCell>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </MatrixTable>
          </MatrixScroller>
          <SectionHint>{copy.hint}</SectionHint>
        </>
      )}
    </Card>
  );
}
