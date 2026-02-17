import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Card } from '@/components';
import type { SimulationResult as SimulationResultRow } from '@/shared/types';
import {
  ModalActions,
  ModalBackdrop,
  ModalBody,
  ModalPanel,
  ModalTitle,
  PrimaryButton,
  ResultsColumn,
  ScenarioTabButton,
  ScenarioTabCloseButton,
  ScenarioTabEditWrap,
  ScenarioTabRenameInput,
  ScenarioTabTooltip,
  ScenarioTabsWrap
} from '@/pages/Main/Main.shared.styled';
import MonthlyCashflow from '@/components/MonthlyCashflow';
import PortfolioComposition from '@/components/PortfolioComposition';
import SimulationResult from '@/components/SimulationResult';
import YearlyResult from '@/components/YearlyResult';
import {
  useAdjustableTickerCountAtomValue,
  useAllocationPercentByTickerIdAtomValue,
  useFixedByTickerIdAtomValue,
  useIncludedProfilesAtomValue,
  useIsResultCompactAtomValue,
  useIsYearlyAreaFillOnAtomValue,
  useNormalizedAllocationAtomValue,
  useSetIsResultCompactWrite,
  useSetIsYearlyAreaFillOnWrite,
  useSetShowPortfolioDividendCenterWrite,
  useShowPortfolioDividendCenterAtomValue,
  useShowQuickEstimateAtomValue,
  useShowSplitGraphsAtomValue,
  useVisibleYearlySeriesAtomValue
} from '@/jotai';
import { useMainComputed, useScenarioTabs, useSnowballForm, useTickerActions } from '@/pages/Main/hooks';
import { ChartPanel, ResponsiveEChart } from '@/pages/Main/components';
import { formatPercent, formatResultAmount, targetYearLabel } from '@/pages/Main/utils';
import { SecondaryButton } from '@/pages/Main/Main.shared.styled';

