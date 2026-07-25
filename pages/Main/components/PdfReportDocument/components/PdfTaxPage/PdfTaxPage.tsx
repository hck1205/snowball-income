import {
  CAPITAL_GAINS_ANNUAL_DEDUCTION,
  FINANCIAL_INCOME_TAX_THRESHOLD,
  OVERSEAS_CAPITAL_GAINS_TAX_RATE
} from '@/shared/constants';
import { formatKRW } from '@/shared/utils';
// 부모 배럴(../../index.ts)을 경유하면 PdfReportDocument ↔ 하위 컴포넌트 순환이 된다 — 상대 경로로 직접 가져온다.
import {
  DisclaimerBox,
  Narrative,
  NoteText,
  Page,
  SectionTitle,
  StatGrid,
  StatLabel,
  StatTile,
  StatValue,
  WarningBox
} from '../../PdfReportDocument.styled';
import { PDF_REPORT_DISCLAIMER, buildTaxNarrative, formatPercentValue, formatSignedApproxKRW } from '../../PdfReportDocument.utils';
import { PdfPageFooter } from '../PdfPageFooter';
import type { PdfTaxPageProps } from './PdfTaxPage.types';

/** ── 5. 세금 · 면책 ────────────────────────────────────────────────── */
function PdfTaxPage({ report, title, themeVars, footerLabel }: PdfTaxPageProps) {
  const { composition, yieldOnCost, taxes } = report;

  return (
    <Page data-pdf-page="tax" style={themeVars}>
      <SectionTitle>최종 자산은 어디서 왔나</SectionTitle>
      <StatGrid>
        <StatTile>
          <StatLabel>내가 넣은 원금</StatLabel>
          <StatValue>{formatKRW(composition.contribution)}</StatValue>
        </StatTile>
        <StatTile>
          <StatLabel>재투자된 배당</StatLabel>
          <StatValue>{formatKRW(composition.reinvestedDividend)}</StatValue>
        </StatTile>
        <StatTile>
          <StatLabel>시세 평가이익</StatLabel>
          <StatValue tone={composition.marketGain >= 0 ? 'positive' : 'negative'}>
            {formatSignedApproxKRW(composition.marketGain)}
          </StatValue>
        </StatTile>
        <StatTile>
          <StatLabel>YoC(투입원금 대비 배당률)</StatLabel>
          <StatValue>
            {yieldOnCost.firstYearPercent === null || yieldOnCost.finalYearPercent === null
              ? '—'
              : `${formatPercentValue(yieldOnCost.firstYearPercent, 2)} → ${formatPercentValue(
                  yieldOnCost.finalYearPercent,
                  2
                )}`}
          </StatValue>
        </StatTile>
      </StatGrid>

      <SectionTitle>전량 매도한다면</SectionTitle>
      <StatGrid>
        <StatTile>
          <StatLabel>취득원가</StatLabel>
          <StatValue>{formatKRW(taxes.totalCostBasis)}</StatValue>
        </StatTile>
        <StatTile>
          <StatLabel>평가이익</StatLabel>
          <StatValue tone={taxes.unrealizedGain >= 0 ? 'positive' : 'negative'}>
            {formatSignedApproxKRW(taxes.unrealizedGain)}
          </StatValue>
        </StatTile>
        <StatTile>
          <StatLabel>전량 매도 시 예상 양도세</StatLabel>
          <StatValue>{formatKRW(taxes.estimatedCapitalGainsTax)}</StatValue>
        </StatTile>
        <StatTile>
          <StatLabel>세후 실현 가능 자산</StatLabel>
          <StatValue>{formatKRW(taxes.afterCapitalGainsTaxValue)}</StatValue>
        </StatTile>
      </StatGrid>

      <Narrative>{buildTaxNarrative(report)}</Narrative>
      <NoteText>
        {`해외주식 양도세 ${OVERSEAS_CAPITAL_GAINS_TAX_RATE}%, 기본공제 연 ${(
          CAPITAL_GAINS_ANNUAL_DEDUCTION / 10_000
        ).toLocaleString()}만원, 마지막 해에 전량 매도 가정. ` +
          '계속 보유하면 내지 않는 세금이라 위쪽 자산·누적 세금에는 반영되지 않았습니다.'}
      </NoteText>

      {/* 종합과세 경고는 실제로 기준을 넘는 연차가 있을 때만 — 없으면 박스 자체가 없다. */}
      {taxes.financialIncomeThresholdYear !== null ? (
        <WarningBox role="note">
          {`이 시나리오는 ${taxes.financialIncomeThresholdYear}년차에 세전 연 배당이 ${(
            FINANCIAL_INCOME_TAX_THRESHOLD / 10_000
          ).toLocaleString()}만원을 넘습니다. ` + '금융소득종합과세 대상이 되어 실제 세율이 입력한 값보다 높아질 수 있습니다.'}
        </WarningBox>
      ) : null}

      <DisclaimerBox>{PDF_REPORT_DISCLAIMER}</DisclaimerBox>
      <PdfPageFooter title={title} label={footerLabel} />
    </Page>
  );
}

export default PdfTaxPage;
