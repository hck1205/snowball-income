import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TickerPageShell } from '@/pages/Ticker/components';
import { useDocumentMeta } from '@/pages/Ticker/hooks';
import { createResultAmountFormatter } from '@/pages/Main/utils';
import { useDisplayCurrencyViewAtomValue, useFxRateSync, useFxRateValueAtomValue } from '@/jotai';
import { ANALYTICS_EVENT, bucketValue, track, trackEvent } from '@/shared/lib/analytics';
import { buildPortfolioSimulationPrefillState, isSimulationKnownTicker } from '@/shared/constants';
import { computePortfolioSummary } from '@/shared/lib/portfolio';
import { formatUSD } from '@/shared/utils';
import { PORTFOLIO_COPY } from '../copy';
import { toPortfolioHoldings, toQuantityInputValue, usePortfolioHoldings } from '../hooks';
import type { PortfolioAddInput, PortfolioAddResult } from '../hooks';
import { buildPortfolioCalendarPath, filterPortfolioUniverse, getPortfolioUniverse } from '../utils';
import PortfolioPageView from './PortfolioPage.view';
import type { PortfolioPageProps } from './PortfolioPage.types';
import {
  PORTFOLIO_VALUE_BUCKET_EDGES_USD,
  buildPortfolioLiveMessage,
  buildPortfolioViewModel
} from './PortfolioPage.utils';

const copy = PORTFOLIO_COPY;

/**
 * `/dividend/portfolio` 컨테이너 — 저장소 훅 + 계산 엔진 + 표시 통화를 조립해 순수 뷰에 넘긴다.
 *
 * ## 시뮬레이터 상태를 건드리지 않는다
 * 이 화면은 자기 저장소(`snowball-portfolio`)만 만진다. 시뮬레이터로 값을 넘길 때도 전역 atom·영속
 * payload·클라우드에 직접 쓰지 않고 **프리필 계약**(`location.state`)만 쓴다 — Main 밖 쓰기는
 * 자동저장·동기화가 안 돌아 조용히 유실되거나 다음 세션 충돌 판정을 바꾼다(pitfalls 2026-07-27 🔴).
 *
 * ## 통화 계약(가장 틀리기 쉬운 지점)
 * 계산 엔진은 **USD**로 계산하고 공용 `createResultAmountFormatter`는 **원화 입력**을 전제한다.
 * 두 계약을 잇는 규칙은 하나뿐이다 — 환율이 없으면 달러 원값으로 떨어지고, 있으면 표시 직전에
 * **한 번만** 곱한다. 이 가드를 빼면 달러 숫자에 `₩`가 붙는다.
 */
