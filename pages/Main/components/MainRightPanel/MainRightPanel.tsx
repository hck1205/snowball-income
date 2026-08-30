import { memo, useCallback, useMemo, useState } from 'react';
import type { ChangeEvent } from 'react';
import { ANALYTICS_EVENT, trackEvent } from '@/shared/lib/analytics';
import { useInRouterContext } from 'react-router-dom';
import { getTickerDisplayName } from '@/shared/utils';
import { createPortal } from 'react-dom';
import { ResponsiveEChart } from '@/components/common';
import { useOptionalCommunityAuth } from '@/components/community/CommunityAuthProvider';
import { DISPLAY_CURRENCY_COPY, resolveDefaultDividendTaxRatePercent, SIMULATOR_COPY } from '@/shared/constants';
import { buildPostInvestmentChartTitle, focusTargetMonthlyDividendInput } from './MainRightPanel.utils';
import {
  FinancialIncomeNotice,
  LoginNudgeModal,
  PortfolioPresetBoard,
  PostInvestmentProjectionPanel,
  PresetApplyModal,
  PortfolioPrefillRequest,
  ScenarioPrefillNotice,
  ShareLinkFailureNotice,
  ScenarioTabs,
  ScenarioTabTooltip,
  TabDeleteModal,
  TargetFocusRequest
} from './components';
import MonthlyCashflow from '@/components/MonthlyCashflow';
import PortfolioComposition from '@/components/PortfolioComposition';
import ResultSummaryCard from '@/components/ResultSummaryCard';
import { ToggleField } from '@/components/common';
import SaleTaxCard from '@/components/SaleTaxCard';
import YearlyResult from '@/components/YearlyResult';
import {
  useAdjustableTickerCountAtomValue,
  useAllocationPercentByTickerIdAtomValue,
  useDisplayCurrencyViewAtomValue,
  useFixedByTickerIdAtomValue,
  useIncludedProfilesAtomValue,
  useIsConfigDrawerOpenAtomValue,
  useIsResultCompactAtomValue,
  useIsYearlyAreaFillOnAtomValue,
  useNormalizedAllocationAtomValue,
  useSetIsConfigDrawerOpenWrite,
  useSetIsResultCompactWrite,
  useSetIsYearlyAreaFillOnWrite,
  useSetIncludedTickerIdsWrite,
  useSetSelectedTickerIdWrite,
  useSetShowPortfolioDividendCenterWrite,
  useShowQuickEstimateAtomValue,
  useShowSplitGraphsAtomValue,
  useSetTickerProfilesWrite,
  useSetFixedByTickerIdWrite,
  useSetActiveHelpWrite,
  useSetWeightByTickerIdWrite,
  useSetYieldFormWrite,
  useScenarioPrefillAtomValue,
  useTickerProfilesAtomValue,
  useVisibleYearlySeriesAtomValue
} from '@/jotai';
import { useMainComputed, useSnowballForm, useTickerActions } from '@/pages/Main/hooks';
// 형제 폴더 직접 참조 — 상위 배럴(@/pages/Main/components)은 이 파일 자신도 재수출해 import 순환이 된다.
import { ChartPanel } from '../ChartPanel';
import FxSensitivityNote from '../FxSensitivityNote';
import { GoalBanner, useActiveGoalOutcome } from '../GoalBanner';
import MainResultGrid from '../MainResultGrid';
import ResultBoard from '../ResultBoard';
import ScenarioTabsRow from '../ScenarioTabsRow';
import SettingsEntryButton from '../SettingsEntryButton';
import { buildAllocationHoldings, createResultAmountFormatter, formatPercent, targetYearLabel } from '@/pages/Main/utils';
import {
  useConditionStripItems,
  usePresetPrefill,
  usePortfolioPrefillCommit,
  usePortfolioPresetApply,
  usePresetQueryApply,
  useResultChartAdapters,
  useResultViewAnalytics,
  useGoalPlanApply,
  useScenarioTabPanel,
  useTargetFieldControls
} from './hooks';
import type { MainRightPanelProps } from './MainRightPanel.types';

