import { CalculatorNote, CalculatorPanel, CalculatorPanelTitle } from '@/components/common';
import type { DividendTaxResult, PensionAgeBand } from '@/shared/lib/dividendTax';
import { formatKoreanWon } from '@/shared/utils';
import { DIVIDEND_TAX_COPY } from '../../copy';
import { SegmentedChoice } from '../SegmentedChoice';
import { Compare, CompareItem, CompareLabel, CompareValue, Highlight, PanelHead, ToggleChip } from './AccountComparePanel.styled';
import { buildAccountComparison } from './AccountComparePanel.utils';

const copy = DIVIDEND_TAX_COPY;
const PENSION_AGES: readonly PensionAgeBand[] = ['under70', 'from70', 'from80'];

export type AccountComparePanelProps = {
  readonly result: DividendTaxResult;
  /** 세전 배당 연액(원) — 비교 기준 문장. */
  readonly usAnnual: number;
  readonly isaSeomin: boolean;
  readonly onToggleIsaSeomin: () => void;
  readonly pensionAge: PensionAgeBand;
  readonly onPensionAgeChange: (band: PensionAgeBand) => void;
};

/**
 * 계좌별 세금 — 일반계좌 · ISA · 연금저축(IRP)(2026-11-13). 좁은 폭은 세로 3줄, mobileWide 이상 3열.
 * 일반계좌보다 싼 계좌가 있으면 강조하고, 연금계좌가 피하는 부담(건보료 증가 등)을 이름으로 짚는다.
 */
export default function AccountComparePanel({
  result,
  usAnnual,
  isaSeomin,
  onToggleIsaSeomin,
  pensionAge,
  onPensionAgeChange
}: AccountComparePanelProps) {
  const comparison = buildAccountComparison(result);
  return (
    <CalculatorPanel aria-labelledby="isa-title">
      <PanelHead>
        <CalculatorPanelTitle id="isa-title">{copy.results.isaHeading}</CalculatorPanelTitle>
        <ToggleChip type="button" active={isaSeomin} aria-pressed={isaSeomin} onClick={onToggleIsaSeomin}>
          {copy.inputs.isaSeomin}
        </ToggleChip>
      </PanelHead>
      <SegmentedChoice
        label={copy.inputs.pensionAge}
        options={PENSION_AGES.map((band) => ({ value: band, label: copy.inputs.pensionAgeOptions[band] }))}
        value={pensionAge}
        onChange={onPensionAgeChange}
      />
      <Compare>
        {comparison.rows.map((row) => (
          <CompareItem key={row.id} best={comparison.best?.id === row.id}>
            <CompareLabel>{row.label}</CompareLabel>
            <CompareValue>연 {formatKoreanWon(row.tax)}</CompareValue>
          </CompareItem>
        ))}
      </Compare>
      {comparison.best ? (
        <Highlight>
          {comparison.best.short}가 일반계좌보다 세금이 연 {formatKoreanWon(comparison.saving)} 적습니다.
        </Highlight>
      ) : null}
      {comparison.pensionAvoids.length > 0 ? (
        <Highlight>{copy.results.pensionAvoids(comparison.pensionAvoids.join(' · '))}</Highlight>
      ) : null}
      <CalculatorNote>
        세전 배당 연 {formatKoreanWon(usAnnual)} 기준. {copy.results.isaNote}
      </CalculatorNote>
      <CalculatorNote>{copy.results.pensionNote}</CalculatorNote>
      <CalculatorNote>{copy.results.foreignTaxNote}</CalculatorNote>
    </CalculatorPanel>
  );
}
