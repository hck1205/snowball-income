import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { buildSingleTickerPrefillState } from '@/shared/constants';
import { SIMULATOR_PATH } from '@/shared/constants/routes';
import { ANALYTICS_EVENT, track } from '@/shared/lib/analytics';
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
import { buildPresetPreviews } from './TickerComparePage.utils';
import type { TickerCompareViewModel } from './TickerComparePage.types';

const copy = TICKER_COMPARE_COPY;

/** 선택을 담는 쿼리 파라미터. 🔴 해시(`#`)를 쓰지 않는다(확정 결정 — 경로 기반 라우팅 유지). */
const SELECTION_PARAM = 't';

/**
 * 어느 유입 화면이 보냈는지(`?from=congress`). 값은 `pages/Ticker/utils` 의 `CompareEntryPoint` 다.
 *
 * 🔴 **선택(`t`)과 달리 화면 동작에는 아무 영향이 없다** — 오직 측정용이다. 그래서 선택이 바뀔 때
 * 이 값을 URL 에 되싣지 않는다(`commit` 참고): 사용자가 여기서 조합을 바꾸면 그건 더 이상
 * "의원거래가 보낸 조합"이 아니고, 그대로 두면 그 화면의 성과로 잘못 집계된다.
 */
const ENTRY_PARAM = 'from';

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
  const navigate = useNavigate();

  const selected = useMemo(
    () => normalizeCompareSelection((searchParams.get(SELECTION_PARAM) ?? '').split(',')),
    [searchParams]
  );

  /**
   * 예시 조합의 커버리지 미리보기는 **선택과 무관**하다 — 상수 목록에서만 나온다.
   * 그래서 선택이 바뀔 때마다 열 벌을 다시 세지 않게 따로 메모한다(의존성 없음 = 최초 1회).
   */
  const suggestions = useMemo(() => buildPresetPreviews(COMPARE_PRESETS), []);

  const viewModel = useMemo<TickerCompareViewModel>(() => {
    const model = buildTickerCompareModel(selected);
    return {
      model,
      candidates: getCompareCandidates(),
      isAtLimit: model.columns.length >= MAX_COMPARE_TICKERS,
      hasEnough: model.columns.length >= MIN_COMPARE_TICKERS,
      suggestions
    };
  }, [selected, suggestions]);

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

  /*
   * "이 종목으로 계산" — 고른 종목 하나를 시뮬레이터로 보낸다(기획서 §3-2 연결②).
   *
   * 🔴 프리필은 **URL 이 아니라 `location.state`** 로 싣는다. "내 포트폴리오 → 시뮬레이터"가 이미 쓰는
   *    검증된 계약(`PortfolioPrefillRequest` 가 하이드레이션 뒤 한 번 읽고 지운다)을 그대로 재사용하므로
   *    시뮬레이터 쪽을 건드리지 않는다. 배당률·성장률은 싣지 않는다 — 시뮬레이터가 같은 유니버스에서
   *    읽으므로(비교 화면과 동일 출처) 숫자를 실으면 중복이자 조작 창구가 된다.
   * 🔴 계측은 **클릭**을 센다(도착이 아니라). 프리필이 state 로 가 URL 에 표식이 안 남아 도착측에서
   *    셀 수 없다 — compare_entry(도착)와 비대칭인 이유(analytics.ts 주석).
   * ⚠ 유니버스 밖 티커면 빌더가 `null` → 아무 데도 보내지 않는다(정상 경로에선 열이 이미 유니버스 안이다).
   */
  const handleSimulate = useCallback(
    (ticker: string) => {
      const state = buildSingleTickerPrefillState(ticker);
      if (state === null) return;
      track(ANALYTICS_EVENT.COMPARE_TO_SIMULATOR, { ticker });
      navigate(SIMULATOR_PATH, { state });
    },
    [navigate]
  );

  /*
   * 유입 화면 → 비교 **도착**을 한 번 센다(기획서 §3-2 의 "이동률" 지표).
   *
   * 🔴 `ref` 로 막는 이유: 이 화면에 온 뒤 칩을 눌러 조합을 바꾸면 `searchParams` 가 다시 바뀌는데,
   *    그때마다 쏘면 한 번의 도착이 여러 건으로 세어져 이동률이 부풀려진다. 도착은 한 방문에 한 번이다.
   * 🔴 열 수는 **고른 수가 아니라 실제로 열린 수**(`selected.length`)다 — 유니버스에서 빠진 티커는
   *    걸러지므로, 이 둘이 자주 어긋나면 보내는 쪽의 필터가 새고 있다는 신호가 된다.
   */
  const entryTracked = useRef(false);
  const entryPoint = searchParams.get(ENTRY_PARAM);

  useEffect(() => {
    if (entryTracked.current || !entryPoint) return;
    entryTracked.current = true;
    track(ANALYTICS_EVENT.COMPARE_ENTRY, { from: entryPoint, ticker_count: selected.length });
  }, [entryPoint, selected.length]);

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
        onSimulate={handleSimulate}
      />
    </TickerPageShell>
  );
}
