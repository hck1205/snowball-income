import { memo, useCallback } from 'react';
import { Banner, Card, StatTile, ToggleField } from '@/components';
import type { StatTone } from '@/components';
import type { SimulationResultProps } from './SimulationResult.types';
import { CompactSummaryHelpButton } from '@/pages/Main/Main.shared.styled';
import { useSetActiveHelpWrite } from '@/jotai';
import { ANALYTICS_EVENT, trackEvent } from '@/shared/lib/analytics';
import {
  CAPITAL_GAINS_ANNUAL_DEDUCTION,
  FINANCIAL_INCOME_TAX_THRESHOLD,
  OVERSEAS_CAPITAL_GAINS_TAX_RATE,
  TOUR_TARGET
} from '@/shared/constants';
import {
  HeroSlot,
  SummaryGrid,
  TaxAssumptionNote,
  TaxSection,
  TaxSectionHeader,
  TaxSectionTitle,
  WarningSlot
} from './SimulationResult.styled';

const toManWon = (won: number): string => `${(won / 10_000).toLocaleString()}만원`;

/** 부호 있는 값의 방향성(한국 증권 관례: 상승 적색 / 하락 청색). 0은 중립. */
const toneOf = (value: number): StatTone => (value > 0 ? 'positive' : value < 0 ? 'negative' : 'neutral');

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
      dataTour={TOUR_TARGET.simulationResult}
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
        <SummaryGrid>
          <HeroSlot>
            <StatTile
              emphasis="hero"
              label="최종 자산 추정"
              value={formatResultAmount(simulation.quickEstimate.endValue, isResultCompact)}
            />
          </HeroSlot>
          <StatTile
            label="연 배당 추정(세후)"
            value={formatResultAmount(simulation.quickEstimate.annualDividendApprox, isResultCompact)}
          />
          <StatTile
            label="월 배당 추정(세후)"
            value={formatResultAmount(simulation.quickEstimate.monthlyDividendApprox, isResultCompact)}
          />
          <StatTile
            label="종료 시점 배당률(가격 기준)"
            value={formatPercent(simulation.quickEstimate.yieldOnPriceAtEnd)}
          />
        </SummaryGrid>
      ) : (
        <SummaryGrid>
          {/* 사용자가 이 앱을 켠 이유. 유일한 hero 지표다. */}
          <HeroSlot>
            <StatTile
              emphasis="hero"
              label="최종 자산 가치"
              value={formatResultAmount(summary.finalAssetValue, isResultCompact)}
            />
          </HeroSlot>
          <StatTile
            label="월배당(월평균: 연/12)"
            value={formatResultAmount(summary.finalMonthlyAverageDividend, isResultCompact)}
            action={
              <CompactSummaryHelpButton type="button" aria-label="월배당 설명" onClick={openMonthlyAverageDividendHelp}>
                ?
              </CompactSummaryHelpButton>
            }
          />
          <StatTile
            label="최근 실지급 배당"
            value={formatResultAmount(summary.finalPayoutMonthDividend, isResultCompact)}
            action={
              <CompactSummaryHelpButton
                type="button"
                aria-label="최근 실지급 배당 설명"
                onClick={openRecentPayoutMonthDividendHelp}
              >
                ?
              </CompactSummaryHelpButton>
            }
          />
          <StatTile label="누적 순배당" value={formatResultAmount(summary.totalNetDividend, isResultCompact)} />
          <StatTile label="누적 세금" value={formatResultAmount(summary.totalTaxPaid, isResultCompact)} />
          <StatTile
            label={`목표 월배당 도달 (${formatResultAmount(targetMonthlyDividend, isResultCompact)})`}
            value={targetYearLabel(summary.targetMonthDividendReachedYear)}
          />
        </SummaryGrid>
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

          <SummaryGrid>
            <StatTile
              label="취득원가"
              value={formatResultAmount(summary.totalCostBasis, isResultCompact)}
              action={
                <CompactSummaryHelpButton type="button" aria-label="취득원가 설명" onClick={openTotalCostBasisHelp}>
                  ?
                </CompactSummaryHelpButton>
              }
            />
            {/* 평가이익은 부호가 있는 유일한 지표다 → 방향성 색을 쓴다. */}
            <StatTile
              label="평가이익"
              value={formatResultAmount(summary.unrealizedGain, isResultCompact)}
              tone={toneOf(summary.unrealizedGain)}
            />
            <StatTile
              label="전량 매도 시 예상 양도세"
              value={formatResultAmount(summary.estimatedCapitalGainsTax, isResultCompact)}
            />
            <StatTile
              label="세후 실현 가능 자산"
              value={formatResultAmount(summary.afterCapitalGainsTaxValue, isResultCompact)}
            />
          </SummaryGrid>

          <TaxAssumptionNote>
            {`해외주식 양도세 ${OVERSEAS_CAPITAL_GAINS_TAX_RATE}%, 기본공제 연 ${toManWon(CAPITAL_GAINS_ANNUAL_DEDUCTION)}, 마지막 해에 전량 매도 가정. ` +
              '계속 보유하면 내지 않는 세금이라 위쪽 자산·누적 세금에는 반영되지 않았습니다.'}
          </TaxAssumptionNote>
        </TaxSection>
      ) : null}

      {financialIncomeThresholdYear === undefined ? null : (
        <WarningSlot>
          <Banner tone="warning" role="note" aria-label="금융소득종합과세 안내">
            {/* 도움말 버튼을 문단 안에 둔다 — Banner 본문은 grid라서 형제로 두면 아래로 떨어진다. */}
            <p>
              {`이 시나리오는 ${financialIncomeThresholdYear}년차에 세전 연 배당이 ${toManWon(FINANCIAL_INCOME_TAX_THRESHOLD)}을 넘습니다. ` +
                '금융소득종합과세 대상이 되어 실제 세율이 입력한 값보다 높아질 수 있습니다. '}
              <CompactSummaryHelpButton
                type="button"
                aria-label="금융소득종합과세 설명"
                onClick={openFinancialIncomeTaxHelp}
              >
                ?
              </CompactSummaryHelpButton>
            </p>
          </Banner>
        </WarningSlot>
      )}
    </Card>
  );
}

const SimulationResult = memo(SimulationResultComponent);

export default SimulationResult;
