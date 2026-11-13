import { CalculatorNote } from '@/components/common';
import type { DividendTaxResult } from '@/shared/lib/dividendTax';
import { BigValue, Eyebrow, ResultCard, ResultGrid, StatusBadge } from './TaxResultCards.styled';
import { buildResultCards } from './TaxResultCards.utils';

/**
 * 결과 카드 3장 — 원천징수 뒤 배당 · 금융소득종합과세 · 건강보험. 모두 같은 해부(작은 제목 → 큰 값 → 상태 배지 → 설명)이고,
 * 상태는 바탕색이 아니라 배지가 말한다. 데스크톱(≥ headerStack)에서만 3열, 그 아래는 세로로 쌓는다.
 */
export default function TaxResultCards({ result }: { readonly result: DividendTaxResult }) {
  return (
    <ResultGrid aria-live="polite">
      {buildResultCards(result).map((card) => (
        <ResultCard key={card.eyebrow}>
          <Eyebrow>{card.eyebrow}</Eyebrow>
          <BigValue>{card.value}</BigValue>
          <StatusBadge tone={card.tone}>{card.badge}</StatusBadge>
          <CalculatorNote>{card.note}</CalculatorNote>
        </ResultCard>
      ))}
    </ResultGrid>
  );
}
