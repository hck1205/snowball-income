import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { TickerPageShell } from '../components';
import { useDocumentMeta } from '../hooks';
import { TICKER_COMPARE_COPY } from '../copy';
import {
  COMPARE_PRESETS,
  MAX_COMPARE_TICKERS,
  MIN_COMPARE_TICKERS,
  buildTickerCompareModel,
  getCompareCandidates,
  normalizeCompareSelection
} from '../utils';
import TickerCompareView from './TickerComparePage.view';
import type { TickerCompareViewModel } from './TickerComparePage.types';

const copy = TICKER_COMPARE_COPY;

/** 선택을 담는 쿼리 파라미터. 🔴 해시(`#`)를 쓰지 않는다(확정 결정 — 경로 기반 라우팅 유지). */
const SELECTION_PARAM = 't';

/**
 * `/ticker/compare` — 종목 비교 컨테이너.
 *
 * 선택은 **URL 이 소유한다**(`?t=SCHD,JEPI`). 로컬 상태로 들고 있으면 그 화면을 남에게 보낼 수 없고,
 * 뒤로가기가 선택 변경을 되돌리지 못한다. 비교는 "이 조합 봐"라고 공유하기 좋은 화면이라 그 값이 크다.
 *
 * ⚠ 이 화면은 계산을 하지 않는다 — 모델은 전부 `pages/Ticker/utils` 의 순수 함수가 만든다.
 */
export default function TickerComparePage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const selected = useMemo(
    () => normalizeCompareSelection((searchParams.get(SELECTION_PARAM) ?? '').split(',')),
    [searchParams]
  );

  const viewModel = useMemo<TickerCompareViewModel>(() => {
    const model = buildTickerCompareModel(selected);
    return {
      model,
      candidates: getCompareCandidates(),
      isAtLimit: model.columns.length >= MAX_COMPARE_TICKERS,
      hasEnough: model.columns.length >= MIN_COMPARE_TICKERS,
      suggestions: COMPARE_PRESETS
    };
  }, [selected]);

  /*
   * 선택 변경은 **히스토리를 쌓지 않는다**(`replace`). 칩을 몇 번 눌렀다고 뒤로가기를 그만큼 눌러야
   * 이전 화면으로 나갈 수 있으면 함정이 된다. 공유는 현재 주소를 복사하는 것으로 충분하다.
   */
  const commit = useCallback(
    (tickers: readonly string[]) => {
      const next = normalizeCompareSelection(tickers);
      setSearchParams(next.length === 0 ? {} : { [SELECTION_PARAM]: next.join(',') }, { replace: true });
    },
    [setSearchParams]
  );

  const handleAdd = useCallback((ticker: string) => commit([...selected, ticker]), [commit, selected]);
  const handleRemove = useCallback(
    (ticker: string) => commit(selected.filter((item) => item !== ticker)),
    [commit, selected]
  );

  useDocumentMeta({
    title: copy.meta.title,
    description: copy.meta.description,
    pathname: '/ticker/compare'
  });

  return (
    <TickerPageShell>
      <TickerCompareView
        viewModel={viewModel}
        onAdd={handleAdd}
        onRemove={handleRemove}
        onApplySuggestion={commit}
      />
    </TickerPageShell>
  );
}
