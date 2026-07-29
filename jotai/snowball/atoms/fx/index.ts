import { useCallback, useEffect, useRef } from 'react';
import { atom } from 'jotai/vanilla';
import { FX_ENDPOINT, parseFxRate, type ExchangeRateView, type FxRate } from '@/shared/lib/fx';
import { useAtomValue, useAtomWrite } from '@/jotai/atom';

/**
 * 원↔달러 환율 조회 상태 — **비영속 in-memory**.
 *
 * 환율 위젯과 결과 표시 통화(원↔달러 토글)가 같은 값을 봐야 하므로, 조회를 컴포넌트에서 끌어올려
 * 여기에 둔다. 조회는 `useFxRateSync`(**동시에 마운트되는 곳은 하나뿐**)가 수행하고, 소비자는 구독만 한다
 * — 위젯이 언마운트돼도(모바일 드로어 접힘) 값과 조회 루프는 그대로 살아 있다.
 *
 * ⚠ 저장 payload·공유 URL 어디에도 넣지 않는다(참고값). 클라우드 저장도 유발하지 않는다.
 */
export const fxViewAtom = atom<ExchangeRateView>({ status: 'loading' });

/**
 * 조회 결과 반영(쓰기 전용). `rate` 가 있으면 success, 없으면 **직전 성공값 유무**에 따라 stale/error.
 *
 * 직전 성공값을 훅의 ref가 아니라 atom 현재값에서 되읽는다 — 드라이버가 잠시 언마운트됐다 다시
 * 마운트돼도(라우트 이동 등) 이미 받아둔 값이 error 로 강등되지 않는다.
 */
export const applyFxFetchResultAtom = atom(null, (get, set, rate: FxRate | null) => {
  if (rate !== null) {
    set(fxViewAtom, { status: 'success', rate });
    return;
  }
  const current = get(fxViewAtom);
  const lastGood = current.status === 'success' || current.status === 'stale' ? current.rate : null;
  set(fxViewAtom, lastGood === null ? { status: 'error' } : { status: 'stale', rate: lastGood });
});

/** 탭 복귀(visibilitychange) 시 최소 재조회 간격 — 실패 시 계측이 스팸되지 않게 throttle. */
const REFRESH_MIN_INTERVAL_MS = 10 * 60 * 1000;

/**
 * `/api/fx` 조회 드라이버 — **동시에 렌더되는 곳이 하나여야** 한다.
 *
 * 현재 마운트 지점은 `pages/Main`과 `pages/Portfolio/PortfolioPage` 둘이지만 **라우트가 배타적**이라
 * 동시에 살아 있지 않다(포트폴리오로 직접 들어온 사용자도 원화 환산·달러 표시 선호를 그대로 보려면
 * 그 라우트에서도 한 번은 조회해야 한다). 한 화면 안에서 둘 이상 마운트하지 말 것 — 중복 조회가 된다.
 *
 * 첫 조회는 마운트 시, 이후 탭 복귀 때 조용히 갱신한다(갱신은 loading 으로 되돌리지 않아 깜빡임이 없다).
 * 갱신이 실패하면 직전 성공값을 stale 로 유지한다. 값을 **구독하지 않고 쓰기만** 하므로
 * 이 훅을 부르는 컴포넌트는 환율이 도착해도 리렌더되지 않는다(구독자만 갱신된다).
 */
export const useFxRateSync = (): void => {
  const applyFetchResult = useAtomWrite(applyFxFetchResultAtom);
  const mounted = useRef(true);
  const lastFetchAt = useRef(0);

  const load = useCallback(
    async (signal?: AbortSignal) => {
      lastFetchAt.current = Date.now();
      try {
        const response = await fetch(FX_ENDPOINT, signal ? { signal } : undefined);
        if (!response.ok) throw new Error(`fx_http_${response.status}`);
        const parsed = parseFxRate(await response.json());
        if (parsed === null) throw new Error('fx_bad_payload');
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
          operation: 'fx_fetch',
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

    // 탭 복귀 시 조용히 갱신(throttle). 값이 오래됐을 수 있어 새로 불러 신선도를 맞춘다.
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

/** 환율 조회 상태(status + rate + asOf) 구독. 위젯이 그대로 그린다. */
export const useFxViewAtomValue = () => useAtomValue(fxViewAtom);
