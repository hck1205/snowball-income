import { useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { analyzeBasket, previewAddDelta } from '@/shared/lib/etfOverlap';
import type { EtfHoldingsSnapshot, EtfUniverseEntry } from '@/shared/lib/etfOverlap';
import { TickerPageShell } from '../components';
import { TICKER_OVERLAP_COPY } from '../copy';
import { useDocumentMeta, useEtfSnapshots, useEtfUniverse } from '../hooks';
import { MAX_OVERLAP_ETFS, normalizeOverlapSelection, searchEtfUniverse } from '../utils';
import { useOverlapChange } from './hooks';
import TickerOverlapView from './TickerOverlapPage.view';
import type { OverlapCandidate, OverlapSlot, TickerOverlapViewModel } from './TickerOverlapPage.types';

const copy = TICKER_OVERLAP_COPY;

/** 바구니를 담는 쿼리 파라미터 — 비교 화면(`?t=`)과 같은 이름. 🔴 해시를 쓰지 않는다(경로 기반 라우팅 유지). */
const SELECTION_PARAM = 't';

/**
 * "담으면 몇 %p" 미리보기를 위해 보유 종목을 미리 받아 둘 후보 수. 목록 전체를 받지 않는다 —
 * 보이는 위쪽 몇 줄이면 충분하고, 한 줄마다 수십 KB 다.
 */
const PREVIEW_PREFETCH = 12;

/**
 * `/ticker/overlap` — ETF 겹침 컨테이너.
 *
 * 바구니는 **URL 이 소유한다**(`?t=SCHD,VOO`). 비교 화면과 같은 이유다 — 조합을 남에게 보낼 수 있고,
 * 뒤로가기가 한 번에 이 화면을 나간다(`replace`).
 * ⚠ 이 화면은 계산을 하지 않는다 — 겹침은 `shared/lib/etfOverlap` 의 순수 함수가 낸다.
 */
export default function TickerOverlapPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState('');

  const selected = useMemo(
    () => normalizeOverlapSelection((searchParams.get(SELECTION_PARAM) ?? '').split(',')),
    [searchParams]
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

  const basketSnapshots = useMemo(
    () => selected.map(readySnapshot).filter((snapshot): snapshot is EtfHoldingsSnapshot => snapshot !== null),
    [selected, readySnapshot]
  );
  const analysis = useMemo(() => analyzeBasket(basketSnapshots), [basketSnapshots]);
  const isSettled = selected.every((ticker) => snapshots.get(ticker)?.status !== 'loading');

  const selectionKey = selected.join(',');
  const { change, markChange } = useOverlapChange({ selectionKey, isSettled, overlapRate: analysis.overlapRate });

  /** 바구니를 바꾼다(URL 에 쓴다). 정규화한 새 바구니를 돌려준다 — 변화 추적이 그 값을 기다린다. */
  const commit = useCallback(
    (tickers: readonly string[]): string[] => {
      const next = normalizeOverlapSelection(tickers);
      setSearchParams(next.length === 0 ? {} : { [SELECTION_PARAM]: next.join(',') }, { replace: true });
      return next;
    },
    [setSearchParams]
  );

  const handleAdd = useCallback(
    (ticker: string) => {
      if (selected.includes(ticker) || selected.length >= MAX_OVERLAP_ETFS) return;
      markChange('added', ticker, commit([...selected, ticker]));
    },
    [commit, markChange, selected]
  );

  const handleRemove = useCallback(
    (ticker: string) => {
      if (!selected.includes(ticker)) return;
      markChange(
        'removed',
        ticker,
        commit(selected.filter((item) => item !== ticker))
      );
    },
    [commit, markChange, selected]
  );

  /* Enter — 맨 위의 **담을 수 있는** 결과를 담고 검색창을 비운다(다음 검색을 바로 칠 수 있게). */
  const handleSubmitQuery = useCallback(() => {
    const first = listed.find((entry) => entry.hasHoldings && !selected.includes(entry.ticker));
    if (!first || selected.length >= MAX_OVERLAP_ETFS) return;
    handleAdd(first.ticker);
    setQuery('');
  }, [handleAdd, listed, selected]);

  const viewModel = useMemo<TickerOverlapViewModel>(() => {
    const candidates: OverlapCandidate[] = listed.map((entry) => {
      const snapshot = entry.hasHoldings ? readySnapshot(entry.ticker) : null;
      const inBasket = selected.includes(entry.ticker);
      return {
        ticker: entry.ticker,
        name: entry.name,
        hasHoldings: entry.hasHoldings,
        inBasket,
        preview: snapshot && !inBasket ? previewAddDelta(basketSnapshots, snapshot, analysis.overlapRate) : null
      };
    });

    const slots: OverlapSlot[] = selected.map((ticker) => {
      const state = snapshots.get(ticker);
      return {
        ticker,
        status: state?.status ?? 'loading',
        asOfDate: state?.status === 'ready' ? state.data.asOfDate : null
      };
    });

    return {
      listStatus: universe.status,
      query,
      candidates,
      isSearching,
      slots,
      isAtLimit: selected.length >= MAX_OVERLAP_ETFS,
      analysis,
      analyzedCount: basketSnapshots.length,
      change,
      asOfItems: basketSnapshots.map((snapshot) => `${snapshot.ticker} ${snapshot.asOfDate}`)
    };
  }, [analysis, basketSnapshots, change, isSearching, listed, query, readySnapshot, selected, snapshots, universe.status]);

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
      />
    </TickerPageShell>
  );
}
