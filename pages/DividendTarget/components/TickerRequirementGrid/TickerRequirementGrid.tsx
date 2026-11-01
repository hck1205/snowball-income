import type { CSSProperties } from 'react';
import { DIVIDEND_TARGET_COPY } from '../../copy';
import { DETAIL_REGION_ID, formatKoreanWon, formatPercent, formatSignedPercent, toneVars } from '../../utils';
import type { TickerRequirementGridProps } from './TickerRequirementGrid.types';
import {
  CardFacts,
  CardMetricLabel,
  CardName,
  CardPrincipal,
  CardRow,
  CardSymbol,
  CardTop,
  CategoryBlock,
  CategoryHead,
  CategoryLabel,
  CategorySummary,
  Fact,
  GridHeader,
  GridLede,
  GridRoot,
  GridTitle,
  PrincipalFill,
  PrincipalTrack,
  SelectedMark,
  TickerCard,
  TradeoffNote,
  VerdictFact
} from './TickerRequirementGrid.styled';

const COPY = DIVIDEND_TARGET_COPY.compare;
const INFLATION_COPY = DIVIDEND_TARGET_COPY.inflation;

/**
 * 네 묶음 × 세 종목. 카드를 누르면 위 상세가 그 종목으로 바뀐다.
 *
 * 🔴 **정렬하지 않는다.** 묶음 순서와 묶음 안 순서는 큐레이션이 정한 그대로다
 *    (`shared/lib/dividendTarget/dividendTargetTickers.ts` 머리말 — 배치가 곧 주장이다).
 *    필요 원금 오름차순으로 다시 세우면 맨 위가 추천처럼 읽힌다.
 */
export default function TickerRequirementGrid({
  categories,
  selectedTicker,
  monthlyAfterTax,
  onSelect
}: TickerRequirementGridProps) {
  /* 모든 카드가 공유하는 눈금 — 12 종 중 가장 큰 필요 원금. 막대 길이가 묶음을 넘어 비교되려면 하나여야 한다. */
  const maxPrincipal = Math.max(
    1,
    ...categories.flatMap((group) => group.tickers.map((item) => item.requirement?.requiredPrincipal ?? 0))
  );

  return (
    <GridRoot aria-labelledby="dividend-target-compare-title">
      <GridHeader>
        <GridTitle id="dividend-target-compare-title">{COPY.title}</GridTitle>
        <GridLede>{COPY.lede(formatKoreanWon(monthlyAfterTax))}</GridLede>
      </GridHeader>

      {categories.map(({ category, tickers }) => {
        return (
          <CategoryBlock key={category.id} style={toneVars(category.id)}>
            <CategoryHead>
              <CategoryLabel>{category.label}</CategoryLabel>
              <CategorySummary>{category.summary}</CategorySummary>
            </CategoryHead>
            <CardRow>
              {tickers.map((item) => {
                const principal = item.requirement?.requiredPrincipal ?? null;
                const selected = item.ticker === selectedTicker;
                const barStyle = {
                  '--bar': `${principal === null ? 0 : Math.min(100, (principal / maxPrincipal) * 100)}%`
                } as CSSProperties;

                return (
                  <li key={item.ticker}>
                    <TickerCard
                      type="button"
                      aria-pressed={selected}
                      aria-controls={DETAIL_REGION_ID}
                      onClick={() => onSelect(item.ticker)}
                    >
                      <CardTop>
                        <CardSymbol>{item.ticker}</CardSymbol>
                        {selected ? <SelectedMark>{COPY.selected}</SelectedMark> : null}
                      </CardTop>
                      <CardName>{item.name}</CardName>

                      <CardMetricLabel>{COPY.principalLabel}</CardMetricLabel>
                      <CardPrincipal>{principal === null ? '-' : formatKoreanWon(principal)}</CardPrincipal>
                      <PrincipalTrack aria-hidden>
                        <PrincipalFill style={barStyle} />
                      </PrincipalTrack>

                      <CardFacts>
                        <Fact>
                          {COPY.yieldLabel} <strong>{formatPercent(item.dividendYieldPercent)}</strong>
                        </Fact>
                        <Fact>
                          {COPY.growthLabel}{' '}
                          <strong>
                            {item.dividendCagrPercent === null
                              ? INFLATION_COPY.unknownValue
                              : formatSignedPercent(item.dividendCagrPercent)}
                          </strong>
                        </Fact>
                        {/* 자료 없음은 바로 앞 인상률 칸이 이미 말한다 — 판정 칩까지 "자료 없음"이면 같은 말이 두 번이다. */}
                        {item.inflation.verdict === 'unknown' ? null : (
                          <VerdictFact $verdict={item.inflation.verdict}>
                            {INFLATION_COPY.shortVerdict[item.inflation.verdict]}
                          </VerdictFact>
                        )}
                      </CardFacts>
                    </TickerCard>
                  </li>
                );
              })}
            </CardRow>
          </CategoryBlock>
        );
      })}

      <TradeoffNote>{COPY.tradeoffNote}</TradeoffNote>
    </GridRoot>
  );
}
