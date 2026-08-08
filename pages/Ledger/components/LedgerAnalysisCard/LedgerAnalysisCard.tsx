import { Card } from '@/components/common';
import { LEDGER_COPY } from '../../copy';
import type { AnalysisBar } from '../../utils';
import type { LedgerAnalysisCardProps } from './LedgerAnalysisCard.types';
import {
  BarFill,
  BarHead,
  BarLabel,
  BarList,
  BarRow,
  BarTrack,
  BarValue,
  EmptyNote,
  Section,
  SectionHint,
  SectionTitle,
  SplitItem,
  SplitLabel,
  SplitRow,
  SplitValue,
  SrOnly,
  TrendFlows,
  TrendHead,
  TrendList,
  TrendMonth,
  TrendRate,
  TrendRow
} from './LedgerAnalysisCard.styled';

const copy = LEDGER_COPY;

/**
 * 막대 한 줄. 이름·값이 **먼저** 오고 막대는 뒤따르는 보조다.
 *
 * 🔴 막대는 `aria-hidden` — 뜻은 `srText` 한 문장이 진다. 막대까지 읽히면 같은 사실이 두 번 나온다.
 */
const renderBar = (bar: AnalysisBar) => (
  <BarRow key={bar.id}>
    <BarHead>
      <BarLabel title={bar.label}>{bar.label}</BarLabel>
      <BarValue>{bar.valueText}</BarValue>
    </BarHead>
    <BarTrack aria-hidden>
      <BarFill style={{ width: `${Math.round(bar.ratio * 100)}%` }} />
    </BarTrack>
    {/* 접근성 트리에 오르는 유일한 서술. 화면에는 위 두 값이 이미 보인다. */}
    <SrOnly>{bar.srText}</SrOnly>
  </BarRow>
);

/**
 * **이 달 살펴보기** — 고정비·주체·많이 쓴 항목 + 최근 흐름.
 *
 * 🔴 **월 요약 카드의 형제**다(`Card` 안 `Card` 금지 · 주역 카드는 화면당 1개). 여기 숫자는
 * 요약 3숫자를 다시 말하지 않는다 — 요약은 "얼마인가", 이 카드는 "어디에 몰렸는가"다.
 * 🔴 **시트에 쓰지 않는다.** 읽은 것을 접어 보여 줄 뿐이고, 이 카드에는 쓰기 액션이 없다.
 * 🔴 **손익색 금지 · 색 단독 채널 금지.** 막대는 전부 같은 색이고 길이로만 크기를 말한다.
 *    옆에 언제나 숫자가 선다.
 *
 * ⚠ 구획마다 **기준 기간이 다르다.** 고정비·주체·상위 항목은 보고 있는 달이고, 최근 흐름은 전체
 *   기간의 마지막 여섯 달이다. 서로 다른 질문이라 같은 기간으로 묶으면 한쪽이 쓸모없어진다 —
 *   그래서 구획마다 도움말이 기간을 밝힌다.
 */
export default function LedgerAnalysisCard({ model, monthLabel }: LedgerAnalysisCardProps) {
  return (
    <Card tone="sunken" title={copy.analysis.title} subtitle={copy.analysis.subtitle}>
      {model.isEmpty ? <EmptyNote>{copy.analysis.empty}</EmptyNote> : null}

      {model.fixity ? (
        <Section aria-label={copy.analysis.fixityHeading}>
          <SectionTitle>{copy.analysis.fixityHeading}</SectionTitle>
          <SectionHint>{copy.analysis.fixityHint}</SectionHint>
          <SplitRow>
            <SplitItem>
              <SplitLabel>{copy.analysis.fixedLabel}</SplitLabel>
              <SplitValue>{model.fixity.fixedText}</SplitValue>
            </SplitItem>
            <SplitItem>
              <SplitLabel>{copy.analysis.variableLabel}</SplitLabel>
              <SplitValue>{model.fixity.variableText}</SplitValue>
            </SplitItem>
          </SplitRow>
          {/* 비중은 막대가 아니라 **문장**이 말한다 — 두 숫자가 이미 위에 있어 막대는 중복이다. */}
          <SectionHint>{model.fixity.fixedPercentText}</SectionHint>
        </Section>
      ) : null}

      {model.topBars.length > 0 ? (
        <Section aria-label={copy.analysis.topHeading}>
          <SectionTitle>{copy.analysis.topHeading}</SectionTitle>
          <SectionHint>
            {monthLabel} · {copy.analysis.topHint}
          </SectionHint>
          <BarList>{model.topBars.map(renderBar)}</BarList>
        </Section>
      ) : null}

      {/* 🔴 1인 가구에는 이 구획이 아예 없다 — `공동 100%` 한 줄은 정보가 아니라 소음이다. */}
      {model.payer ? (
        <Section aria-label={copy.analysis.payerHeading}>
          <SectionTitle>{copy.analysis.payerHeading}</SectionTitle>
          <SectionHint>
            {monthLabel} · {copy.analysis.payerHint}
          </SectionHint>
          <BarList>{model.payer.bars.map(renderBar)}</BarList>
        </Section>
      ) : null}

      {model.trend.length > 0 ? (
        <Section aria-label={copy.analysis.trendHeading}>
          <SectionTitle>{copy.analysis.trendHeading}</SectionTitle>
          <SectionHint>{copy.analysis.trendHint}</SectionHint>
          <TrendList>
            {model.trend.map((point) => (
              <TrendRow key={point.monthKey}>
                <TrendHead>
                  <TrendMonth>{point.monthLabel}</TrendMonth>
                  {/* 🔴 수입이 없는 달은 0% 가 아니라 "잴 수 없다"고 말한다. 다른 사실이다. */}
                  <TrendRate>{point.savingRateText ?? copy.analysis.savingRateUnknown}</TrendRate>
                </TrendHead>
                <TrendFlows>
                  <span>
                    {copy.analysis.trendIncome} {point.incomeText}
                  </span>
                  <span>
                    {copy.analysis.trendExpense} {point.expenseText}
                  </span>
                </TrendFlows>
                {point.savingRatio === null ? null : (
                  <BarTrack aria-hidden>
                    <BarFill style={{ width: `${Math.round(point.savingRatio * 100)}%` }} />
                  </BarTrack>
                )}
              </TrendRow>
            ))}
          </TrendList>
        </Section>
      ) : null}
    </Card>
  );
}
