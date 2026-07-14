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
import {
  CAPITAL_GAINS_ANNUAL_DEDUCTION,
  FINANCIAL_INCOME_TAX_THRESHOLD,
  OVERSEAS_CAPITAL_GAINS_TAX_RATE
} from '@/shared/constants';
import {
  FinancialIncomeWarning,
  FinancialIncomeWarningIcon,
  FinancialIncomeWarningText,
  TaxAssumptionNote,
  TaxSection,
  TaxSectionHeader,
  TaxSectionTitle
} from './SimulationResult.styled';

const toManWon = (won: number): string => `${(won / 10_000).toLocaleString()}만원`;

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
  const openCapitalGainsTaxHelp = useCallback(() => {
    trackEvent(ANALYTICS_EVENT.CTA_CLICK, {
      cta_name: 'open_help_simulation_capital_gains_tax',
      placement: 'simulation_result'
    });
    setActiveHelp('simulationCapitalGainsTax');
  }, [setActiveHelp]);
  const openTotalCostBasisHelp = useCallback(() => {
    trackEvent(ANALYTICS_EVENT.CTA_CLICK, {
      cta_name: 'open_help_simulation_total_cost_basis',
      placement: 'simulation_result'
    });
    setActiveHelp('simulationTotalCostBasis');
  }, [setActiveHelp]);
  const openFinancialIncomeTaxHelp = useCallback(() => {
    trackEvent(ANALYTICS_EVENT.CTA_CLICK, {
      cta_name: 'open_help_simulation_financial_income_tax',
      placement: 'simulation_result'
    });
    setActiveHelp('simulationFinancialIncomeTax');
  }, [setActiveHelp]);

  const { summary } = simulation;
  const { financialIncomeThresholdYear } = summary;
  // 양도세 블록은 정밀 결과의 '상세' 모드에서만 보여준다 (간략 모드는 핵심 숫자만 남긴다).
  const showTaxSection = !showQuickEstimate && !isResultCompact;

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

      {showTaxSection ? (
        <TaxSection aria-label="양도소득세 추정">
          <TaxSectionHeader>
            <TaxSectionTitle>전량 매도한다면</TaxSectionTitle>
            <CompactSummaryHelpButton
              type="button"
              aria-label="전량 매도 시 예상 양도세 설명"
              onClick={openCapitalGainsTaxHelp}
            >
              ?
            </CompactSummaryHelpButton>
          </TaxSectionHeader>

          <CompactSummaryGrid>
            <CompactSummaryItem>
              <CompactSummaryLabelRow>
                <CompactSummaryLabelGrow>
                  <CompactSummaryLabel>취득원가</CompactSummaryLabel>
                </CompactSummaryLabelGrow>
                <CompactSummaryHelpButton type="button" aria-label="취득원가 설명" onClick={openTotalCostBasisHelp}>
                  ?
                </CompactSummaryHelpButton>
              </CompactSummaryLabelRow>
              <CompactSummaryValue>{formatResultAmount(summary.totalCostBasis, isResultCompact)}</CompactSummaryValue>
            </CompactSummaryItem>
            <CompactSummaryItem>
              <CompactSummaryLabel>평가이익</CompactSummaryLabel>
              <CompactSummaryValue>{formatResultAmount(summary.unrealizedGain, isResultCompact)}</CompactSummaryValue>
            </CompactSummaryItem>
            <CompactSummaryItem>
              <CompactSummaryLabel>전량 매도 시 예상 양도세</CompactSummaryLabel>
              <CompactSummaryValue>
                {formatResultAmount(summary.estimatedCapitalGainsTax, isResultCompact)}
              </CompactSummaryValue>
            </CompactSummaryItem>
            <CompactSummaryItem>
              <CompactSummaryLabel>세후 실현 가능 자산</CompactSummaryLabel>
              <CompactSummaryValue>
                {formatResultAmount(summary.afterCapitalGainsTaxValue, isResultCompact)}
              </CompactSummaryValue>
            </CompactSummaryItem>
          </CompactSummaryGrid>

          <TaxAssumptionNote>
            {`해외주식 양도세 ${OVERSEAS_CAPITAL_GAINS_TAX_RATE}%, 기본공제 연 ${toManWon(CAPITAL_GAINS_ANNUAL_DEDUCTION)}, 마지막 해에 전량 매도 가정. ` +
              '계속 보유하면 내지 않는 세금이라 위쪽 자산·누적 세금에는 반영되지 않았습니다.'}
          </TaxAssumptionNote>
        </TaxSection>
      ) : null}

      {financialIncomeThresholdYear === undefined ? null : (
        <FinancialIncomeWarning role="note" aria-label="금융소득종합과세 안내">
          <FinancialIncomeWarningIcon aria-hidden="true">!</FinancialIncomeWarningIcon>
          <FinancialIncomeWarningText>
            {`이 시나리오는 ${financialIncomeThresholdYear}년차에 세전 연 배당이 ${toManWon(FINANCIAL_INCOME_TAX_THRESHOLD)}을 넘습니다. ` +
              '금융소득종합과세 대상이 되어 실제 세율이 입력한 값보다 높아질 수 있습니다.'}
          </FinancialIncomeWarningText>
          <CompactSummaryHelpButton
            type="button"
            aria-label="금융소득종합과세 설명"
            onClick={openFinancialIncomeTaxHelp}
          >
            ?
          </CompactSummaryHelpButton>
        </FinancialIncomeWarning>
      )}
    </Card>
  );
}

const SimulationResult = memo(SimulationResultComponent);

export default SimulationResult;
