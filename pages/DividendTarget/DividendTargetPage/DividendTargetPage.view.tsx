import { Info, TriangleAlert } from 'lucide-react';
import { ICON } from '@/shared/styles';
import { RequirementBreakdown, TargetAmountPicker, TickerRequirementGrid } from '../components';
import { DIVIDEND_TARGET_COPY } from '../copy';
import { formatKoreanWon } from '../utils';
import type { DividendTargetViewProps } from './DividendTargetPage.types';
import {
  AssumptionBlock,
  AssumptionItem,
  AssumptionList,
  AssumptionTitle,
  FinalBody,
  FinalButton,
  FinalCard,
  FinalText,
  FinalTitle,
  NotAdvice,
  NotesCard,
  NotesTitle,
  PageStack,
  TaxNotice,
  TaxNoticeBody,
  TaxNoticeText,
  TaxNoticeTitle
} from './DividendTargetPage.styled';

const COPY = DIVIDEND_TARGET_COPY;
/* 크기·굵기는 공용 ICON 계단에서 — 굵기를 빠뜨리면 lucide 기본값 2 로 그려진다(iconConsistency 가드). */
const GLYPH_PROPS = { size: ICON.lg, strokeWidth: ICON.stroke, 'aria-hidden': true, focusable: false } as const;

export default function DividendTargetView({
  model,
  monthlyMan,
  selected,
  inflationRate,
  onMonthlyChange,
  onSelectTicker,
  onInflationChange,
  onSimulate
}: DividendTargetViewProps) {
  const preTax = selected.requirement?.annualPreTax ?? null;
  const warn = model.exceedsFinancialIncomeThreshold;

  return (
    <PageStack>
      <TargetAmountPicker monthlyMan={monthlyMan} onChange={onMonthlyChange} />

      <RequirementBreakdown
        item={selected}
        asOf={model.asOf}
        inflationRate={inflationRate}
        onInflationChange={onInflationChange}
        onSimulate={(ticker) => onSimulate(ticker, 'detail')}
      />

      <NotesCard aria-labelledby="dividend-target-notes-title">
        <NotesTitle id="dividend-target-notes-title">{COPY.notes.title}</NotesTitle>
        <TaxNotice $warn={warn}>
          {warn ? <TriangleAlert {...GLYPH_PROPS} /> : <Info {...GLYPH_PROPS} />}
          <TaxNoticeBody>
            <TaxNoticeTitle>{COPY.notes.financialIncomeTitle}</TaxNoticeTitle>
            <TaxNoticeText>
              {warn && preTax !== null ? COPY.notes.financialIncome(formatKoreanWon(preTax)) : COPY.notes.financialIncomeUnder}
            </TaxNoticeText>
          </TaxNoticeBody>
        </TaxNotice>
        <AssumptionBlock>
          <AssumptionTitle>{COPY.notes.assumptionsTitle}</AssumptionTitle>
          <AssumptionList>
            {COPY.notes.assumptions.map((assumption) => (
              <AssumptionItem key={assumption.label}>
                <dt>{assumption.label}</dt>
                <dd>{assumption.value}</dd>
              </AssumptionItem>
            ))}
          </AssumptionList>
        </AssumptionBlock>
      </NotesCard>

      <TickerRequirementGrid
        categories={model.categories}
        selectedTicker={selected.ticker}
        monthlyAfterTax={model.monthlyAfterTax}
        onSelect={onSelectTicker}
      />

      <FinalCard>
        <FinalText>
          <FinalTitle>{COPY.finalCta.title}</FinalTitle>
          <FinalBody>{COPY.finalCta.body}</FinalBody>
        </FinalText>
        <FinalButton type="button" onClick={() => onSimulate(selected.ticker, 'final')}>
          {COPY.finalCta.action}
        </FinalButton>
      </FinalCard>

      <NotAdvice>{COPY.notes.notAdvice}</NotAdvice>
    </PageStack>
  );
}
