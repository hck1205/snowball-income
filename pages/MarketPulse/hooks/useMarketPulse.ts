import { useCallback, useEffect, useRef, useState } from 'react';
import type { MarketPulseSnapshot } from '@/shared/lib/marketPulse';

/**
 * `/api/market-pulse` 를 한 번 받아 온다.
 *
 * 🔴 **재시도 루프를 넣지 마라.** 상류(FRED)는 연속 호출을 차단한다 — 실패했다고 곧바로 다시
 *    부르면 차단만 굳어진다. 실패는 화면에 그대로 말하고, 다시 받는 것은 **사람이 누를 때만** 한다.
 * ⚠ 엣지가 6시간 캐시하므로 대부분의 방문은 상류까지 가지 않는다. 이 훅이 가벼운 이유다.
 */
export type MarketPulseState =
  | { status: 'loading' }
  | { status: 'ready'; snapshot: MarketPulseSnapshot }
  | { status: 'failed' };

export function useMarketPulse() {
  const [state, setState] = useState<MarketPulseState>({ status: 'loading' });
  /* 언마운트 뒤 setState 를 막는다 — 이 화면은 탭 이동이 잦다. */
  const aliveRef = useRef(true);

  const load = useCallback(async () => {
    setState({ status: 'loading' });
    try {
      /*
       * 🔴 `/api/market-pulse` 가 아니다. Vercel Hobby 의 함수 12개 상한 때문에 이 응답은
       *    `market-indices` 함수에 얹혀 간다(그쪽 handler 머리말 참고). 주소를 예뻐 보이게
       *    고치려면 함수를 하나 더 만들어야 하고, 그러면 **배포가 실패한다.**
       */
      const response = await fetch('/api/market-indices?surface=pulse');
      if (!response.ok) throw new Error(String(response.status));
      const snapshot = (await response.json()) as MarketPulseSnapshot;
      /*
       * 모양을 확인한다. 배열이 아니면 정적 셸(index.html)이 온 것이다 —
       * 함수가 배포되지 않은 환경에서 실제로 그렇게 온다.
       */
      if (!Array.isArray(snapshot.indicators)) throw new Error('shape');
      if (aliveRef.current) setState({ status: 'ready', snapshot });
    } catch {
      if (aliveRef.current) setState({ status: 'failed' });
    }
  }, []);

  useEffect(() => {
    aliveRef.current = true;
    void load();
    return () => {
      aliveRef.current = false;
    };
  }, [load]);

  return { state, reload: load };
}
