import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TickerPageShell } from '@/pages/Ticker/components';
import { useDocumentMeta } from '@/pages/Ticker/hooks';
import { createResultAmountFormatter } from '@/pages/Main/utils';
import { useDisplayCurrencyViewAtomValue, useFxRateSync, useFxRateValueAtomValue } from '@/jotai';
import { ANALYTICS_EVENT, bucketValue, track, trackEvent } from '@/shared/lib/analytics';
import {
  FOCUS_TARGET_MONTHLY_DIVIDEND_STATE,
  buildFocusTargetMonthlyDividendState,
  buildPortfolioSimulationPrefillState,
  isSimulationKnownTicker
} from '@/shared/constants';
import { computePortfolioSummary } from '@/shared/lib/portfolio';
import { formatUSD } from '@/shared/utils';
import { PORTFOLIO_COPY } from '../copy';
import { buildPortfolioGoalCardModel, resolvePortfolioGoalBasis, toProgressBucket } from '../components';
import { toPortfolioHoldings, toQuantityInputValue, useGoalScenario, usePortfolioHoldings } from '../hooks';
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
   * 환율 조회 드라이버. 시뮬레이터와 **같은 atom**을 채우지만 라우트가 배타적이라 동시에 마운트되지
   * 않는다. 이 페이지로 직접 들어온 사용자도 원화 환산을 보려면 여기서 받아와야 한다
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

  /**
   * 🔴 목표 도메인 전용 포맷터 — **입력이 원화**다(위 `formatAmount` 는 USD 입력).
   *
   * 목표 월배당·남은 금액·현재값(실측 환산분·시뮬 파생값)은 전부 원화 값이라, 여기에 `formatAmount` 를
   * 넘기면 조용히 환율배 틀린 숫자가 나오고 화면 어디에도 오류 표시가 없다. 두 포맷터가 한 화면에
   * 공존하는 유일한 지점이므로 배선을 바꿀 때 이 주석을 먼저 읽을 것.
   */
  const formatKrwAmount = useCallback((krw: number) => formatKrwBased(krw, false), [formatKrwBased]);

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

  /**
   * 달성률의 현재값 기준. **보유 → 환율 순서**로 판정하고, 실측이면 여기서 딱 한 번 원화로 환산한다.
   * `pending`(보유 하이드레이션 중·환율 조회 중)이면 아래 훅이 화면을 로딩으로 유지한다 —
   * 시뮬 숫자를 먼저 보여 줬다 실측으로 바꾸지 않는다.
   */
  const basis = useMemo(
    () =>
      resolvePortfolioGoalBasis({
        holdingsStatus: status,
        holdingsCount: items.length,
        includedCount: summary.counts.included,
        monthlyAfterTaxUsd: summary.monthlyDividendAfterTaxUsd,
        fxStatus: display.status,
        fxRateKrwPerUsd: fxRate
      }),
    [display.status, fxRate, items.length, status, summary]
  );

  /*
   * 예상 달성 시점의 근거 = 시뮬레이터에 **저장된** 활성 시나리오(전역 폼 atom 이 아니다 — 이 라우트로
   * 직행하면 Main 이 마운트되지 않아 atom 은 기본값이다). 읽기 전용이고 아무것도 쓰지 않는다.
   */
  const goal = useGoalScenario({
    now,
    measuredCurrentKrw: basis.kind === 'measured' ? basis.amountKrw : null,
    isMeasurePending: basis.kind === 'pending'
  });

  const goalModel = useMemo(
    () =>
      buildPortfolioGoalCardModel({
        goal,
        basis,
        holdingsStatus: status,
        holdingsCount: items.length,
        formatKrwAmount
      }),
    [basis, formatKrwAmount, goal, items.length, status]
  );

  const derivedLiveMessage = useMemo(
    () =>
      buildPortfolioLiveMessage({
        status,
        holdingsCount: items.length,
        hasIncludedRows: summary.counts.included > 0,
        monthlyText: formatAmount(summary.monthlyDividendAfterTaxUsd),
        fxFailed: display.status === 'error',
        goalProgressPercent: goalModel?.progressPercent ?? null
      }),
    [display.status, formatAmount, goalModel, items.length, status, summary]
  );

  /*
   * 계측 — 진입 1회 / 요약 노출 1회. 로딩 상태에서 쏘면 보유 0종으로 기록돼 지표가 왜곡되므로
   * 하이드레이션이 끝난 뒤에만 발화하고 ref 로 중복을 막는다(이 레포의 노출 계측 공통 패턴).
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

  /*
   * 목표 카드 노출 계측 — **카드가 실제로 값과 함께 떴을 때 1회만**. 로딩 골격에서 쏘면 has_target 이
   * 항상 false 로 기록돼 목표 설정률이 0 으로 왜곡되고, 카드가 아예 안 뜨는 상태(보유 0 + 목표 없음,
   * 시뮬 읽기 실패)에서는 발화하지 않는다. `holdings_count`·`value_bucket` 은 **다시 싣지 않는다** —
   * 같은 세션의 `portfolio_summary_view` 로 조인한다(중복 파라미터 회피).
   */
  const hasTrackedGoalRef = useRef(false);
  useEffect(() => {
    if (goalModel === null || goalModel.isLoading || hasTrackedGoalRef.current) return;
    hasTrackedGoalRef.current = true;

    track(ANALYTICS_EVENT.GOAL_WIDGET_VIEW, {
      has_target: goalModel.hasTarget,
      current_basis: goalModel.currentBasis,
      // 목표가 없으면 달성률·도달 여부는 "0"이 아니라 **해당 없음**이다 — 아예 보내지 않는다.
      ...(goalModel.hasTarget
        ? {
            /*
             * 버킷은 **지금 화면에 보이는 달성률**을 따른다 — 도달 판정으로 `reachedInRange`(미래 언젠가
             * 도달)를 섞으면 달성률 5%짜리도 'reached'로 기록돼 진행 분포가 무의미해진다.
             */
            progress_bucket: toProgressBucket(goalModel.progressPercent ?? 0, goalModel.isAlreadyReached),
            reached_in_range: goalModel.reachedInRange
          }
        : {})
    });
  }, [goalModel]);

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
      } else if (result.reason === 'loading') {
        // 저장소를 아직 못 읽어 훅이 거절했다 — 무음이면 "눌렀는데 아무 일도 안 났다"가 된다.
        setAnnouncement(copy.live.notReady);
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

  /*
   * 드로어 여닫기는 **안정된 참조**여야 한다. 인라인 화살표로 넘기면 렌더마다 새 함수가 되고,
   * 그걸 deps 로 쓰는 이펙트가 매 렌더 재실행돼 검색 중 포커스를 빼앗겼다(qa BUG-1).
   * 드로어도 자체적으로 ref 로 끊었지만, 호출부에서도 불필요한 리렌더 신호를 만들지 않는다.
   */
  const handleOpenPicker = useCallback(() => setIsPickerOpen(true), []);
  const handleClosePicker = useCallback(() => setIsPickerOpen(false), []);

  /** 목표 카드의 기준 안내에서 여는 경로 — 같은 드로어지만 어디서 눌렸는지는 따로 센다. */
  const handleAddHoldingFromGoal = useCallback(() => {
    trackEvent(ANALYTICS_EVENT.CTA_CLICK, { cta_name: 'goal_add_holding', placement: 'portfolio_page' });
    setIsPickerOpen(true);
  }, []);

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

  /**
   * 목표 카드의 D·E′ 액션 — **프리필 없이** 시뮬레이터로.
   *
   * 프리필(`buildPortfolioSimulationPrefillState`)은 활성 시나리오를 덮거나 새 탭을 만드는데,
   * 바로 위 타일이 보여 준 `예상 달성`이 **그 활성 시나리오**에서 나온 값이다 — 실어 보내면
   * 사용자가 방금 본 근거가 이동과 동시에 바뀐다. "지금 보유로 다시 시뮬레이션"은 요약 CTA①의 일이다.
   */
  const handleOpenSimulator = useCallback(() => {
    trackEvent(ANALYTICS_EVENT.CTA_CLICK, { cta_name: 'goal_open_simulator', placement: 'portfolio_page' });
    navigate('/');
  }, [navigate]);

  /** [목표 수정] — 시뮬레이터로 이동한 뒤 목표 입력에 포커스를 요청한다(값 없음). */
  const handleOpenTargetSetup = useCallback(() => {
    trackEvent(ANALYTICS_EVENT.CTA_CLICK, { cta_name: 'goal_set_target', placement: 'portfolio_page' });
    navigate('/', { state: FOCUS_TARGET_MONTHLY_DIVIDEND_STATE });
  }, [navigate]);

  /**
   * 칩·직접 입력으로 고른 목표를 **시뮬레이터에 실어 보낸다**(여기서 저장하지 않는다).
   *
   * 값은 라우터 state 로만 넘어가고, 실제 커밋(`setField`)은 하이드레이션이 끝난 뒤 시뮬레이터 안에서
   * 한 번 일어난다 — 그래야 자동저장·클라우드 동기화가 정상 경로로 따라온다. 값 검증은 보내는 쪽
   * (`buildFocusTargetMonthlyDividendState`)과 받는 쪽이 같은 함수를 쓴다.
   */
  const handleCommitTarget = useCallback(
    (won: number) => {
      trackEvent(ANALYTICS_EVENT.CTA_CLICK, { cta_name: 'goal_set_target', placement: 'portfolio_page' });
      navigate('/', { state: buildFocusTargetMonthlyDividendState(won) });
    },
    [navigate]
  );

  const handleOpenCalendar = useCallback(() => {
    trackEvent(ANALYTICS_EVENT.CTA_CLICK, { cta_name: 'portfolio_to_calendar', placement: 'portfolio_page' });
    navigate(buildPortfolioCalendarPath(calendarTickers));
  }, [calendarTickers, navigate]);

  return (
    <TickerPageShell>
      <PortfolioPageView
        viewModel={viewModel}
        goal={goalModel}
        liveMessage={announcement ?? derivedLiveMessage}
        picker={{ isOpen: isPickerOpen, keyword, options: pickerOptions, heldTickers }}
        taxInput={taxDraft ?? String(taxPercent)}
        onTaxInputChange={handleTaxInputChange}
        onTaxInputBlur={handleTaxInputBlur}
        onOpenPicker={handleOpenPicker}
        onClosePicker={handleClosePicker}
        onKeywordChange={handleKeywordChange}
        onAdd={handleAdd}
        onQuantityChange={handleQuantityChange}
        onQuantityBlur={handleQuantityBlur}
        onRemove={handleRemove}
        onUndo={handleUndo}
        onSimulate={handleSimulate}
        onOpenCalendar={handleOpenCalendar}
        onOpenTargetSetup={handleOpenTargetSetup}
        onCommitTarget={handleCommitTarget}
        onOpenSimulator={handleOpenSimulator}
        onAddHoldingFromGoal={handleAddHoldingFromGoal}
      />
    </TickerPageShell>
  );
}
