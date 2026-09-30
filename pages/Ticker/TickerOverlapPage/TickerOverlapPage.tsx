import { useCallback, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { buildWeightedTickersPrefillState } from '@/shared/constants';
import { SIMULATOR_PATH } from '@/shared/constants/routes';
import { ANALYTICS_EVENT, track } from '@/shared/lib/analytics';
import { analyzeBasket, previewAddDelta } from '@/shared/lib/etfOverlap';
import type { EtfHoldingsSnapshot, EtfUniverseEntry } from '@/shared/lib/etfOverlap';
import { TickerPageShell } from '../components';
import { TICKER_OVERLAP_COPY } from '../copy';
import { useDocumentMeta, useEtfSnapshots, useEtfUniverse } from '../hooks';
import {
  MAX_OVERLAP_ETFS,
  OVERLAP_DEFAULT_WEIGHT,
  nextOverlapWeight,
  normalizeOverlapBasket,
  overlapBasketParams,
  overlapShares,
  searchEtfUniverse
} from '../utils';
import type { OverlapBasketState } from '../utils';
import { useOverlapChange } from './hooks';
import TickerOverlapView from './TickerOverlapPage.view';
import type { OverlapCandidate, OverlapSlot, TickerOverlapViewModel } from './TickerOverlapPage.types';

const copy = TICKER_OVERLAP_COPY;

/**
 * "담으면 몇 %p" 미리보기를 위해 보유 종목을 미리 받아 둘 후보 수. 목록 전체를 받지 않는다 —
 * 보이는 위쪽 몇 줄이면 충분하고, 한 줄마다 수십 KB 다.
 */
const PREVIEW_PREFETCH = 12;

/**
 * `/ticker/overlap` — ETF 조합 짜기 컨테이너.
 *
 * 바구니(티커 + 비중)는 **URL 이 소유한다**(`?t=SCHD,VOO&w=60,40`). 비교 화면과 같은 이유다 — 조합을 남에게
 * 보낼 수 있고, 뒤로가기가 한 번에 이 화면을 나간다(`replace`). 비중을 안 건드린 조합은 `w` 없이 예전 링크와 같다.
 * ⚠ 이 화면은 계산을 하지 않는다 — 겹침은 `shared/lib/etfOverlap` 의 순수 함수가 낸다.
 */
export default function TickerOverlapPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const basket = useMemo(
    () => normalizeOverlapBasket((searchParams.get('t') ?? '').split(','), (searchParams.get('w') ?? '').split(',')),
    [searchParams]
  );
  const selected = basket.tickers;
  const weightByTicker = useMemo(
    () => new Map(basket.tickers.map((ticker, index) => [ticker, basket.weights[index]!])),
    [basket]
  );

  const universe = useEtfUniverse();
  const entries = universe.status === 'ready' ? universe.data.etfs : null;
  const entryByTicker = useMemo(
    () => new Map<string, EtfUniverseEntry>((entries ?? []).map((entry) => [entry.ticker, entry])),
    [entries]
  );

  const isSearching = query.trim().length > 0;
  const listed = useMemo<EtfUniverseEntry[]>(() => {
    if (universe.status !== 'ready') return [];
    if (isSearching) return searchEtfUniverse(universe.data.etfs, query);
    return universe.data.popular
      .map((ticker) => entryByTicker.get(ticker))
      .filter((entry): entry is EtfUniverseEntry => entry !== undefined);
  }, [universe, isSearching, query, entryByTicker]);

  /* 바구니 + 미리보기 후보. 바구니가 먼저라 그쪽 요청이 먼저 나간다. */
  const wanted = useMemo(() => {
    const prefetch = listed
      .filter((entry) => entry.hasHoldings && !selected.includes(entry.ticker))
      .slice(0, PREVIEW_PREFETCH)
      .map((entry) => entry.ticker);
    return [...selected, ...prefetch];
  }, [listed, selected]);
  const snapshots = useEtfSnapshots(wanted);

  const readySnapshot = useCallback(
    (ticker: string): EtfHoldingsSnapshot | null => {
      const state = snapshots.get(ticker);
      return state?.status === 'ready' ? state.data : null;
    },
    [snapshots]
  );

  /* 계산에는 보유 종목을 받은 ETF 만 들어간다 — 비중도 그 ETF 들의 것만 같은 순서로 넘긴다. */
  const basketSnapshots = useMemo(
    () => selected.map(readySnapshot).filter((snapshot): snapshot is EtfHoldingsSnapshot => snapshot !== null),
    [selected, readySnapshot]
  );
  const basketWeights = useMemo(
    () => basketSnapshots.map((snapshot) => weightByTicker.get(snapshot.ticker) ?? OVERLAP_DEFAULT_WEIGHT),
    [basketSnapshots, weightByTicker]
  );
  const analysis = useMemo(() => analyzeBasket(basketSnapshots, basketWeights), [basketSnapshots, basketWeights]);
  const isSettled = selected.every((ticker) => snapshots.get(ticker)?.status !== 'loading');

  const { change, markChange } = useOverlapChange({
    selectionKey: selected.join(','),
    isSettled,
    overlapRate: analysis.overlapRate
  });

  /** 바구니를 바꾼다(URL 에 쓴다). 정규화한 새 티커 목록을 돌려준다 — 변화 추적이 그 값을 기다린다. */
  const commit = useCallback(
    (next: OverlapBasketState): string[] => {
      const normalized = normalizeOverlapBasket(next.tickers, next.weights.map(String));
      setSearchParams(overlapBasketParams(normalized), { replace: true });
      return normalized.tickers;
    },
    [setSearchParams]
  );

  const handleAdd = useCallback(
    (ticker: string) => {
      if (selected.includes(ticker) || selected.length >= MAX_OVERLAP_ETFS) return;
      markChange(
        'added',
        ticker,
        commit({ tickers: [...basket.tickers, ticker], weights: [...basket.weights, nextOverlapWeight(basket.weights)] })
      );
    },
    [basket, commit, markChange, selected]
  );

  const handleRemove = useCallback(
    (ticker: string) => {
      if (!selected.includes(ticker)) return;
      const keep = basket.tickers.map((item) => item !== ticker);
      markChange(
        'removed',
        ticker,
        commit({
          tickers: basket.tickers.filter((_, index) => keep[index]),
          weights: basket.weights.filter((_, index) => keep[index])
        })
      );
    },
    [basket, commit, markChange, selected]
  );

  /* 비중은 슬라이더를 움직이는 동안 계속 바뀐다 — 변화 칩은 담기·빼기에만 붙인다(게이지가 흐르는 것으로 충분하다). */
  const handleWeightChange = useCallback(
    (ticker: string, weight: number) => {
      commit({
        tickers: basket.tickers,
        weights: basket.tickers.map((item, index) => (item === ticker ? weight : basket.weights[index]!))
      });
    },
    [basket, commit]
  );

  const handleEqualize = useCallback(() => {
    commit({ tickers: basket.tickers, weights: basket.tickers.map(() => OVERLAP_DEFAULT_WEIGHT) });
  }, [basket, commit]);

  /* Enter — 맨 위의 **담을 수 있는** 결과를 담고 검색창을 비운다(다음 검색을 바로 칠 수 있게). */
  const handleSubmitQuery = useCallback(() => {
    const first = listed.find((entry) => entry.hasHoldings && !selected.includes(entry.ticker));
    if (!first || selected.length >= MAX_OVERLAP_ETFS) return;
    handleAdd(first.ticker);
    setQuery('');
  }, [handleAdd, listed, selected]);

  /*
   * "이 조합으로 배당 시뮬레이션" — 비중 그대로 시뮬레이터 새 탭으로 보낸다.
   * 🔴 프리필은 URL 이 아니라 `location.state` 다(비교 화면 "이 종목으로 계산"과 같은 검증된 계약 — 받는 쪽은 그대로).
   * 🔴 시뮬레이터 프리셋에 없는 ETF 는 빠진다 — 화면이 버튼 옆에서 먼저 말한다(`simulation.excluded`).
   */
  const prefill = useMemo(
    () =>
      buildWeightedTickersPrefillState(
        basket.tickers.map((ticker, index) => ({ ticker, weight: basket.weights[index]! })),
        copy.simulate.scenarioName
      ),
    [basket]
  );

  const handleSimulate = useCallback(() => {
    if (!prefill.state) return;
    track(ANALYTICS_EVENT.ETF_MIX_TO_SIMULATOR, {
      etf_count: prefill.state.portfolioSimulationPrefill.holdings.length,
      excluded_count: prefill.excluded.length
    });
    navigate(SIMULATOR_PATH, { state: prefill.state });
  }, [navigate, prefill]);

  const viewModel = useMemo<TickerOverlapViewModel>(() => {
    const candidates: OverlapCandidate[] = listed.map((entry) => {
      const snapshot = entry.hasHoldings ? readySnapshot(entry.ticker) : null;
      const inBasket = selected.includes(entry.ticker);
      return {
        ticker: entry.ticker,
        name: entry.name,
        hasHoldings: entry.hasHoldings,
        inBasket,
        preview:
          snapshot && !inBasket
            ? previewAddDelta(basketSnapshots, snapshot, { weights: basketWeights, currentRate: analysis.overlapRate })
            : null
      };
    });

    const shares = overlapShares(basket.weights);
    const slots: OverlapSlot[] = selected.map((ticker, index) => {
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
      listStatus: universe.status,
      query,
      candidates,
      isSearching,
      slots,
      isAtLimit: selected.length >= MAX_OVERLAP_ETFS,
      isEqualWeight: basket.weights.every((weight) => weight === OVERLAP_DEFAULT_WEIGHT),
      analysis,
      analyzedCount: basketSnapshots.length,
      change,
      asOfItems: basketSnapshots.map((snapshot) => `${snapshot.ticker} ${snapshot.asOfDate}`),
      simulation: { canSimulate: prefill.state !== null, excluded: prefill.excluded }
    };
  }, [
    analysis,
    basket,
    basketSnapshots,
    basketWeights,
    change,
    isSearching,
    listed,
    prefill,
    query,
    readySnapshot,
    selected,
    snapshots,
    universe.status
  ]);

  useDocumentMeta({
    title: copy.meta.title,
    description: copy.meta.description,
    pathname: '/ticker/overlap'
  });

  return (
    <TickerPageShell>
      <TickerOverlapView
        viewModel={viewModel}
        onQueryChange={setQuery}
        onSubmitQuery={handleSubmitQuery}
        onAdd={handleAdd}
        onRemove={handleRemove}
        onWeightChange={handleWeightChange}
        onEqualize={handleEqualize}
        onSimulate={handleSimulate}
      />
    </TickerPageShell>
  );
}
