import { useEffect, useMemo, useState } from 'react';
import type { EtfHoldingsSnapshot, EtfUniverse } from '@/shared/lib/etfOverlap';

/**
 * ETF 조합 짜기 화면의 데이터 — **정적 파일**을 받는다(`scripts/etfHoldings` 가 만든다).
 *
 * 🔴 번들에 싣지 않는 이유: 검색 목록은 4,000여 줄이고 보유 종목은 ETF 하나에 수십 KB 다. 전부 번들에 넣으면
 * 이 화면을 열지 않는 사람까지 그 값을 치른다. 목록은 화면이 열릴 때 한 번, 보유 종목은 **담거나 미리볼 때만** 받는다.
 * ⚠ 같은 파일을 두 번 받지 않게 모듈 캐시를 둔다. 실패한 요청은 캐시에서 지운다 — 다음에 다시 시도할 수 있게.
 */
export const ETF_HOLDINGS_BASE_PATH = '/data/etf-holdings';

export type LoadState<T> =
  | { readonly status: 'loading' }
  | { readonly status: 'ready'; readonly data: T }
  | { readonly status: 'error' };

const cache = new Map<string, Promise<unknown>>();

const loadJson = <T>(path: string): Promise<T> => {
  const hit = cache.get(path);
  if (hit) return hit as Promise<T>;
  const request = fetch(path).then((response) => {
    if (!response.ok) throw new Error(`${response.status} ${path}`);
    return response.json() as Promise<T>;
  });
  cache.set(path, request);
  request.catch(() => cache.delete(path));
  return request;
};

/** 테스트 전용 — 케이스 사이에 캐시가 새지 않게. */
export const resetEtfHoldingsCache = (): void => cache.clear();

export const useEtfUniverse = (): LoadState<EtfUniverse> => {
  const [state, setState] = useState<LoadState<EtfUniverse>>({ status: 'loading' });
  useEffect(() => {
    let alive = true;
    loadJson<EtfUniverse>(`${ETF_HOLDINGS_BASE_PATH}/index.json`).then(
      (data) => alive && setState({ status: 'ready', data }),
      () => alive && setState({ status: 'error' })
    );
    return () => {
      alive = false;
    };
  }, []);
  return state;
};

/**
 * 여러 ETF 의 보유 종목. 목록이 바뀌면 **새로 필요한 것만** 받는다.
 * 돌려주는 맵에는 요청한 티커만 있다(빠진 것은 아직 요청 전 = 로딩으로 본다).
 */
export const useEtfSnapshots = (tickers: readonly string[]): ReadonlyMap<string, LoadState<EtfHoldingsSnapshot>> => {
  const [loaded, setLoaded] = useState<ReadonlyMap<string, LoadState<EtfHoldingsSnapshot>>>(() => new Map());
  const key = tickers.join(',');

  useEffect(() => {
    let alive = true;
    for (const ticker of key ? key.split(',') : []) {
      loadJson<EtfHoldingsSnapshot>(`${ETF_HOLDINGS_BASE_PATH}/${encodeURIComponent(ticker)}.json`).then(
        (data) => {
          if (!alive) return;
          setLoaded((previous) => {
            if (previous.get(ticker)?.status === 'ready') return previous;
            return new Map(previous).set(ticker, { status: 'ready', data });
          });
        },
        () => {
          if (!alive) return;
          setLoaded((previous) => new Map(previous).set(ticker, { status: 'error' }));
        }
      );
    }
    return () => {
      alive = false;
    };
  }, [key]);

  return useMemo(() => {
    const out = new Map<string, LoadState<EtfHoldingsSnapshot>>();
    for (const ticker of key ? key.split(',') : []) {
      out.set(ticker, loaded.get(ticker) ?? { status: 'loading' });
    }
    return out;
  }, [key, loaded]);
};
