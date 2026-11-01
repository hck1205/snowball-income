import { isKoreanListedTicker } from '@/shared/constants/tax';
import InflationCompare from '../InflationCompare';
import { DIVIDEND_TARGET_COPY } from '../../copy';
import { DETAIL_REGION_ID, formatKoreanWon, formatPercent, toneVars } from '../../utils';
import type { RequirementBreakdownProps } from './RequirementBreakdown.types';
import {
  ActionRow,
  AnswerColumn,
  AnswerCaption,
  AnswerLabel,
  AnswerValue,
  Badge,
  BasisNote,
  BreakdownCard,
  BreakdownTop,
  NeutralBadge,
  PayoutPill,
  SecondaryLink,
  SimulateButton,
  StepLabel,
  StepList,
  StepOperator,
  StepRow,
  StepsPanel,
  StepsTitle,
  StepValue,
  TickerLine,
  TickerName,
  TickerSymbol
} from './RequirementBreakdown.styled';

const COPY = DIVIDEND_TARGET_COPY.breakdown;

/**
 * 고른 한 종목의 **답 + 그 답이 나온 순서 + 물가 비교**.
 *
 * 🔴 계산하지 않는다 — 모든 숫자는 모델(`item`)에서 온다(순수 계층이 항등식까지 테스트한다).
 *    여기서 `× 12` 같은 산수를 다시 하면 표시와 모델이 갈라질 자리가 하나 더 생긴다.
 *    "한 번 받을 때"도 모델의 `perPayoutAfterTax` 다(지급 횟수 정본은 엔진의 `paymentsPerYearMap`).
 */
export default function RequirementBreakdown({
  item,
  asOf,
  inflationRate,
  onInflationChange,
  onSimulate
}: RequirementBreakdownProps) {
  const requirement = item.requirement;
  const taxRateText = requirement ? formatPercent(requirement.taxRatePercent) : '';
  const isKoreanListed = isKoreanListedTicker(item.ticker);

  return (
    <BreakdownCard id={DETAIL_REGION_ID} aria-label={`${item.ticker} ${COPY.sectionLabel}`} style={toneVars(item.categoryId)}>
      <BreakdownTop>
        <AnswerColumn>
          <TickerLine>
            <TickerSymbol>{item.ticker}</TickerSymbol>
            <Badge>{item.categoryLabel}</Badge>
            <NeutralBadge>{COPY.frequency[item.frequency]}</NeutralBadge>
          </TickerLine>
          <TickerName>{item.name}</TickerName>

          <AnswerLabel>{COPY.principalLabel}</AnswerLabel>
          <AnswerValue>{requirement ? formatKoreanWon(requirement.requiredPrincipal) : '-'}</AnswerValue>
          {requirement ? (
            <AnswerCaption>{COPY.principalCaption(item.ticker, formatKoreanWon(requirement.monthlyAfterTax))}</AnswerCaption>
          ) : null}
          {item.perPayoutAfterTax === null ? null : (
            <PayoutPill>{COPY.perPayout(formatKoreanWon(item.perPayoutAfterTax), COPY.frequency[item.frequency])}</PayoutPill>
          )}

          <ActionRow>
            <SimulateButton type="button" onClick={() => onSimulate(item.ticker)}>
              {COPY.simulateCta}
            </SimulateButton>
            {item.tickerPagePath ? <SecondaryLink to={item.tickerPagePath}>{COPY.tickerPageLink}</SecondaryLink> : null}
          </ActionRow>
        </AnswerColumn>

        {requirement ? (
          <StepsPanel>
            <StepsTitle>{COPY.stepsTitle}</StepsTitle>
            <StepList>
              <StepRow>
                <StepLabel>{COPY.steps.monthlyAfterTax}</StepLabel>
                <StepValue>{formatKoreanWon(requirement.monthlyAfterTax)}</StepValue>
              </StepRow>
              <StepOperator aria-hidden>{COPY.ops.times12}</StepOperator>
              <StepRow>
                <StepLabel>{COPY.steps.annualAfterTax}</StepLabel>
                <StepValue>{formatKoreanWon(requirement.annualAfterTax)}</StepValue>
              </StepRow>
              <StepOperator aria-hidden>{COPY.ops.divideByAfterTax(taxRateText)}</StepOperator>
              <StepRow>
                <StepLabel>{COPY.steps.annualPreTax}</StepLabel>
                <StepValue>{formatKoreanWon(requirement.annualPreTax)}</StepValue>
              </StepRow>
              <StepRow $tone="tax">
                <StepLabel>
                  {COPY.steps.annualTax} ({taxRateText})
                </StepLabel>
                <StepValue $tone="tax">−{formatKoreanWon(requirement.annualTax)}</StepValue>
              </StepRow>
              <StepOperator aria-hidden>{COPY.ops.divideByYield(formatPercent(item.dividendYieldPercent))}</StepOperator>
              <StepRow $tone="result">
                <StepLabel>{COPY.steps.principal}</StepLabel>
                <StepValue $tone="result">{formatKoreanWon(requirement.requiredPrincipal)}</StepValue>
              </StepRow>
            </StepList>
            <BasisNote>
              {isKoreanListed ? COPY.taxBasisKorean(taxRateText) : COPY.taxBasis(taxRateText)}{' '}
              {item.yieldFreshness === 'snapshot' && asOf ? COPY.yieldBasisSnapshot(asOf) : COPY.yieldBasisPreset}
            </BasisNote>
          </StepsPanel>
        ) : null}
      </BreakdownTop>

      <InflationCompare item={item} inflationRate={inflationRate} onInflationChange={onInflationChange} />
    </BreakdownCard>
  );
}
