import { memo, useCallback } from 'react';
import { Card } from '@/components';
import { ResultsColumn } from '@/pages/Main/Main.shared.styled';
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
import { useMainComputed, useSnowballForm, useTickerActions } from '@/pages/Main/hooks';
import { ChartPanel, ResponsiveEChart } from '@/pages/Main/components';
import { formatPercent, formatResultAmount, targetYearLabel } from '@/pages/Main/utils';

function MainRightPanelComponent() {
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
  const getYear = useCallback((row: any) => `${row.year}`, []);
  const getMonthlyDividend = useCallback((row: any) => row.monthlyDividend, []);
  const getAssetValue = useCallback((row: any) => row.assetValue, []);
  const getCumulativeDividend = useCallback((row: any) => row.cumulativeDividend, []);

  return (
    <ResultsColumn>
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
                getXValue={getYear}
                getYValue={getMonthlyDividend}
              />
              <ChartPanel
                title="자산 가치"
                rows={tableRows}
                getXValue={getYear}
                getYValue={getAssetValue}
              />
              <ChartPanel
                title="누적 배당"
                rows={tableRows}
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
            ResponsiveChart={ResponsiveEChart}
          />

          <MonthlyCashflow chartOption={recentCashflowBarOption} ResponsiveChart={ResponsiveEChart} />
        </>
      ) : (
        <Card title="결과">
          <p>입력값 오류를 수정하면 결과가 표시됩니다.</p>
        </Card>
      )}
    </ResultsColumn>
  );
}

const MainRightPanel = memo(MainRightPanelComponent);

export default MainRightPanel;
