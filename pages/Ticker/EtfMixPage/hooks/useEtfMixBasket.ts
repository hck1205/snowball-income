import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  MAX_OVERLAP_ETFS,
  OVERLAP_DEFAULT_WEIGHT,
  nextOverlapWeight,
  normalizeOverlapBasket,
  overlapBasketParams
} from '../../utils';
import type { OverlapBasketState } from '../../utils';

/**
 * 바구니(티커 + 비중) — **URL 이 소유한다**(`?t=SCHD,VOO&w=60,40`).
 *
 * 비교 화면과 같은 이유다 — 조합을 남에게 보낼 수 있고, 뒤로가기가 한 번에 이 화면을 나간다(`replace`).
 * 비중을 안 건드린 조합은 `w` 없이 예전 링크와 같다(`overlapBasketParams`).
 *
 * 담기·빼기는 **정규화한 새 티커 목록**을 돌려준다(거절하면 `null`) — "방금 바뀐 폭" 추적이 그 바구니가
 * URL 에 반영되기를 기다려야 하기 때문이다(`useOverlapChange`).
 */
export const useEtfMixBasket = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const basket = useMemo(
    () => normalizeOverlapBasket((searchParams.get('t') ?? '').split(','), (searchParams.get('w') ?? '').split(',')),
    [searchParams]
  );

  const commit = useCallback(
    (next: OverlapBasketState): string[] => {
      const normalized = normalizeOverlapBasket(next.tickers, next.weights.map(String));
      setSearchParams(overlapBasketParams(normalized), { replace: true });
      return normalized.tickers;
    },
    [setSearchParams]
  );

  const add = useCallback(
    (ticker: string): string[] | null => {
      if (basket.tickers.includes(ticker) || basket.tickers.length >= MAX_OVERLAP_ETFS) return null;
      return commit({
        tickers: [...basket.tickers, ticker],
        weights: [...basket.weights, nextOverlapWeight(basket.weights)]
      });
    },
    [basket, commit]
  );

  const remove = useCallback(
    (ticker: string): string[] | null => {
      const index = basket.tickers.indexOf(ticker);
      if (index < 0) return null;
      return commit({
        tickers: basket.tickers.filter((_, at) => at !== index),
        weights: basket.weights.filter((_, at) => at !== index)
      });
    },
    [basket, commit]
  );

  const setWeight = useCallback(
    (ticker: string, weight: number) => {
      commit({
        tickers: basket.tickers,
        weights: basket.tickers.map((item, index) => (item === ticker ? weight : basket.weights[index]!))
      });
    },
    [basket, commit]
  );

  /** 모든 비중을 기본값으로 — 같은 금액씩. */
  const equalize = useCallback(() => {
    commit({ tickers: basket.tickers, weights: basket.tickers.map(() => OVERLAP_DEFAULT_WEIGHT) });
  }, [basket, commit]);

  return { basket, add, remove, setWeight, equalize };
};
