import { memo, useCallback } from 'react';
import { Card, StatTile } from '@/components';
import type { StatTone } from '@/components';
import { CompactSummaryHelpButton } from '@/components/common';
import { useSetActiveHelpWrite } from '@/jotai';
import { ANALYTICS_EVENT, trackEvent } from '@/shared/lib/analytics';
import { CAPITAL_GAINS_ANNUAL_DEDUCTION, OVERSEAS_CAPITAL_GAINS_TAX_RATE } from '@/shared/constants';
import type { SaleTaxCardProps } from './SaleTaxCard.types';
import { SaleTaxTitleHelpButton, SummaryGrid, TaxAssumptionNote } from './SaleTaxCard.styled';
import { toManWon } from './SaleTaxCard.utils';

/** 부호 있는 값의 방향성(한국 증권 관례: 상승 적색 / 하락 청색). 0은 중립. */
const toneOf = (value: number): StatTone => (value > 0 ? 'positive' : value < 0 ? 'negative' : 'neutral');

/**
 * "전량 매도한다면" — 가정이 다른 별도 세계다(계속 보유하면 내지 않는 세금).
 * 그래서 결과 카드들과 **같은 격으로 보이면 안 된다** → `tone="sunken"` 부속 카드.
 */
function SaleTaxCardComponent({ summary, isResultCompact, formatResultAmount }: SaleTaxCardProps) {
  const setActiveHelp = useSetActiveHelpWrite();
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

  return (
    <Card
      tone="sunken"
      title="전량 매도한다면"
      titleRight={
        <SaleTaxTitleHelpButton
          type="button"
          aria-label="전량 매도 시 예상 양도세 설명"
          onClick={openCapitalGainsTaxHelp}
        >
          ?
        </SaleTaxTitleHelpButton>
      }
    >
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
    </Card>
  );
}

const SaleTaxCard = memo(SaleTaxCardComponent);

export default SaleTaxCard;
