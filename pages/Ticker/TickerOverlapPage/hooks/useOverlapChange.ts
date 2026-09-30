import { useCallback, useEffect, useState } from 'react';
import type { OverlapChange } from '../TickerOverlapPage.types';

type Pending = {
  readonly kind: OverlapChange['kind'];
  readonly ticker: string;
  /** 누른 순간의 중복률. */
  readonly before: number;
  /** 이 동작이 끝나면 되어야 하는 바구니(쉼표로 이은 티커). */
  readonly expected: string;
};

/**
 * "방금 한 동작이 중복률을 얼마나 움직였나"(`JEPI 담음 · +9.5%p`).
 *
 * 담은 ETF 의 보유 종목이 **도착한 뒤에** 계산해야 맞는 값이 나온다 — 누른 순간에는 아직 옛 바구니로
 * 계산된 값이라 0 으로 보인다. 그래서 누른 순간의 중복률을 쥐고 있다가, 바구니가 다 받아졌을 때 차이를 낸다.
 *
 * 🔴 "기대하는 바구니"가 실제 바구니와 **같아진 뒤에만** 푼다. 바구니는 URL 이 소유해서 `setSearchParams` 가
 *    이 상태 갱신보다 한 렌더 늦게 반영될 수 있다 — 그 사이에 풀면 옛 바구니끼리 비교해 "담음 · 0.0%p" 가
 *    나온다(2026-09-29 화면 확인에서 실제로 났다).
 */
export const useOverlapChange = (params: {
  /** 지금 바구니(쉼표로 이은 티커). */
  readonly selectionKey: string;
  /** 바구니의 보유 종목을 모두 받았는가(받는 중인 것이 없다). */
  readonly isSettled: boolean;
  readonly overlapRate: number;
}): {
  readonly change: OverlapChange | null;
  /** 동작 직전에 부른다 — `next` 는 그 동작 뒤의 바구니(정규화된 티커 배열). */
  readonly markChange: (kind: OverlapChange['kind'], ticker: string, next: readonly string[]) => void;
} => {
  const { selectionKey, isSettled, overlapRate } = params;
  const [pending, setPending] = useState<Pending | null>(null);
  const [change, setChange] = useState<OverlapChange | null>(null);

  useEffect(() => {
    if (!pending || !isSettled || pending.expected !== selectionKey) return;
    setChange({ kind: pending.kind, ticker: pending.ticker, delta: overlapRate - pending.before, id: Date.now() });
    setPending(null);
  }, [pending, isSettled, selectionKey, overlapRate]);

  const markChange = useCallback(
    (kind: OverlapChange['kind'], ticker: string, next: readonly string[]) => {
      setPending({ kind, ticker, before: overlapRate, expected: next.join(',') });
    },
    [overlapRate]
  );

  return { change, markChange };
};
