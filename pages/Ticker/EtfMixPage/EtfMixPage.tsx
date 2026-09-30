import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { buildWeightedTickersPrefillState } from '@/shared/constants';
import { SIMULATOR_PATH } from '@/shared/constants/routes';
import { ANALYTICS_EVENT, track } from '@/shared/lib/analytics';
import { analyzeBasket } from '@/shared/lib/etfOverlap';
import type { EtfHoldingsSnapshot, EtfUniverseEntry } from '@/shared/lib/etfOverlap';
import { TickerPageShell } from '../components';
import { ETF_MIX_COPY } from '../copy';
import { useDocumentMeta, useEtfSnapshots, useEtfUniverse } from '../hooks';
import { OVERLAP_DEFAULT_WEIGHT, searchEtfUniverse } from '../utils';
import { useEtfMixBasket, useOverlapChange } from './hooks';
import EtfMixView from './EtfMixPage.view';
import { buildEtfMixViewModel } from './EtfMixPage.utils';

const copy = ETF_MIX_COPY;

/**
 * "담으면 몇 %p" 미리보기를 위해 보유 종목을 미리 받아 둘 후보 수. 목록 전체를 받지 않는다 —
 * 보이는 위쪽 몇 줄이면 충분하고, 한 줄마다 수십 KB 다.
 */
const PREVIEW_PREFETCH = 12;

/**
 * `/ticker/overlap` — ETF 조합 짜기 컨테이너.
 *
 * 상태의 주인은 셋이다: 바구니는 URL(`useEtfMixBasket`), 목록·보유 종목은 정적 파일(`useEtfUniverse`·
 * `useEtfSnapshots`), 검색어만 이 컴포넌트. 여기서는 그 셋을 잇고, 화면 모델은 `buildEtfMixViewModel` 이 만든다.
 * ⚠ 이 화면은 계산을 하지 않는다 — 겹침은 `shared/lib/etfOverlap` 의 순수 함수가 낸다.
 */
export default function EtfMixPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const { basket, add, remove, setWeight, equalize } = useEtfMixBasket();
  const selected = basket.tickers;

  const universe = useEtfUniverse();
  const isSearching = query.trim().length > 0;
  const listed = useMemo<EtfUniverseEntry[]>(() => {
    if (universe.status !== 'ready') return [];
    if (isSearching) return searchEtfUniverse(universe.data.etfs, query);
    const byTicker = new Map(universe.data.etfs.map((entry) => [entry.ticker, entry]));
    return universe.data.popular
      .map((ticker) => byTicker.get(ticker))
      .filter((entry): entry is EtfUniverseEntry => entry !== undefined);
  }, [universe, isSearching, query]);

  /* 바구니 + 미리보기 후보. 바구니가 먼저라 그쪽 요청이 먼저 나간다. */
  const wanted = useMemo(() => {
    const prefetch = listed
      .filter((entry) => entry.hasHoldings && !selected.includes(entry.ticker))
      .slice(0, PREVIEW_PREFETCH)
      .map((entry) => entry.ticker);
    return [...selected, ...prefetch];
  }, [listed, selected]);
  const snapshots = useEtfSnapshots(wanted);

  /* 계산에는 보유 종목을 받은 ETF 만 들어간다 — 비중도 그 ETF 들의 것만 같은 순서로 넘긴다. */
  const { basketSnapshots, basketWeights } = useMemo(() => {
    const ready: EtfHoldingsSnapshot[] = [];
    const weights: number[] = [];
    basket.tickers.forEach((ticker, index) => {
      const state = snapshots.get(ticker);
      if (state?.status !== 'ready') return;
      ready.push(state.data);
      weights.push(basket.weights[index] ?? OVERLAP_DEFAULT_WEIGHT);
    });
    return { basketSnapshots: ready, basketWeights: weights };
  }, [basket, snapshots]);
  const analysis = useMemo(() => analyzeBasket(basketSnapshots, basketWeights), [basketSnapshots, basketWeights]);

  const { change, markChange } = useOverlapChange({
    selectionKey: selected.join(','),
    isSettled: selected.every((ticker) => snapshots.get(ticker)?.status !== 'loading'),
    overlapRate: analysis.overlapRate
  });

  const handleAdd = useCallback(
    (ticker: string) => {
      const next = add(ticker);
      if (next) markChange('added', ticker, next);
    },
    [add, markChange]
  );

  const handleRemove = useCallback(
    (ticker: string) => {
      const next = remove(ticker);
      if (next) markChange('removed', ticker, next);
    },
    [remove, markChange]
  );

  /* Enter — 맨 위의 **담을 수 있는** 결과를 담고 검색창을 비운다(다음 검색을 바로 칠 수 있게). */
  const handleSubmitQuery = useCallback(() => {
    const first = listed.find((entry) => entry.hasHoldings && !selected.includes(entry.ticker));
    if (!first) return;
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

  const viewModel = useMemo(
    () =>
      buildEtfMixViewModel({
        listStatus: universe.status,
        query,
        isSearching,
        listed,
        basket,
        snapshots,
        basketSnapshots,
        basketWeights,
        analysis,
        change,
        simulation: { canSimulate: prefill.state !== null, excluded: prefill.excluded }
      }),
    [analysis, basket, basketSnapshots, basketWeights, change, isSearching, listed, prefill, query, snapshots, universe.status]
  );

  useDocumentMeta({
    title: copy.meta.title,
    description: copy.meta.description,
    pathname: '/ticker/overlap'
  });

  return (
    <TickerPageShell>
      <EtfMixView
        viewModel={viewModel}
        onQueryChange={setQuery}
        onSubmitQuery={handleSubmitQuery}
        onAdd={handleAdd}
        onRemove={handleRemove}
        onWeightChange={setWeight}
        onEqualize={equalize}
        onSimulate={handleSimulate}
      />
    </TickerPageShell>
  );
}