function MainRightPanelComponent({ configDrawerId }: MainRightPanelProps) {
  const modalRoot = typeof document !== 'undefined' ? document.body : null;
  /*
   * 라우터 컨텍스트 유무. 값이 컴포넌트 수명 동안 바뀌지 않는 컨텍스트라 추가 리렌더를 만들지 않는다
   * (memo 특성 불변). 라우터 훅을 쓰는 자식을 게이트하는 데만 쓴다.
   */
  const inRouter = useInRouterContext();
  const [postInvestmentProjectionYears, setPostInvestmentProjectionYears] = useState(10);
  const [isPostInvestmentAssetView, setIsPostInvestmentAssetView] = useState(false);
  // Provider 없이(커뮤니티 비활성/격리 렌더) 안전한 optional 접근 — 게이트는 커뮤니티 활성일 때만 발동한다.
  const communityAuth = useOptionalCommunityAuth();
  const showQuickEstimate = useShowQuickEstimateAtomValue();
  const isResultCompact = useIsResultCompactAtomValue();
  const setIsResultCompact = useSetIsResultCompactWrite();
  /* 결과 밀도 토글의 계측 — 토글이 탭 줄에서 요약 카드로 옮겨오면서 함께 온 배선이다. */
  const handleToggleCompact = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      trackEvent(ANALYTICS_EVENT.TOGGLE_CHANGED, {
        field_name: 'isResultCompact',
        value: event.target.checked
      });
      setIsResultCompact(event.target.checked);
    },
    [setIsResultCompact]
  );
  const includedProfiles = useIncludedProfilesAtomValue();
  /* 환율 민감도 안내용 — 국내 상장(.KS/.KQ)만 담겼으면 안내를 내지 않는다(FxSensitivityNote). */
  const includedTickers = useMemo(() => includedProfiles.map((profile) => profile.ticker), [includedProfiles]);
  /* 프리필이 활성 탭을 덮어도 되는지 판정할 때만 쓴다 — **제외된 티커도 지우면 안 되는 데이터**라
     includedProfiles가 아니라 전체 프로필을 본다. */
  const tickerProfiles = useTickerProfilesAtomValue();
  const normalizedAllocation = useNormalizedAllocationAtomValue();
  const allocationPercentByTickerId = useAllocationPercentByTickerIdAtomValue();
  const adjustableTickerCount = useAdjustableTickerCountAtomValue();
  const fixedByTickerId = useFixedByTickerIdAtomValue();
  const setShowPortfolioDividendCenter = useSetShowPortfolioDividendCenterWrite();
  const setTickerProfiles = useSetTickerProfilesWrite();
  const setIncludedTickerIds = useSetIncludedTickerIdsWrite();
  const setSelectedTickerId = useSetSelectedTickerIdWrite();
  const setWeightByTickerId = useSetWeightByTickerIdWrite();
  const setFixedByTickerId = useSetFixedByTickerIdWrite();
  const setActiveHelp = useSetActiveHelpWrite();
  const setYieldFormValues = useSetYieldFormWrite();
  const showSplitGraphs = useShowSplitGraphsAtomValue();
  const isYearlyAreaFillOn = useIsYearlyAreaFillOnAtomValue();
  const setIsYearlyAreaFillOn = useSetIsYearlyAreaFillOnWrite();
  const visibleYearlySeries = useVisibleYearlySeriesAtomValue();
  /* 드로어 열림 여부는 "조건 수정" 버튼의 `aria-expanded`/눌린 상태에만 쓴다 — 열닫기에만 바뀌는
     불리언이라 폼 타건으로는 이 구독이 리렌더를 늘리지 않는다. */
  const isConfigDrawerOpen = useIsConfigDrawerOpenAtomValue();
  const setIsConfigDrawerOpen = useSetIsConfigDrawerOpenWrite();
  const { values, validation, setField } = useSnowballForm();
  /*
   * 결과 **표시** 통화. 계산은 언제나 원화이고, 여기서 만든 포맷터가 표시 직전에 한 번만 환산한다.
   * `display.currency` 는 환율이 없으면 원화로 떨어지는 **적용** 통화라, 이 경로로는 `$NaN` 이 나올 수 없다.
   */
  const display = useDisplayCurrencyViewAtomValue();
  const formatResultAmount = useMemo(
    () => createResultAmountFormatter(display.currency, display.rate),
    [display.currency, display.rate]
  );
  const chartLabelSuffix = display.currency === 'USD' ? DISPLAY_CURRENCY_COPY.chartSuffixUsd : '';
  const {
    simulation,
    tableRows,
    allocationPieOption,
    recentCashflowBarOption,
    yearlyCashflowByTicker,
    postInvestmentDividendProjectionRows,
    yearlyResultBarOption,
    yearlySeriesItems,
    requiredMonthlyContribution,
    formatChartValue,
    formatChartCompact
  } = useMainComputed({
    isValid: validation.isValid,
    values,
    visibleYearlySeries,
    isYearlyAreaFillOn,
    postInvestmentProjectionYears,
    displayCurrency: display.currency,
    fxRate: display.rate
  });
  /* 첫 화면에서 고른 목표를 지금 결과로 판정하고 계측까지 한다. 목표 없이 들어왔으면 `null` 이고
     이 자리에는 아무것도 그려지지 않는다(훅 머리말). */
  const goalOutcome = useActiveGoalOutcome(tableRows);

  const { setTickerShares, setTickerWeight, toggleTickerFixed, clearAllFixed, removeIncludedTicker } = useTickerActions();
  /*
   * 비중 배분을 "몇 주 · 얼마 · 월 얼마"로 되읽은 것. 저장되는 값은 여전히 (초기 투자금, 비중) 한 쌍이고
   * 이건 그 쌍의 다른 표현이라, 두 입력(슬라이더·수량)이 같은 상태를 가리킨다.
   */
  /*
   * 🔴 보유 줄의 금액은 **간략 표기(`약 2.2억`)를 쓰지 않는다** (2026-08-23 사용자 신고).
   *
   * 처음엔 파이·차트가 쓰는 `formatChartCompact`(= `formatApproxKRW`)를 그대로 물렸는데, 그 포맷터는
   * **억 구간에서 0.1억(=1,000만원) 단위로 반올림**한다. 차트 라벨에서는 맞는 선택이지만 입력 옆에서는
   * 아니다 — 그 자리 숫자는 **내 입력이 반영됐다는 증거**라서, SCHD 주수를 100주 고쳐도 `약 2.2억`
   * 그대로면 사용자에게는 "안 먹는다"로 보인다(월 배당도 만 단위 반올림이라 약 50주까지 안 움직였다).
   * 그래서 여기만 정밀 포맷터를 쓴다. 표시 통화(원/달러) 전환은 그대로 따라간다.
   */
  const formatHoldingAmount = useCallback((value: number) => formatResultAmount(value, false), [formatResultAmount]);
  const allocationHoldings = useMemo(
    () =>
      buildAllocationHoldings({
        normalizedAllocation,
        initialInvestment: values.initialInvestment,
        taxRate: values.taxRate,
        fxRate: display.rate
      }),
    [display.rate, normalizedAllocation, values.initialInvestment, values.taxRate]
  );
  /*
   * 시나리오 탭 한 벌. 🔴 예전에는 여기서 두 훅의 **이름 45개를 통째로 풀어** 들고, 그중 22개를
   * `<ScenarioTabs>` 에 한 줄씩 넘겼다(2026-08-30 리팩터). 이 파일이 하는 일은 결과 화면 조립인데
   * 탭 스트립의 드래그 상태·이름 편집 폭 같은 **부품 내부 사정**이 스코프의 절반을 차지했다.
   * 동작은 그대로다 — 훅도 두 개 그대로이고, 조립만 `useScenarioTabPanel` 로 옮겼다.
   */
  const {
    tabsProps,
    overlays: {
      deleteTargetTabId,
      closeDeleteModal,
      confirmDeleteTab,
      isLoginNudgeOpen,
      closeLoginNudge,
      handleLoginFromNudge,
      hoverTooltip
    },
    tabApi
  } = useScenarioTabPanel({ setActiveHelp, communityAuth });

  const applyPortfolioPrefill = usePortfolioPrefillCommit({
    tabCreationGate: tabApi.tabCreationGate,
    createScenarioTab: tabApi.createScenarioTab,
    tickerProfileCount: tickerProfiles.length,
    initialInvestment: values.initialInvestment,
    setTickerProfiles,
    setIncludedTickerIds,
    setWeightByTickerId,
    setFixedByTickerId,
    setSelectedTickerId,
    setField,
    openLoginNudge: tabApi.openLoginNudge
  });
  const hasGraphData = includedProfiles.length > 0;
  const emptyGraphMessage = SIMULATOR_COPY.emptyPortfolioHint;
  /* 지급 일정 스트립(실지급 월별 배당 카드)용 — 이름 규칙은 차트 시리즈와 동일하게 맞춘다. */
  const scheduleTickers = useMemo(
    () =>
      includedProfiles.map((profile) => ({
        ticker: profile.ticker,
        displayName: getTickerDisplayName(profile.ticker, profile.name)
      })),
    [includedProfiles]
  );
  /*
   * 시계열 차트 3종의 게터 + "월 평균 배당" 차트의 목표선/도달 마커. target≤0(미설정)이면 둘 다
   * undefined → charts.ts가 markLine/markPoint/y축 max 가드를 모두 생략한다.
   */
  const targetMonthlyDividend = values.targetMonthlyDividend;
  const targetReachedYear = simulation?.summary.targetMonthDividendReachedYear;
  const {
    getYear,
    getMonthlyDividend,
    getAssetValue,
    getCumulativeDividend,
    hasTarget,
    monthlyDividendReferenceLine,
    monthlyDividendReachMarker
  } = useResultChartAdapters({ targetMonthlyDividend, targetReachedYear, formatChartCompact });

  /*
   * 설정 드로어 열기 + 목표 월배당 필드 커밋·포커스 이동. 셋 다 "목표 입력 조작"이라는 하나의
   * 관심사라 훅으로 묶었다(`useTargetFieldControls`) — 커밋은 기존 `setField` 경로를 그대로 타므로
   * 자동저장·계측이 그대로 따라온다.
   */
  const { commitTargetMonthlyDividend, focusTargetMonthlyDividendField, openConfigDrawer } = useTargetFieldControls({
    setField,
    setIsConfigDrawerOpen,
    focusTargetMonthlyDividendInput
  });

  /**
   * "이 결과의 계산 조건" 항목. 조립은 순수 함수(`buildConditionStripItems`)가 하고, 여기서는
   * 폼 값을 그 계약에 맞게 넘기는 훅(`useConditionStripItems`)만 부른다. 금액은 결과 숫자와
   * **같은 표시 통화 포맷터**를 compact로 재사용한다 — 스트립 전용 포맷터를 새로 만들면 달러
   * 모드에서 이 줄만 원화로 남는다.
   */
  const conditionItems = useConditionStripItems({
    durationYears: values.durationYears,
    monthlyContribution: values.monthlyContribution,
    initialInvestment: values.initialInvestment,
    // 세율은 선택 입력이라 비어 있을 수 있다(`h:null` 공유 링크 등). 그때 엔진은 종목 기준 기본값으로
    // 계산하므로, 화면도 같은 값을 보여야 "조건"과 결과가 갈리지 않는다(shared/constants/tax).
    taxRatePercent: values.taxRate ?? resolveDefaultDividendTaxRatePercent(values.ticker),
    reinvestDividends: values.reinvestDividends,
    reinvestDividendPercent: values.reinvestDividendPercent,
    targetMonthlyDividend: values.targetMonthlyDividend,
    includedTickerCount: includedProfiles.length,
    showQuickEstimate,
    formatResultAmount
  });

  /**
   * 연도별 시계열 라인 차트 3종(월평균·자산·누적)이 공유하는 props. 제목과 y값만 달라진다.
   *
   * 🔴 **`useMemo` 가 없으면 `ChartPanel` 의 `memo` 가 무의미하다.** 매 렌더 새 객체 리터럴이면
   *    spread 로 내려간 prop 들의 참조가 전부 달라져 세 패널이 항상 다시 그려진다.
   *    `useResultChartAdapters` 가 게터를 `useCallback([])` 으로 고정해 둔 이유(그 파일 머리말:
   *    "ChartPanel 이 걸러내도록")가 이 한 줄에서 깨지고 있었다 — 준비는 돼 있는데 문이 열려 있었다.
   * ⚠ 시뮬레이션이 바뀌면(`tableRows`) 어차피 다시 그린다. 이 memo 가 막는 것은 **결과와 무관한
   *   리렌더**다(드로어 열닫기, 탭 상호작용, 수량 입력창 타이핑 같은 것들).
   */
  const seriesChartProps = useMemo(
    () => ({
      rows: tableRows,
      hasData: hasGraphData,
      emptyMessage: emptyGraphMessage,
      getXValue: getYear,
      yAxisLabelFormatter: formatChartValue,
      chartLabelSuffix
    }),
    [chartLabelSuffix, emptyGraphMessage, formatChartValue, getYear, hasGraphData, tableRows]
  );

  /* 양도세 카드는 정밀 결과의 '상세' 모드에서만 (간략 모드는 핵심 숫자만 남긴다). */
  const showSaleTaxCard = !showQuickEstimate && !isResultCompact;
  /* 목표를 정했으면 분할 토글과 무관하게 월 평균 배당 차트를 띄운다 — 목표선·도달 마커가
     숨은 토글 뒤에 갇히면 목표 시각화가 사실상 없는 것과 같다. */
  const showMonthlyAverageChart = showSplitGraphs || hasTarget;
  const postInvestmentChartTitle = buildPostInvestmentChartTitle(
    postInvestmentDividendProjectionRows,
    isPostInvestmentAssetView
  );

  const { pendingPreset, appliedPresetId, requestApply, cancelApply, confirmApply, applyPresetSilently } =
    usePortfolioPresetApply({
    activeScenarioId: tabApi.activeScenarioId,
    renameScenarioTab: tabApi.renameScenarioTab,
    setTickerProfiles,
    setIncludedTickerIds,
    setSelectedTickerId,
    setWeightByTickerId,
    setFixedByTickerId,
    setShowPortfolioDividendCenter,
    setYieldFormValues
  });

  /*
   * 주소로 지목된 프리셋(`/simulator?preset=<id>`) 중 **덮어쓰기가 되는 경우**만 여기서 받는다.
   * 🔴 빈 워크스페이스는 영속 계층의 프리필이 맡는다 — 둘 다 돌면 조용히 적용된 화면 위에 확인
   *   모달까지 뜬다(2026-08-23). 그래서 `hasTickerProfiles` 를 넘겨 역할을 가른다.
   */
  usePresetQueryApply({ requestApply, hasTickerProfiles: includedProfiles.length > 0 });

  /*
   * 프리필 적용. **저장소가 비어 있고 성향 테스트가 구성을 지목했을 때만** 영속 계층이 id 를 발행하고(그 순간부터 저장 정지),
   * 여기서 프리셋 카드와 같은 경로로 적용한다. 계측만 쏘지 않는다(프리셋 인기 순위 오염 방지).
   */
  usePresetPrefill({ hasTickerProfiles: tickerProfiles.length > 0, applyPreset: applyPresetSilently });

  /*
   * 🔴 첫 화면에서 고른 목표(`?goal=`)를 **완성된 계획**으로 연다 — 구성을 담고, 목표를 채우고,
   * 그 목표에 닿는 월 적립금을 역산한다(2026-08-31 사용자 지적: "클릭하면 바로 5억 만들기의
   * 포폴이 완성되어있어야 하지 않을까").
   * ⚠ `applyPresetSilently` 를 쓰므로 **프리셋 적용기 뒤**에 와야 한다.
   * ⚠ 이 패널은 하이드레이션 후에만 마운트된다 — 그래서 저장된 워크스페이스가 이 계획을 덮지
   *   못한다(2026-08-30 결함의 재발 방지). 훅을 위로 올리지 마라.
   */
  useGoalPlanApply({
    values,
    setField,
    tabCreationGate: tabApi.tabCreationGate,
    createScenarioTab: tabApi.createScenarioTab,
    renameScenarioTab: tabApi.renameScenarioTab,
    activeScenarioId: tabApi.activeScenarioId,
    applyPresetSilently,
    openLoginNudge: tabApi.openLoginNudge,
    hasStoredPortfolio: tickerProfiles.length > 0
  });
  /* 프리필이 살아 있는 동안에만 결과 아래에 프리셋 고르개를 붙이고, 배너·"지금 적용됨" 표식을 켠다. */
  const scenarioPrefill = useScenarioPrefillAtomValue();
  const appliedPrefillPresetId = scenarioPrefill?.status === 'applied' ? scenarioPrefill.presetId : null;
  /**
   * 결과 아래 프리셋 보드가 가리킬 구성. **프리필이든 사용자가 직접 고른 것이든** 여기로 모인다.
   *
   * 🔴 종전에는 프리필만 봤다. 첫 방문 자동 프리필이 사라진 뒤(2026-08-23) 그대로 두면 **택일
   *   화면에서 고른 사용자에게 보드가 안 뜬다** — 방금 고른 사람이 다른 구성으로 바꿀 길을 잃는다.
   */
  const boardPresetId = appliedPrefillPresetId ?? appliedPresetId;

  useResultViewAnalytics({
    simulation,
    includedTickerCount: includedProfiles.length,
    durationYears: values.durationYears,
    showQuickEstimate,
    showSplitGraphs,
    isYearlyAreaFillOn,
    postInvestmentRowCount: postInvestmentDividendProjectionRows.length
  });

  return (
    <>
      {/*
        내 포트폴리오(`/dividend/portfolio`) **목표 달성 카드**에서 넘어온 요청의 수신 배선
        (location.state 1회 소비 → 값 커밋 → 포커스 → 소거). 보내는 쪽은 PortfolioPage.tsx 의 navigate 다.
        값 커밋이 `commitTargetMonthlyDividend`(=폼의 **기존 setField 경로**)를 타므로
        자동저장·클라우드 동기화·계측이 전부 기존 경로 그대로다. 이 패널은 하이드레이션 완료 후에만
        마운트되므로 커밋이 저장값에 덮이지 않는다(TargetFocusRequest 주석 참고).
        라우터 없이 격리 렌더되는 테스트가 있어 컨텍스트가 있을 때만 마운트한다 — 이 컴포넌트는
        아무것도 그리지 않으므로 미렌더여도 화면은 동일하다.
      */}
      {inRouter ? (
        <>
          <TargetFocusRequest
            onApplyTarget={commitTargetMonthlyDividend}
            onFocusTarget={focusTargetMonthlyDividendField}
          />
          {/*
            "내 포트폴리오" → 시뮬레이터 프리필의 수신 배선. 위 목표 요청과 **같은 자리**여야 한다
            (하이드레이션 완료 후 마운트). 커밋은 시나리오 탭 API + 기존 setter + setField만 쓰므로
            저장 payload·공유 URL·클라우드 스키마는 아무것도 바뀌지 않는다.
          */}
          <PortfolioPrefillRequest onApplyPrefill={applyPortfolioPrefill} />
        </>
      ) : null}

      {/* 🔴 결과 보드 **바로 위**다. "네가 고른 목표 → 그 답" 이 한 흐름으로 읽혀야 하고,
          목표가 없으면 이 자리에 아무것도 생기지 않는다(부품 머리말). */}
      {goalOutcome === null ? null : <GoalBanner outcome={goalOutcome} />}

      {/*
        🔴 결과 영역은 **보드 하나**다(2026-08-03 2차 리워크). 예전에는 [탭 줄] · [알림] · [결과 격자]가
        페이지 배경 위의 형제 셋이었고, 탭이 무엇을 전환하는지·결과가 어디까지인지 화면이 말하지
        않았다. 지금은 머리(탭) → 알림 → 본문(격자) 이 한 틀 안에 있다.

        캡처 계약은 그대로다: 이미지에 찍히는 것은 본문 안쪽의 격자뿐이고 탭·알림은 밖이다.
      */}
      <ResultBoard
        header={
          /* 탭 줄은 탭 스트립만 소유한다 — "간략히" 토글은 2026-07-29 에 결과 요약 카드
             우측 상단으로 옮겼다(탭 스트립과 가로를 나눠 써서 좁은 폭에서 가장 먼저 눌렸다). */
          <ScenarioTabsRow>
            {/* 🔴 prop 22개를 한 줄씩 넘기던 자리다. 무엇을 넘길지는 이제 useScenarioTabPanel 이 정한다. */}
            <ScenarioTabs {...tabsProps} />
          </ScenarioTabsRow>
        }
        notices={
          <>
            {/* 공유 링크가 열리지 못한 이유. 프리필 안내보다 **위**다 — 링크를 타고 온 사람에게는
                "이 화면이 당신이 열려던 것이 아니다"가 먼저 와야 한다. 실패했을 때만 렌더된다. */}
            <ShareLinkFailureNotice />

            {/* 첫 방문 프리필 안내. 결과 격자 **밖**이라 결과 이미지 캡처에 들어가지 않고,
                시나리오 탭 줄과 결과 사이에 서서 "이 숫자가 어디서 왔는지"를 결과보다 먼저 말한다. */}
            <ScenarioPrefillNotice />
          </>
        }
      >
        {/* 카드의 **폭·순서·막 구분은 전부 MainResultGrid가 정한다** — 이 파일은 무엇을 넘길지만 고른다. */}
        {simulation ? (
          <MainResultGrid
            summary={
              <ResultSummaryCard
                simulation={simulation}
                showQuickEstimate={showQuickEstimate}
                isResultCompact={isResultCompact}
                /* 결과 밀도 토글 — 카드 우측 상단. 한 줄 배치(라벨 좌·스위치 우)가 기본이다. */
                densityToggle={
                  <ToggleField
                    label="간략히"
                    accessibleName="결과 간략히 보기"
                    checked={isResultCompact}
                    onChange={handleToggleCompact}
                  />
                }
                targetMonthlyDividend={values.targetMonthlyDividend}
                formatResultAmount={formatResultAmount}
                formatPercent={formatPercent}
                targetYearLabel={targetYearLabel}
                requiredMonthlyContribution={requiredMonthlyContribution}
                condition={conditionItems}
                conditionAction={
                  <SettingsEntryButton
                    variant="inline"
                    drawerId={configDrawerId}
                    isOpen={isConfigDrawerOpen}
                    onOpen={openConfigDrawer}
                  />
                }
                /* 🔴 조건 요약 **바로 아래**. 이 계산이 무엇을 넣지 않았는지는 조건의 일부다
                   — 결과 숫자에서 멀어지면 읽히지 않는다(FxSensitivityNote 주석 참고). */
                footnote={<FxSensitivityNote tickers={includedTickers} fxRate={display.rate} />}
              />
            }
            financialIncomeBanner={
              simulation.summary.financialIncomeThresholdYear === undefined ? null : (
                <FinancialIncomeNotice thresholdYear={simulation.summary.financialIncomeThresholdYear} />
              )
            }
            monthlyAverageChart={
              showMonthlyAverageChart ? (
                <ChartPanel
                  {...seriesChartProps}
                  title="월 평균 배당"
                  getYValue={getMonthlyDividend}
                  referenceLine={monthlyDividendReferenceLine}
                  reachMarker={monthlyDividendReachMarker}
                />
              ) : null
            }
            composition={
              <PortfolioComposition
                includedProfiles={includedProfiles}
                normalizedAllocation={normalizedAllocation}
                allocationPieOption={allocationPieOption}
                allocationPercentByTickerId={allocationPercentByTickerId}
                fixedByTickerId={fixedByTickerId}
                adjustableTickerCount={adjustableTickerCount}
                onSetTickerWeight={setTickerWeight}
                onSetTickerShares={setTickerShares}
                holdings={allocationHoldings}
                formatAmount={formatHoldingAmount}
                fxRate={display.rate}
                onToggleTickerFixed={toggleTickerFixed}
                onClearAllFixed={clearAllFixed}
                onRemoveIncludedTicker={removeIncludedTicker}
                chartLabelSuffix={chartLabelSuffix}
                ResponsiveChart={ResponsiveEChart}
              />
            }
            monthlyCashflow={
              <MonthlyCashflow
                chartOption={recentCashflowBarOption}
                yearlyCashflowByTicker={yearlyCashflowByTicker}
                hasData={hasGraphData}
                emptyMessage={emptyGraphMessage}
                formatAmount={formatChartValue}
                chartLabelSuffix={chartLabelSuffix}
                scheduleTickers={scheduleTickers}
                ResponsiveChart={ResponsiveEChart}
              />
            }
            yearlyResult={
              <YearlyResult
                items={yearlySeriesItems}
                isFillOn={isYearlyAreaFillOn}
                onToggleFill={setIsYearlyAreaFillOn}
                chartOption={yearlyResultBarOption}
                hasData={hasGraphData}
                emptyMessage={emptyGraphMessage}
                chartLabelSuffix={chartLabelSuffix}
                ResponsiveChart={ResponsiveEChart}
              />
            }
            assetValueChart={
              showSplitGraphs ? <ChartPanel {...seriesChartProps} title="자산 가치" getYValue={getAssetValue} /> : null
            }
            cumulativeDividendChart={
              showSplitGraphs ? (
                <ChartPanel {...seriesChartProps} title="누적 배당" getYValue={getCumulativeDividend} />
              ) : null
            }
            postInvestmentProjection={
              <PostInvestmentProjectionPanel
                title={postInvestmentChartTitle}
                rows={postInvestmentDividendProjectionRows}
                hasData={hasGraphData && postInvestmentDividendProjectionRows.length > 0}
                emptyMessage={emptyGraphMessage}
                projectionYears={postInvestmentProjectionYears}
                onProjectionYearsChange={setPostInvestmentProjectionYears}
                isAssetView={isPostInvestmentAssetView}
                onAssetViewChange={setIsPostInvestmentAssetView}
                yAxisLabelFormatter={formatChartValue}
                chartLabelSuffix={chartLabelSuffix}
              />
            }
            saleTax={
              showSaleTaxCard ? (
                <SaleTaxCard
                  summary={simulation.summary}
                  isResultCompact={isResultCompact}
                  formatResultAmount={formatResultAmount}
                />
              ) : null
            }
          />
        ) : (
          <MainResultGrid
            emptyState={
              <PortfolioPresetBoard isPortfolioEmpty={includedProfiles.length === 0} onPresetSelect={requestApply} />
            }
          />
        )}
      </ResultBoard>

      {/*
        🔴 결과 그리드의 **형제**다 — 캡처 루트(`ResultGrid`) 안에 넣으면 결과 이미지에 프리셋 13장이
        따라 들어간다. 프리필로 열린 화면에서만 붙인다: 사용자가 자기 포트폴리오를 만든 뒤에도
        프리셋 벽이 결과 아래에 상주하면 "내 화면"이 아니라 카탈로그가 된다 — 그래서 조건은
        "프리셋을 **한 번이라도 적용했는가**"다(프리필이든 택일이든). 종목을 직접 만들어 나가는
        화면에는 여전히 뜨지 않는다.
        여기에 보드가 서 있는 덕분에 첫 화면에서도 `TOUR_TARGET.portfolioPresets` 앵커가 살아 있다.
      */}
      {simulation && boardPresetId ? (
        <PortfolioPresetBoard
          isPortfolioEmpty
          variant="browse"
          appliedPresetId={boardPresetId}
          onPresetSelect={requestApply}
        />
      ) : null}

      {pendingPreset && modalRoot ? (
        <PresetApplyModal
          modalRoot={modalRoot}
          presetTitle={pendingPreset.title}
          onCancel={cancelApply}
          onConfirm={confirmApply}
        />
      ) : null}
      {deleteTargetTabId && modalRoot ? (
        <TabDeleteModal modalRoot={modalRoot} onCancel={closeDeleteModal} onConfirm={confirmDeleteTab} />
      ) : null}
      {isLoginNudgeOpen && modalRoot ? (
        <LoginNudgeModal modalRoot={modalRoot} onClose={closeLoginNudge} onLogin={handleLoginFromNudge} />
      ) : null}
      {hoverTooltip && modalRoot
        ? createPortal(
            <ScenarioTabTooltip
              style={{
                left: `${hoverTooltip.x + 10}px`,
                top: `${hoverTooltip.y + 14}px`
              }}
            >
              {hoverTooltip.text}
            </ScenarioTabTooltip>,
            modalRoot
          )
        : null}
    </>
  );
}

const MainRightPanel = memo(MainRightPanelComponent);

export default MainRightPanel;