export default function PortfolioPage({ now: nowProp }: PortfolioPageProps = {}) {
  const navigate = useNavigate();

  /*
   * 환율 조회 드라이버. 시뮬레이터·목표 페이지와 **같은 atom**을 채우지만 라우트가 배타적이라
   * 동시에 마운트되지 않는다. 이 페이지로 직접 들어온 사용자도 원화 환산을 보려면 여기서 받아와야 한다
   * (없으면 금액이 영영 달러로 남고 시뮬레이션 CTA 도 계속 비활성이다).
   */
  useFxRateSync();
  const display = useDisplayCurrencyViewAtomValue();
  const fxRate = useFxRateValueAtomValue();

  const holdings = usePortfolioHoldings();
  const { actions, items, status, taxPercent, writeError, pendingUndo } = holdings;

  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [keyword, setKeyword] = useState('');
  /** 사건성 라이브 문구(추가·삭제·실행 취소·중복). 없으면 파생 문구를 읽는다. */
  const [announcement, setAnnouncement] = useState<string | null>(null);
  /** 세율 입력의 중간 상태. 지우는 동안(빈 문자열) 값이 기본값으로 튀지 않게 문자열로 쥔다. */
  const [taxDraft, setTaxDraft] = useState<string | null>(null);

  /** '오늘'은 컨테이너가 한 번 고정해 아래로 내린다(순수 계층은 시계를 읽지 않는다 · 테스트 결정성). */
  const now = useMemo(() => nowProp ?? new Date(), [nowProp]);

  useDocumentMeta({
    title: copy.meta.title,
    description: copy.meta.description,
    pathname: copy.meta.pathname
  });

  const summary = useMemo(
    () => computePortfolioSummary(toPortfolioHoldings(items), { today: now, taxRatePercent: taxPercent }),
    [items, now, taxPercent]
  );

  const formatKrwBased = useMemo(
    () => createResultAmountFormatter(display.currency, display.rate),
    [display.currency, display.rate]
  );

  /**
   * USD 한 값 → 화면 문자열.
   *
   * ⚠ `display.rate === null` 인데 `formatKrwBased` 를 부르면 **달러 숫자에 `₩` 가 붙는다**
   * (환율이 없으면 실효 통화가 원화로 떨어지기 때문). 이 가드가 유일한 방어선이다.
   * `compact=false` 고정 — 월 배당은 만~백만원대라 축약하면 차이가 안 보인다.
   */
  const displayRate = display.rate;
  const formatAmount = useCallback(
    (usd: number) => (displayRate === null ? formatUSD(usd) : formatKrwBased(usd * displayRate, false)),
    [displayRate, formatKrwBased]
  );

  /** 시뮬레이터로 실어 보낼 프리필. `null` 이면 CTA 를 누를 수 없다(환율 없음·유니버스 종목 0 등). */
  const prefillState = useMemo(
    () => buildPortfolioSimulationPrefillState({ summary, fxRateKrwPerUsd: fxRate }),
    [fxRate, summary]
  );

  /** 합계에는 들었지만 시뮬레이터가 모르는 종목 — 비중에서 조용히 빠지지 않게 화면이 먼저 말한다. */
  const simulationExcludedCount = useMemo(
    () => summary.holdings.filter((row) => row.includedInTotals && !isSimulationKnownTicker(row.ticker)).length,
    [summary]
  );

  /** 캘린더가 아는 종목만 딥링크에 싣는다(모르는 심볼을 받으면 캘린더가 경고를 띄운다). */
  const calendarTickers = useMemo(
    () => items.map((item) => item.ticker).filter((ticker) => isSimulationKnownTicker(ticker)),
    [items]
  );

  const pickerOptions = useMemo(() => filterPortfolioUniverse(getPortfolioUniverse(), keyword), [keyword]);
  const heldTickers = useMemo(() => items.map((item) => item.ticker), [items]);

  const viewModel = useMemo(
    () =>
      buildPortfolioViewModel({
        status,
        items,
        summary,
        fx: { status: display.status, rate: display.rate, asOf: display.asOf },
        writeError,
        formatAmount,
        canSimulate: prefillState !== null,
        simulationExcludedCount,
        calendarTickerCount: calendarTickers.length,
        calendarExcludedCount: items.length - calendarTickers.length,
        pendingUndo
      }),
    [
      calendarTickers.length,
      display.asOf,
      display.rate,
      display.status,
      formatAmount,
      items,
      pendingUndo,
      prefillState,
      simulationExcludedCount,
      status,
      summary,
      writeError
    ]
  );

  const derivedLiveMessage = useMemo(
    () =>
      buildPortfolioLiveMessage({
        status,
        holdingsCount: items.length,
        hasIncludedRows: summary.counts.included > 0,
        monthlyText: formatAmount(summary.monthlyDividendAfterTaxUsd),
        fxFailed: display.status === 'error'
      }),
    [display.status, formatAmount, items.length, status, summary]
  );

  /*
   * 계측 — 진입 1회 / 요약 노출 1회. 로딩 상태에서 쏘면 보유 0종으로 기록돼 지표가 왜곡되므로
   * 하이드레이션이 끝난 뒤에만 발화하고 ref 로 중복을 막는다(목표 페이지와 같은 패턴).
   */
  const hasTrackedViewRef = useRef(false);
  useEffect(() => {
    if (status === 'loading' || hasTrackedViewRef.current) return;
    hasTrackedViewRef.current = true;

    track(ANALYTICS_EVENT.PORTFOLIO_VIEW, { holdings_count: items.length, has_holdings: items.length > 0 });
  }, [items.length, status]);

  const hasTrackedSummaryRef = useRef(false);
  useEffect(() => {
    if (status === 'loading' || hasTrackedSummaryRef.current || items.length === 0) return;
    hasTrackedSummaryRef.current = true;

    track(ANALYTICS_EVENT.PORTFOLIO_SUMMARY_VIEW, {
      holdings_count: items.length,
      covered_count: summary.counts.included,
      // 금액 원값은 싣지 않는다 — 환율과 무관하게 비교되도록 **달러 기준** 버킷만 보낸다.
      value_bucket: bucketValue(summary.totalValueUsd, PORTFOLIO_VALUE_BUCKET_EDGES_USD)
    });
  }, [items.length, status, summary]);

  /**
   * 수량 편집 계측용 직전 값. 타이핑마다 쏘면 GA 가 스팸되므로 **blur 시점에 값이 바뀐 경우만** 센다.
   * 저장 실패 계측(`OPERATION_ERROR`)은 훅이 이미 발화하므로 여기서 중복 발화하지 않는다.
   */
  const trackedQuantityRef = useRef(new Map<string, number | null>());
  useEffect(() => {
    const tracked = trackedQuantityRef.current;
    const present = new Set<string>();

    for (const item of items) {
      present.add(item.ticker);
      if (!tracked.has(item.ticker)) tracked.set(item.ticker, item.quantity);
    }
    for (const ticker of [...tracked.keys()]) {
      if (!present.has(ticker)) tracked.delete(ticker);
    }
  }, [items]);

  const handleAdd = useCallback(
    (input: string | PortfolioAddInput): PortfolioAddResult => {
      const result = actions.add(input);

      if (result.ok) {
        setAnnouncement(copy.live.added(result.ticker));
        track(ANALYTICS_EVENT.PORTFOLIO_HOLDING_SAVED, {
          action: 'add',
          covered: isSimulationKnownTicker(result.ticker)
        });
      } else if (result.reason === 'duplicate') {
        setAnnouncement(copy.live.alreadyHeld(result.ticker));
      }

      return result;
    },
    [actions]
  );

  const handleQuantityChange = useCallback(
    (ticker: string, raw: string) => actions.updateQuantity(ticker, raw),
    [actions]
  );

  /** blur 정규화 — 표시값을 **엔진이 정한 수량**(소수 4자리 반올림·미입력은 빈 값)으로 맞춘다. */
  const handleQuantityBlur = useCallback(
    (ticker: string) => {
      const row = items.find((item) => item.ticker === ticker);
      if (!row) return;

      actions.updateQuantity(ticker, toQuantityInputValue(row.quantity));

      const tracked = trackedQuantityRef.current;
      if (tracked.get(ticker) !== row.quantity) {
        tracked.set(ticker, row.quantity);
        track(ANALYTICS_EVENT.PORTFOLIO_HOLDING_SAVED, {
          action: 'edit',
          covered: isSimulationKnownTicker(ticker)
        });
      }
    },
    [actions, items]
  );

  const handleRemove = useCallback(
    (ticker: string) => {
      actions.remove(ticker);
      setAnnouncement(copy.live.removed(ticker));
      track(ANALYTICS_EVENT.PORTFOLIO_HOLDING_DELETED, { covered: isSimulationKnownTicker(ticker) });
    },
    [actions]
  );

  const handleUndo = useCallback(() => {
    const restored = actions.undo();
    if (restored !== null) setAnnouncement(copy.live.restored(restored));

    return restored;
  }, [actions]);

  const handleKeywordChange = useCallback((next: string) => {
    setKeyword(next);
    // 검색 결과가 사라진 사실은 시각적으로만 알리면 안 된다(수동 추가로 안내하는 문구가 목록 자리에 있다).
    if (filterPortfolioUniverse(getPortfolioUniverse(), next).length === 0) {
      setAnnouncement(copy.live.noResult);
    }
  }, []);

  const handleTaxInputChange = useCallback(
    (raw: string) => {
      setTaxDraft(raw);

      const parsed = Number(raw.replace(/,/g, ''));
      // 빈 문자열·중간 상태에서는 커밋하지 않는다 — `Number('')` 는 0 이라 세율이 0% 로 튄다.
      if (raw.trim().length === 0 || !Number.isFinite(parsed)) return;
      actions.setTaxPercent(parsed);
    },
    [actions]
  );

  /** 포커스를 잃으면 정규화된 값(0..100 clamp)을 다시 보여 준다. */
  const handleTaxInputBlur = useCallback(() => setTaxDraft(null), []);

  const handleSimulate = useCallback(() => {
    if (prefillState === null) return;

    trackEvent(ANALYTICS_EVENT.CTA_CLICK, { cta_name: 'portfolio_to_simulator', placement: 'portfolio_page' });
    navigate('/', { state: prefillState });
  }, [navigate, prefillState]);

  const handleOpenGoal = useCallback(() => {
    trackEvent(ANALYTICS_EVENT.CTA_CLICK, { cta_name: 'portfolio_to_goal', placement: 'portfolio_page' });
    navigate('/dividend/goal');
  }, [navigate]);

  const handleOpenCalendar = useCallback(() => {
    trackEvent(ANALYTICS_EVENT.CTA_CLICK, { cta_name: 'portfolio_to_calendar', placement: 'portfolio_page' });
    navigate(buildPortfolioCalendarPath(calendarTickers));
  }, [calendarTickers, navigate]);

  return (
    <TickerPageShell>
      <PortfolioPageView
        viewModel={viewModel}
        liveMessage={announcement ?? derivedLiveMessage}
        picker={{ isOpen: isPickerOpen, keyword, options: pickerOptions, heldTickers }}
        taxInput={taxDraft ?? String(taxPercent)}
        onTaxInputChange={handleTaxInputChange}
        onTaxInputBlur={handleTaxInputBlur}
        onOpenPicker={() => setIsPickerOpen(true)}
        onClosePicker={() => setIsPickerOpen(false)}
        onKeywordChange={handleKeywordChange}
        onAdd={handleAdd}
        onQuantityChange={handleQuantityChange}
        onQuantityBlur={handleQuantityBlur}
        onRemove={handleRemove}
        onUndo={handleUndo}
        onSimulate={handleSimulate}
        onOpenGoal={handleOpenGoal}
        onOpenCalendar={handleOpenCalendar}
      />
    </TickerPageShell>
  );
}
