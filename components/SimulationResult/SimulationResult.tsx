import { memo, useCallback } from 'react';
import { Card, ToggleField } from '@/components';
import type { SimulationResultProps } from './SimulationResult.types';
import {
  CompactSummaryGrid,
  CompactSummaryHelpButton,
  CompactSummaryItem,
  CompactSummaryLabel,
  CompactSummaryLabelGrow,
  CompactSummaryLabelRow,
  CompactSummaryValue
} from '@/pages/Main/Main.shared.styled';
import { useSetActiveHelpWrite } from '@/jotai';
import { ANALYTICS_EVENT, trackEvent } from '@/shared/lib/analytics';

function SimulationResultComponent({
  simulation,
  showQuickEstimate,
  isResultCompact,
  targetMonthlyDividend,
  onToggleCompact,
  formatResultAmount,
  formatPercent,
  targetYearLabel
}: SimulationResultProps) {
  const title = showQuickEstimate ? '시뮬레이션 결과 (간편)' : '시뮬레이션 결과 (정밀)';
  const setActiveHelp = useSetActiveHelpWrite();
  const openMonthlyAverageDividendHelp = useCallback(() => {
    trackEvent(ANALYTICS_EVENT.CTA_CLICK, {
      cta_name: 'open_help_simulation_monthly_average_dividend',
      placement: 'simulation_result'
    });
    setActiveHelp('simulationMonthlyAverageDividend');
  }, [setActiveHelp]);
  const openRecentPayoutMonthDividendHelp = useCallback(() => {
    trackEvent(ANALYTICS_EVENT.CTA_CLICK, {
      cta_name: 'open_help_simulation_recent_payout_month_dividend',
      placement: 'simulation_result'
    });
    setActiveHelp('simulationRecentPayoutMonthDividend');
  }, [setActiveHelp]);

  return (
    <Card
      title={title}
      titleRight={
        <ToggleField
          label="결과 상세도"
          checked={isResultCompact}
          hideLabel
          controlWidth="54px"
          onText="간략"
          offText="상세"
          onChange={(event) => {
            trackEvent(ANALYTICS_EVENT.TOGGLE_CHANGED, {
              field_name: 'isResultCompact',
              value: event.target.checked
            });
            onToggleCompact(event.target.checked);
          }}
        />
      }
    >
      {showQuickEstimate ? (
        <CompactSummaryGrid>
          <CompactSummaryItem>
            <CompactSummaryLabel>최종 자산 추정</CompactSummaryLabel>
            <CompactSummaryValue>{formatResultAmount(simulation.quickEstimate.endValue, isResultCompact)}</CompactSummaryValue>
          </CompactSummaryItem>
          <CompactSummaryItem>
            <CompactSummaryLabel>연 배당 추정(세후)</CompactSummaryLabel>
            <CompactSummaryValue>{formatResultAmount(simulation.quickEstimate.annualDividendApprox, isResultCompact)}</CompactSummaryValue>
          </CompactSummaryItem>
          <CompactSummaryItem>
            <CompactSummaryLabel>월 배당 추정(세후)</CompactSummaryLabel>
            <CompactSummaryValue>{formatResultAmount(simulation.quickEstimate.monthlyDividendApprox, isResultCompact)}</CompactSummaryValue>
          </CompactSummaryItem>
          <CompactSummaryItem>
            <CompactSummaryLabel>종료 시점 배당률(가격 기준)</CompactSummaryLabel>
            <CompactSummaryValue>{formatPercent(simulation.quickEstimate.yieldOnPriceAtEnd)}</CompactSummaryValue>
          </CompactSummaryItem>
        </CompactSummaryGrid>
      ) : (
        <CompactSummaryGrid>
          <CompactSummaryItem>
            <CompactSummaryLabel>최종 자산 가치</CompactSummaryLabel>
            <CompactSummaryValue>{formatResultAmount(simulation.summary.finalAssetValue, isResultCompact)}</CompactSummaryValue>
          </CompactSummaryItem>
          <CompactSummaryItem>
            <CompactSummaryLabelRow>
              <CompactSummaryLabelGrow>
                <CompactSummaryLabel>월배당(월평균: 연/12)</CompactSummaryLabel>
              </CompactSummaryLabelGrow>
              <CompactSummaryHelpButton
                type="button"
                aria-label="월배당 설명"
                onClick={openMonthlyAverageDividendHelp}
              >
                ?
              </CompactSummaryHelpButton>
            </CompactSummaryLabelRow>
            <CompactSummaryValue>{formatResultAmount(simulation.summary.finalMonthlyAverageDividend, isResultCompact)}</CompactSummaryValue>
          </CompactSummaryItem>
          <CompactSummaryItem>
            <CompactSummaryLabelRow>
              <CompactSummaryLabelGrow>
                <CompactSummaryLabel>최근 실지급 배당</CompactSummaryLabel>
              </CompactSummaryLabelGrow>
              <CompactSummaryHelpButton
                type="button"
                aria-label="최근 실지급 배당 설명"
                onClick={openRecentPayoutMonthDividendHelp}
              >
                ?
              </CompactSummaryHelpButton>
            </CompactSummaryLabelRow>
            <CompactSummaryValue>{formatResultAmount(simulation.summary.finalPayoutMonthDividend, isResultCompact)}</CompactSummaryValue>
          </CompactSummaryItem>
          <CompactSummaryItem>
            <CompactSummaryLabel>누적 순배당</CompactSummaryLabel>
            <CompactSummaryValue>{formatResultAmount(simulation.summary.totalNetDividend, isResultCompact)}</CompactSummaryValue>
          </CompactSummaryItem>
          <CompactSummaryItem>
            <CompactSummaryLabel>누적 세금</CompactSummaryLabel>
            <CompactSummaryValue>{formatResultAmount(simulation.summary.totalTaxPaid, isResultCompact)}</CompactSummaryValue>
          </CompactSummaryItem>
          <CompactSummaryItem>
            <CompactSummaryLabel>목표 월배당 도달 ({formatResultAmount(targetMonthlyDividend, isResultCompact)})</CompactSummaryLabel>
            <CompactSummaryValue>{targetYearLabel(simulation.summary.targetMonthDividendReachedYear)}</CompactSummaryValue>
          </CompactSummaryItem>
        </CompactSummaryGrid>
      )}
    </Card>
  );
}

const SimulationResult = memo(SimulationResultComponent);

export default SimulationResult;
