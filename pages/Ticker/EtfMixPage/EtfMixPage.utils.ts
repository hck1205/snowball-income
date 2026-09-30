import { previewAddDelta } from '@/shared/lib/etfOverlap';
import type { BasketAnalysis, EtfHoldingsSnapshot, EtfUniverseEntry } from '@/shared/lib/etfOverlap';
import type { LoadState } from '../hooks';
import { MAX_OVERLAP_ETFS, OVERLAP_DEFAULT_WEIGHT, overlapShares } from '../utils';
import type { OverlapBasketState } from '../utils';
import type { EtfMixViewModel, OverlapCandidate, OverlapChange, OverlapSlot } from './EtfMixPage.types';

export type BuildEtfMixViewModelInput = {
  readonly listStatus: EtfMixViewModel['listStatus'];
  readonly query: string;
  readonly isSearching: boolean;
  /** 목록에 보일 ETF(검색 결과 또는 인기 ETF). */
  readonly listed: readonly EtfUniverseEntry[];
  readonly basket: OverlapBasketState;
  readonly snapshots: ReadonlyMap<string, LoadState<EtfHoldingsSnapshot>>;
  /** 보유 종목을 받은 바구니 ETF 와 그 비중(같은 순서) — 계산에 들어간 그대로. */
  readonly basketSnapshots: readonly EtfHoldingsSnapshot[];
  readonly basketWeights: readonly number[];
  readonly analysis: BasketAnalysis;
  readonly change: OverlapChange | null;
  readonly simulation: EtfMixViewModel['simulation'];
};

/**
 * 화면 모델 — **순수 함수**. 컨테이너가 모은 상태를 뷰가 그릴 모양으로 옮긴다(계산은 `shared/lib/etfOverlap`).
 *
 * 미리보기("담으면 몇 %p")는 보유 종목을 **이미 받은** 후보만 낸다 — 받는 중인 후보에 0 을 보이면
 * "담아도 안 바뀐다"로 읽힌다.
 */
export const buildEtfMixViewModel = (input: BuildEtfMixViewModelInput): EtfMixViewModel => {
  const { basket, snapshots, basketSnapshots, basketWeights, analysis } = input;
  const inBasket = new Set(basket.tickers);

  const candidates: OverlapCandidate[] = input.listed.map((entry) => {
    const state = snapshots.get(entry.ticker);
    const snapshot = entry.hasHoldings && state?.status === 'ready' ? state.data : null;
    const isIn = inBasket.has(entry.ticker);
    return {
      ticker: entry.ticker,
      name: entry.name,
      hasHoldings: entry.hasHoldings,
      inBasket: isIn,
      preview:
        snapshot && !isIn
          ? previewAddDelta(basketSnapshots, snapshot, { weights: basketWeights, currentRate: analysis.overlapRate })
          : null
    };
  });

  const shares = overlapShares(basket.weights);
  const slots: OverlapSlot[] = basket.tickers.map((ticker, index) => {
    const state = snapshots.get(ticker);
    return {
      ticker,
      status: state?.status ?? 'loading',
      asOfDate: state?.status === 'ready' ? state.data.asOfDate : null,
      weight: basket.weights[index]!,
      share: shares[index]!
    };
  });

  return {
    listStatus: input.listStatus,
    query: input.query,
    candidates,
    isSearching: input.isSearching,
    slots,
    isAtLimit: basket.tickers.length >= MAX_OVERLAP_ETFS,
    isEqualWeight: basket.weights.every((weight) => weight === OVERLAP_DEFAULT_WEIGHT),
    analysis,
    analyzedCount: basketSnapshots.length,
    change: input.change,
    asOfItems: basketSnapshots.map((snapshot) => `${snapshot.ticker} ${snapshot.asOfDate}`),
    simulation: input.simulation
  };
};