function MainRightPanelComponent() {
  const modalRoot = typeof document !== 'undefined' ? document.body : null;
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editingTabName, setEditingTabName] = useState('');
  const [editingTabWidth, setEditingTabWidth] = useState<number | null>(null);
  const [deleteTargetTabId, setDeleteTargetTabId] = useState<string | null>(null);
  const [hoverTooltip, setHoverTooltip] = useState<{ text: string; x: number; y: number } | null>(null);
  const longPressTimerRef = useRef<number | null>(null);
  const longPressTriggeredRef = useRef(false);
  const showQuickEstimate = useShowQuickEstimateAtomValue();
  const isResultCompact = useIsResultCompactAtomValue();
  const setIsResultCompact = useSetIsResultCompactWrite();
  const includedProfiles = useIncludedProfilesAtomValue();
  const normalizedAllocation = useNormalizedAllocationAtomValue();
  const allocationPercentByTickerId = useAllocationPercentByTickerIdAtomValue();
  const adjustableTickerCount = useAdjustableTickerCountAtomValue();
  const fixedByTickerId = useFixedByTickerIdAtomValue();
  const showPortfolioDividendCenter = useShowPortfolioDividendCenterAtomValue();
  const setShowPortfolioDividendCenter = useSetShowPortfolioDividendCenterWrite();
  const showSplitGraphs = useShowSplitGraphsAtomValue();
  const isYearlyAreaFillOn = useIsYearlyAreaFillOnAtomValue();
  const setIsYearlyAreaFillOn = useSetIsYearlyAreaFillOnWrite();
  const visibleYearlySeries = useVisibleYearlySeriesAtomValue();
  const { values, validation } = useSnowballForm();
  const {
    simulation,
    tableRows,
    allocationPieOption,
    recentCashflowBarOption,
    yearlyResultBarOption,
    yearlySeriesItems
  } = useMainComputed({
    isValid: validation.isValid,
    values,
    showPortfolioDividendCenter,
    visibleYearlySeries,
    isYearlyAreaFillOn
  });
  const { setTickerWeight, toggleTickerFixed, removeIncludedTicker } = useTickerActions();
  const { tabs, activeScenarioId, canCreateTab, canDeleteTab, selectScenarioTab, createScenarioTab, renameScenarioTab, deleteScenarioTab } =
    useScenarioTabs();
  const hasGraphData = includedProfiles.length > 0;
  const emptyGraphMessage = '좌측 티커 생성을 통해 포트폴리오를 구성해주세요.';
  const getYear = useCallback((row: SimulationResultRow) => `${row.year}`, []);
  const getMonthlyDividend = useCallback((row: SimulationResultRow) => row.monthlyDividend, []);
  const getAssetValue = useCallback((row: SimulationResultRow) => row.assetValue, []);
  const getCumulativeDividend = useCallback((row: SimulationResultRow) => row.cumulativeDividend, []);

  const clearLongPressTimer = useCallback(() => {
    if (longPressTimerRef.current === null) return;
    window.clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = null;
  }, []);

  useEffect(() => () => clearLongPressTimer(), [clearLongPressTimer]);

  const startRenameMode = useCallback((tabId: string, tabName: string, tabWidth?: number) => {
    setEditingTabId(tabId);
    setEditingTabName(tabName);
    setEditingTabWidth(typeof tabWidth === 'number' && tabWidth > 0 ? tabWidth + 20 : null);
  }, []);

  const cancelRenameMode = useCallback(() => {
    setEditingTabId(null);
    setEditingTabName('');
    setEditingTabWidth(null);
  }, []);

  const commitRenameMode = useCallback(() => {
    if (!editingTabId) return;
    const nextName = editingTabName.trim();
    if (!nextName) {
      // Empty input keeps previous tab name.
      setEditingTabId(null);
      setEditingTabName('');
      setEditingTabWidth(null);
      return;
    }
    const success = renameScenarioTab(editingTabId, editingTabName);
    if (!success) return;
    setEditingTabId(null);
    setEditingTabName('');
    setEditingTabWidth(null);
  }, [editingTabId, editingTabName, renameScenarioTab]);

  const startLongPress = useCallback(
    (tabId: string, tabName: string, tabWidth?: number) => {
      clearLongPressTimer();
      longPressTriggeredRef.current = false;
      longPressTimerRef.current = window.setTimeout(() => {
        longPressTriggeredRef.current = true;
        startRenameMode(tabId, tabName, tabWidth);
      }, 520);
    },
    [clearLongPressTimer, startRenameMode]
  );

  const finishLongPress = useCallback(() => {
    clearLongPressTimer();
  }, [clearLongPressTimer]);

  const openDeleteModal = useCallback((tabId: string) => {
    setDeleteTargetTabId(tabId);
  }, []);

  const closeDeleteModal = useCallback(() => {
    setDeleteTargetTabId(null);
  }, []);

  const confirmDeleteTab = useCallback(() => {
    if (!deleteTargetTabId) return;
    deleteScenarioTab(deleteTargetTabId);
    setDeleteTargetTabId(null);
    if (editingTabId === deleteTargetTabId) {
      setEditingTabId(null);
      setEditingTabName('');
      setEditingTabWidth(null);
    }
  }, [deleteScenarioTab, deleteTargetTabId, editingTabId]);

  const showHoverTooltip = useCallback((text: string, x: number, y: number) => {
    setHoverTooltip({ text, x, y });
  }, []);

  const hideHoverTooltip = useCallback(() => {
    setHoverTooltip(null);
  }, []);

  return (
    <ResultsColumn>
      <ScenarioTabsWrap aria-label="전략 탭 목록">
        {tabs.map((tab) =>
          editingTabId === tab.id ? (
            <ScenarioTabEditWrap key={tab.id} style={editingTabWidth ? { width: `${editingTabWidth}px` } : undefined}>
              <ScenarioTabRenameInput
                autoFocus
                aria-label={`${tab.name} 이름 변경`}
                value={editingTabName}
                onChange={(event) => setEditingTabName(event.target.value)}
                onBlur={commitRenameMode}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    commitRenameMode();
                  } else if (event.key === 'Escape') {
                    event.preventDefault();
                    cancelRenameMode();
                  }
                }}
              />
              <ScenarioTabCloseButton
                type="button"
                aria-label={`${tab.name} 삭제`}
                disabled={!canDeleteTab}
                onMouseDown={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                }}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  openDeleteModal(tab.id);
                }}
              >
                ×
              </ScenarioTabCloseButton>
            </ScenarioTabEditWrap>
          ) : (
            <ScenarioTabButton
              key={tab.id}
              type="button"
              active={tab.id === activeScenarioId}
              onClick={() => {
                if (longPressTriggeredRef.current) {
                  longPressTriggeredRef.current = false;
                  return;
                }
                selectScenarioTab(tab.id);
              }}
              onMouseEnter={(event) => showHoverTooltip(tab.name, event.clientX, event.clientY)}
              onMouseMove={(event) => showHoverTooltip(tab.name, event.clientX, event.clientY)}
              onDoubleClick={(event) => startRenameMode(tab.id, tab.name, event.currentTarget.getBoundingClientRect().width)}
              onMouseDown={(event) => startLongPress(tab.id, tab.name, event.currentTarget.getBoundingClientRect().width)}
              onMouseUp={finishLongPress}
              onMouseLeave={() => {
                finishLongPress();
                hideHoverTooltip();
              }}
              onTouchStart={(event) => startLongPress(tab.id, tab.name, event.currentTarget.getBoundingClientRect().width)}
              onTouchEnd={finishLongPress}
              onTouchCancel={finishLongPress}
            >
              {tab.name}
            </ScenarioTabButton>
          )
        )}
        {canCreateTab ? (
          <ScenarioTabButton type="button" aria-label="새 탭 추가" onClick={() => void createScenarioTab()}>
            +
          </ScenarioTabButton>
        ) : null}
      </ScenarioTabsWrap>

      {simulation ? (
        <>
          <SimulationResult
            simulation={simulation}
            showQuickEstimate={showQuickEstimate}
            isResultCompact={isResultCompact}
            targetMonthlyDividend={values.targetMonthlyDividend}
            onToggleCompact={setIsResultCompact}
            formatResultAmount={formatResultAmount}
            formatPercent={formatPercent}
            targetYearLabel={targetYearLabel}
          />

          <PortfolioComposition
            includedProfiles={includedProfiles}
            normalizedAllocation={normalizedAllocation}
            allocationPieOption={allocationPieOption}
            allocationPercentByTickerId={allocationPercentByTickerId}
            fixedByTickerId={fixedByTickerId}
            adjustableTickerCount={adjustableTickerCount}
            showPortfolioDividendCenter={showPortfolioDividendCenter}
            onToggleCenterDisplay={setShowPortfolioDividendCenter}
            onSetTickerWeight={setTickerWeight}
            onToggleTickerFixed={toggleTickerFixed}
            onRemoveIncludedTicker={removeIncludedTicker}
            ResponsiveChart={ResponsiveEChart}
          />

          {showSplitGraphs ? (
            <>
              <ChartPanel
                title="월 평균 배당"
                rows={tableRows}
                hasData={hasGraphData}
                emptyMessage={emptyGraphMessage}
                getXValue={getYear}
                getYValue={getMonthlyDividend}
              />
              <ChartPanel
                title="자산 가치"
                rows={tableRows}
                hasData={hasGraphData}
                emptyMessage={emptyGraphMessage}
                getXValue={getYear}
                getYValue={getAssetValue}
              />
              <ChartPanel
                title="누적 배당"
                rows={tableRows}
                hasData={hasGraphData}
                emptyMessage={emptyGraphMessage}
                getXValue={getYear}
                getYValue={getCumulativeDividend}
              />
            </>
          ) : null}

          <YearlyResult
            items={yearlySeriesItems}
            isFillOn={isYearlyAreaFillOn}
            onToggleFill={setIsYearlyAreaFillOn}
            chartOption={yearlyResultBarOption}
            hasData={hasGraphData}
            emptyMessage={emptyGraphMessage}
            ResponsiveChart={ResponsiveEChart}
          />

          <MonthlyCashflow
            chartOption={recentCashflowBarOption}
            hasData={hasGraphData}
            emptyMessage={emptyGraphMessage}
            ResponsiveChart={ResponsiveEChart}
          />
        </>
      ) : (
        <Card title="결과">
          <p>{includedProfiles.length === 0 ? '좌측 티커 생성을 통해 포트폴리오를 구성해주세요.' : '입력값 오류를 수정하면 결과가 표시됩니다.'}</p>
        </Card>
      )}
      {deleteTargetTabId && modalRoot
        ? createPortal(
            <ModalBackdrop
              role="dialog"
              aria-modal="true"
              aria-label="탭 삭제 확인"
              onClick={(event) => {
                if (event.target !== event.currentTarget) return;
                closeDeleteModal();
              }}
            >
              <ModalPanel>
                <ModalTitle>탭 삭제</ModalTitle>
                <ModalBody>정말 삭제하시겠습니까?</ModalBody>
                <ModalActions>
                  <SecondaryButton type="button" onClick={closeDeleteModal}>
                    취소
                  </SecondaryButton>
                  <PrimaryButton type="button" onClick={confirmDeleteTab}>
                    삭제
                  </PrimaryButton>
                </ModalActions>
              </ModalPanel>
            </ModalBackdrop>,
            modalRoot
          )
        : null}
      {hoverTooltip && modalRoot
        ? createPortal(
            <ScenarioTabTooltip style={{ left: `${hoverTooltip.x + 10}px`, top: `${hoverTooltip.y + 14}px` }}>
              {hoverTooltip.text}
            </ScenarioTabTooltip>,
            modalRoot
          )
        : null}
    </ResultsColumn>
  );
}

const MainRightPanel = memo(MainRightPanelComponent);

export default MainRightPanel;
