import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { ANALYTICS_EVENT, trackEvent } from '@/shared/lib/analytics';
import type { ExchangeRateView, FxRate } from './ExchangeRateWidget.types';
import { formatAsOfDate, formatKrwRate, parseFxRate } from './ExchangeRateWidget.utils';
import {
  AsOf,
  Disclaimer,
  Message,
  Rate,
  RateLine,
  RateValue,
  Root,
  SkeletonBar,
  StaleMark
} from './ExchangeRateWidget.styled';

/** 서버 프록시 경로. 엣지 공유 캐시(6h/24h)라 클라이언트는 매 조회를 그냥 때려도 된다. */
const FX_ENDPOINT = '/api/fx';
const WIDGET_LABEL = '오늘의 원 달러 환율';
const DISCLAIMER = '참고용 · 시뮬레이션 계산에는 반영되지 않아요';
const FAILURE_MESSAGE = '환율을 불러오지 못했어요';

/** 탭 복귀(visibilitychange) 시 최소 재조회 간격 — 실패 시 계측이 스팸되지 않게 throttle. */
const REFRESH_MIN_INTERVAL_MS = 10 * 60 * 1000;

type FetchState = { rate: FxRate | null; phase: 'loading' | 'ready' | 'failed' };

/**
 * `/api/fx` 를 조회해 화면 상태를 만든다. 값은 **비영속 in-memory** 로만 쥔다 —
 * 저장 payload·공유 URL 어디에도 넣지 않는다(AC8/9). 첫 조회는 마운트 시, 이후 탭 복귀 때 조용히 갱신한다
 * (갱신은 loading 으로 되돌리지 않아 깜빡임이 없다). 갱신이 실패하면 직전 성공값을 stale 로 유지한다(AC5).
 */
const useExchangeRate = (): ExchangeRateView => {
  const [state, setState] = useState<FetchState>({ rate: null, phase: 'loading' });
  const lastGood = useRef<FxRate | null>(null);
  const mounted = useRef(true);
  const lastFetchAt = useRef(0);

  const load = useCallback(async (signal?: AbortSignal) => {
    lastFetchAt.current = Date.now();
    try {
      const response = await fetch(FX_ENDPOINT, signal ? { signal } : undefined);
      if (!response.ok) throw new Error(`fx_http_${response.status}`);
      const parsed = parseFxRate(await response.json());
      if (parsed === null) throw new Error('fx_bad_payload');
      if (!mounted.current) return;
      lastGood.current = parsed;
      setState({ rate: parsed, phase: 'ready' });
    } catch (error) {
      // 언마운트/취소는 실패로 치지 않는다(계측·상태 갱신 안 함).
      if (!mounted.current || signal?.aborted) return;
      // AC10: 무음 실패 금지 — 기존 OPERATION_ERROR 재사용(신규 상수 X).
      trackEvent(ANALYTICS_EVENT.OPERATION_ERROR, {
        operation: 'fx_fetch',
        reason: error instanceof Error ? error.message : 'unknown'
      });
      // 직전 성공값이 있으면 stale, 없으면 error 로 떨어진다(아래 파생).
      setState({ rate: lastGood.current, phase: 'failed' });
    }
  }, []);

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

  if (state.phase === 'loading') return { status: 'loading' };
  if (state.phase === 'ready' && state.rate) return { status: 'success', rate: state.rate };
  if (state.rate) return { status: 'stale', rate: state.rate };
  return { status: 'error' };
};

/**
 * 금일 원↔달러 환율 위젯 (표시 전용, Option A).
 *
 * 좌패널에 얹는 참고용 스트립 — 서버 프록시 `/api/fx` 의 값을 그대로 그린다. 계산 엔진과 완전히 분리돼 있어
 * (엔진에 아무것도 넘기지 않는다) 저장·공유·시뮬레이션 결과에 영향이 없다.
 */
function ExchangeRateWidgetComponent() {
  const view = useExchangeRate();
  const hasRate = view.status === 'success' || view.status === 'stale';

  return (
    <Root aria-label={WIDGET_LABEL} aria-busy={view.status === 'loading'}>
      {view.status === 'loading' ? (
        <>
          <RateLine>
            <SkeletonBar w="7.5em" aria-hidden="true" />
            <SkeletonBar w="6em" aria-hidden="true" />
          </RateLine>
          <Disclaimer>{DISCLAIMER}</Disclaimer>
        </>
      ) : null}

      {hasRate ? (
        <>
          <RateLine>
            <Rate>
              $1 ≈ <RateValue>{formatKrwRate(view.rate.rate)}</RateValue>원
            </Rate>
            <AsOf>
              {formatAsOfDate(view.rate.asOf)} 기준
              {view.status === 'stale' ? <StaleMark> · 업데이트 실패</StaleMark> : null}
            </AsOf>
          </RateLine>
          <Disclaimer>{DISCLAIMER}</Disclaimer>
        </>
      ) : null}

      {view.status === 'error' ? <Message>{FAILURE_MESSAGE}</Message> : null}
    </Root>
  );
}

const ExchangeRateWidget = memo(ExchangeRateWidgetComponent);

export default ExchangeRateWidget;
