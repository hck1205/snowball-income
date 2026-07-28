import { useCallback, useEffect, useRef } from 'react';
import { atom } from 'jotai/vanilla';
import {
  MARKET_INDICES_ENDPOINT,
  parseMarketIndicesSnapshot,
  type MarketIndicesSnapshot,
  type MarketIndicesView
} from '@/shared/lib/marketIndices';
import { useAtomValue, useAtomWrite } from '@/jotai/atom';

/**
 * 주요 지수 시세 조회 상태 — **비영속 in-memory**(환율 atom `fxViewAtom` 과 같은 모델).
 *
 * 조회를 컴포넌트에서 끌어올려 여기 둔다: 표시 부품이 여러 곳(랜딩 히어로·모바일 드로어 등)에서
 * 같은 값을 봐야 하고, 부품이 언마운트돼도 값과 조회 루프가 살아 있어야 한다.
 *
 * ⚠ 저장 payload·공유 URL 어디에도 넣지 않는다(참고 시세). 클라우드 저장도 유발하지 않는다.
 */
export const marketIndicesViewAtom = atom<MarketIndicesView>({ status: 'loading' });

/**
 * 조회 결과 반영(쓰기 전용). 스냅샷이 있으면 success, 없으면 **직전 성공값 유무**에 따라 stale/error.
 *
 * 직전 성공값을 훅의 ref 가 아니라 atom 현재값에서 되읽는다 — 드라이버가 잠시 언마운트됐다 다시
 * 마운트돼도(라우트 이동 등) 이미 받아둔 값이 error 로 강등되지 않는다.
 */
export const applyMarketIndicesFetchResultAtom = atom(
  null,
  (get, set, snapshot: MarketIndicesSnapshot | null) => {
    if (snapshot !== null) {
      set(marketIndicesViewAtom, { status: 'success', snapshot });
      return;
    }
    const current = get(marketIndicesViewAtom);
    const lastGood = current.status === 'success' || current.status === 'stale' ? current.snapshot : null;
    set(
      marketIndicesViewAtom,
      lastGood === null ? { status: 'error' } : { status: 'stale', snapshot: lastGood }
    );
  }
);

/**
 * 탭 복귀(visibilitychange) 시 최소 재조회 간격. 엣지 캐시가 15분이라 그보다 촘촘히 물어도 얻는 게
 * 없고, 실패 시 계측이 스팸된다.
 */
const REFRESH_MIN_INTERVAL_MS = 5 * 60 * 1000;

/**
 * `/api/market-indices` 조회 드라이버 — **동시에 렌더되는 곳이 하나여야** 한다(둘 이상이면 중복 조회).
 *
 * ⚠ **현재 마운트 지점은 아직 없다.** 이 훅은 지수 스트립이 들어갈 랜딩에서 한 번 부르도록 준비만 해 둔
 * 상태다 — 표시 부품이 자기 안에서 부르지 말고, 그 부품을 놓는 **페이지**가 한 번만 부른다
 * (환율 `useFxRateSync` 와 같은 규약).
 *
 * 첫 조회는 마운트 시, 이후 탭 복귀 때 조용히 갱신한다(갱신은 loading 으로 되돌리지 않아 깜빡임이 없다).
 * 갱신이 실패하면 직전 성공값을 stale 로 유지한다. 값을 **구독하지 않고 쓰기만** 하므로 이 훅을 부르는
 * 컴포넌트는 시세가 도착해도 리렌더되지 않는다(구독자만 갱신된다).
 */
export const useMarketIndicesSync = (): void => {
  const applyFetchResult = useAtomWrite(applyMarketIndicesFetchResultAtom);
  const mounted = useRef(true);
  const lastFetchAt = useRef(0);

  const load = useCallback(
    async (signal?: AbortSignal) => {
      lastFetchAt.current = Date.now();
      try {
        const response = await fetch(MARKET_INDICES_ENDPOINT, signal ? { signal } : undefined);
        if (!response.ok) throw new Error(`market_indices_http_${response.status}`);
        const parsed = parseMarketIndicesSnapshot(await response.json());
        if (parsed === null) throw new Error('market_indices_bad_payload');
        if (!mounted.current) return;
        applyFetchResult(parsed);
      } catch (error) {
        // 언마운트/취소는 실패로 치지 않는다(계측·상태 갱신 안 함).
        if (!mounted.current || signal?.aborted) return;
        // 무음 실패 금지 — 기존 OPERATION_ERROR 재사용(신규 상수 X).
        //
        // ⚠ analytics 는 **동적 import** 로 미룬다(정적 import 금지). `shared/lib/analytics.ts` 는 모듈
        // 최상단에서 `import.meta.env.VITE_*` 를 읽는데, 이 파일은 `@/jotai` 배럴 → `shareLink.ts` →
        // `server/handlers/Og` 를 타고 **`api/og.js` 번들에 실린다**. Node ESM 에서 `import.meta.env` 는
        // undefined 라, 정적 import 면 핸들러가 호출되기도 전에 **모듈 평가 단계**에서 TypeError 로 죽는다
        // (= 모든 공유 링크·포폴 글의 OG 이미지가 500). 여기 catch 안은 브라우저에서만 실행되므로 안전하다.
        const { ANALYTICS_EVENT, trackEvent } = await import('@/shared/lib/analytics');
        trackEvent(ANALYTICS_EVENT.OPERATION_ERROR, {
          operation: 'market_indices_fetch',
          reason: error instanceof Error ? error.message : 'unknown'
        });
        applyFetchResult(null);
      }
    },
    [applyFetchResult]
  );

  useEffect(() => {
    mounted.current = true;
    const controller = new AbortController();
    void load(controller.signal);

    // 탭 복귀 시 조용히 갱신(throttle). 지수는 장중에 계속 움직여 값이 오래됐을 수 있다.
    const onVisibility = () => {
      if (document.visibilityState !== 'visible') return;
      if (Date.now() - lastFetchAt.current < REFRESH_MIN_INTERVAL_MS) return;
      void load();
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      mounted.current = false;
      controller.abort();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [load]);
};

/** 지수 조회 상태(status + snapshot) 구독. 표시 부품이 이 값만 보고 그린다. */
export const useMarketIndicesViewAtomValue = () => useAtomValue(marketIndicesViewAtom);
