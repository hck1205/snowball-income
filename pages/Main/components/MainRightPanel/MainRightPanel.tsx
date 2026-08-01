import { memo, useCallback, useMemo, useState } from 'react';
import type { ChangeEvent } from 'react';
import { ANALYTICS_EVENT, trackEvent } from '@/shared/lib/analytics';
import { useInRouterContext } from 'react-router-dom';
import { getTickerDisplayName } from '@/shared/utils';
import { createPortal } from 'react-dom';
import { ResponsiveEChart } from '@/components/common';
import { useOptionalCommunityAuth } from '@/components/community/CommunityAuthProvider';
import { DISPLAY_CURRENCY_COPY, SIMULATOR_COPY } from '@/shared/constants';
import { buildPostInvestmentChartTitle, focusTargetMonthlyDividendInput } from './MainRightPanel.utils';
import {
  FinancialIncomeNotice,
  LoginNudgeModal,
  PortfolioPresetBoard,
  PostInvestmentProjectionPanel,
  PresetApplyModal,
  PortfolioPrefillRequest,
  QuickAdjustBar,
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
import { useMainComputed, useScenarioTabs, useSnowballForm, useTickerActions } from '@/pages/Main/hooks';
// 형제 폴더 직접 참조 — 상위 배럴(@/pages/Main/components)은 이 파일 자신도 재수출해 import 순환이 된다.
import { ChartPanel } from '../ChartPanel';
import MainResultGrid from '../MainResultGrid';
import ScenarioTabsRow from '../ScenarioTabsRow';
import SettingsEntryButton from '../SettingsEntryButton';
import { createResultAmountFormatter, formatPercent, targetYearLabel } from '@/pages/Main/utils';
import {
  useConditionStripItems,
  usePortfolioPrefill,
  usePortfolioPrefillCommit,
  usePortfolioPresetApply,
  useResultChartAdapters,
  useResultViewAnalytics,
  useScenarioTabInteractions,
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
  const { setTickerWeight, toggleTickerFixed, clearAllFixed, removeIncludedTicker } = useTickerActions();
  const {
    tabs,
    activeScenarioId,
    canCreateTab,
    canDeleteTab,
    requiresLoginToCreateTab,
    tabCreationGate,
    selectScenarioTab,
    createScenarioTab,
    renameScenarioTab,
    deleteScenarioTab,
    reorderScenarioTabs
  } = useScenarioTabs();
  const {
    editingTabId,
    editingTabName,
    editingTabWidth,
    deleteTargetTabId,
    hoverTooltip,
    draggingTabId,
    dragOverTabId,
    dragJustFinishedRef,
    isLoginNudgeOpen,
    setEditingTabName,
    setDraggingTabId,
    setDragOverTabId,
    startRenameMode,
    cancelRenameMode,
    commitRenameMode,
    openDeleteModal,
    closeDeleteModal,
    confirmDeleteTab,
    showHoverTooltip,
    hideHoverTooltip,
    handleCreateTab,
    openLoginNudge,
    closeLoginNudge,
    handleLoginFromNudge,
    openScenarioTabsHelp
  } = useScenarioTabInteractions({
    renameScenarioTab,
    deleteScenarioTab,
    createScenarioTab,
    setActiveHelp,
    communityAuth
  });
  /*
   * "내 포트폴리오" 화면에서 넘어온 프리필의 커밋. 기본은 새 탭 생성이고, 새 탭을 못 만들 때
   * (비로그인 1탭 게이트)만 비어 있는 활성 탭에 커밋한다 — 판정·매핑은 전부 순수 함수에 있다.
   */
  const applyPortfolioPrefill = usePortfolioPrefillCommit({
    tabCreationGate,
    createScenarioTab,
    tickerProfileCount: tickerProfiles.length,
    initialInvestment: values.initialInvestment,
    setTickerProfiles,
    setIncludedTickerIds,
    setWeightByTickerId,
    setFixedByTickerId,
    setSelectedTickerId,
    setField,
    openLoginNudge
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
    taxRatePercent: values.taxRate,
    reinvestDividends: values.reinvestDividends,
    reinvestDividendPercent: values.reinvestDividendPercent,
    targetMonthlyDividend: values.targetMonthlyDividend,
    includedTickerCount: includedProfiles.length,
    showQuickEstimate,
    formatResultAmount
  });

  /** 연도별 시계열 라인 차트 3종(월평균·자산·누적)이 공유하는 props. 제목과 y값만 달라진다. */
  const seriesChartProps = {
    rows: tableRows,
    hasData: hasGraphData,
    emptyMessage: emptyGraphMessage,
    getXValue: getYear,
    yAxisLabelFormatter: formatChartValue,
    chartLabelSuffix
  };

  /* 양도세 카드는 정밀 결과의 '상세' 모드에서만 (간략 모드는 핵심 숫자만 남긴다). */
  const showSaleTaxCard = !showQuickEstimate && !isResultCompact;
  /* 목표를 정했으면 분할 토글과 무관하게 월 평균 배당 차트를 띄운다 — 목표선·도달 마커가
     숨은 토글 뒤에 갇히면 목표 시각화가 사실상 없는 것과 같다. */
  const showMonthlyAverageChart = showSplitGraphs || hasTarget;
  const postInvestmentChartTitle = buildPostInvestmentChartTitle(
    postInvestmentDividendProjectionRows,
    isPostInvestmentAssetView
  );

  const { pendingPreset, requestApply, cancelApply, confirmApply, applyPresetSilently } = usePortfolioPresetApply({
    activeScenarioId,
    renameScenarioTab,
    setTickerProfiles,
    setIncludedTickerIds,
    setSelectedTickerId,
    setWeightByTickerId,
    setFixedByTickerId,
    setShowPortfolioDividendCenter,
    setYieldFormValues
  });

  /*
   * 첫 방문 기본 시나리오. **저장소가 비어 있을 때만** 영속 계층이 id 를 발행하고(그 순간부터 저장 정지),
   * 여기서 프리셋 카드와 같은 경로로 적용한다. 계측만 쏘지 않는다(프리셋 인기 순위 오염 방지).
   */
  usePortfolioPrefill({ hasTickerProfiles: tickerProfiles.length > 0, applyPreset: applyPresetSilently });
  /* 프리필이 살아 있는 동안에만 결과 아래에 프리셋 고르개를 붙이고, 배너·"지금 적용됨" 표식을 켠다. */
  const scenarioPrefill = useScenarioPrefillAtomValue();
  const appliedPrefillPresetId = scenarioPrefill?.status === 'applied' ? scenarioPrefill.presetId : null;

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

      {/* 탭 줄은 이제 탭 스트립만 소유한다 — "간략히" 토글은 2026-07-29 에 결과 요약 카드
          우측 상단으로 옮겼다(탭 스트립과 가로를 나눠 써서 좁은 폭에서 가장 먼저 눌렸다). */}
      <ScenarioTabsRow>
        <ScenarioTabs
          tabs={tabs}
          activeScenarioId={activeScenarioId}
          editingTabId={editingTabId}
          editingTabName={editingTabName}
          editingTabWidth={editingTabWidth}
          draggingTabId={draggingTabId}
          dragOverTabId={dragOverTabId}
          dragJustFinishedRef={dragJustFinishedRef}
          canCreateTab={canCreateTab}
          canDeleteTab={canDeleteTab}
          requiresLoginToCreateTab={requiresLoginToCreateTab}
          setEditingTabName={setEditingTabName}
          setDraggingTabId={setDraggingTabId}
          setDragOverTabId={setDragOverTabId}
          commitRenameMode={commitRenameMode}
          cancelRenameMode={cancelRenameMode}
          startRenameMode={startRenameMode}
          openDeleteModal={openDeleteModal}
          selectScenarioTab={selectScenarioTab}
          reorderScenarioTabs={reorderScenarioTabs}
          showHoverTooltip={showHoverTooltip}
          hideHoverTooltip={hideHoverTooltip}
          onCreateTab={handleCreateTab}
          openScenarioTabsHelp={openScenarioTabsHelp}
        />
      </ScenarioTabsRow>

      {/* 공유 링크가 열리지 못한 이유. 프리필 안내보다 **위**다 — 링크를 타고 온 사람에게는
          "이 화면이 당신이 열려던 것이 아니다"가 먼저 와야 한다. 실패했을 때만 렌더된다. */}
      <ShareLinkFailureNotice />

      {/* 첫 방문 프리필 안내. 결과 그리드 **밖**(형제)이라 결과 이미지 캡처에 들어가지 않고,
          시나리오 탭 줄과 결과 사이에 서서 "이 숫자가 어디서 왔는지"를 결과보다 먼저 말한다. */}
      <ScenarioPrefillNotice />

      {/* 카드의 **폭·순서는 전부 MainResultGrid가 정한다** — 이 파일은 무엇을 넘길지만 고른다. */}
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
              condition={conditionItems}
              conditionAction={
                <SettingsEntryButton
                  variant="inline"
                  drawerId={configDrawerId}
                  isOpen={isConfigDrawerOpen}
                  onOpen={openConfigDrawer}
                />
              }
            />
          }
          quickAdjust={
            <QuickAdjustBar
              values={{
                monthlyContribution: values.monthlyContribution,
                durationYears: values.durationYears,
                targetMonthlyDividend: values.targetMonthlyDividend
              }}
              onSetField={setField}
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

      {/*
        🔴 결과 그리드의 **형제**다 — 캡처 루트(`ResultGrid`) 안에 넣으면 결과 이미지에 프리셋 13장이
        따라 들어간다. 프리필로 열린 화면에서만 붙인다: 사용자가 자기 포트폴리오를 만든 뒤에도
        프리셋 벽이 결과 아래에 상주하면 "내 화면"이 아니라 카탈로그가 된다.
        여기에 보드가 서 있는 덕분에 첫 화면에서도 `TOUR_TARGET.portfolioPresets` 앵커가 살아 있다.
      */}
      {simulation && appliedPrefillPresetId ? (
        <PortfolioPresetBoard
          isPortfolioEmpty
          variant="browse"
          appliedPresetId={appliedPrefillPresetId}
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
            <ScenarioTabTooltip style={{ left: `${hoverTooltip.x + 10}px`, top: `${hoverTooltip.y + 14}px` }}>
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
