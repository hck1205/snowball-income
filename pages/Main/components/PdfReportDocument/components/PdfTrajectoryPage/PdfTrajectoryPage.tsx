// 부모 배럴(../../index.ts)을 경유하면 PdfReportDocument ↔ 하위 컴포넌트 순환이 된다 — 상대 경로로 직접 가져온다.
import { Caption, ChartImage, Narrative, NoteText, Page, SectionTitle } from '../../PdfReportDocument.styled';
import {
  PDF_REPORT_MONTHLY_NOTE,
  buildAssetGrowthNarrative,
  buildCalendarNarrative,
  buildDividendNarrative,
  buildMonthlyCaption,
  buildMonthlyGrowthNarrative
} from '../../PdfReportDocument.utils';
import { PdfPageFooter } from '../PdfPageFooter';
import type { PdfTrajectoryPageProps } from './PdfTrajectoryPage.types';

/** ── 3. 자산·배당의 궤적 ───────────────────────────────────────────── */
function PdfTrajectoryPage({ report, yearlyTrend, monthlyDividend, title, themeVars }: PdfTrajectoryPageProps) {
  const assetGrowthNarrative = buildAssetGrowthNarrative(report);
  const monthlyGrowthNarrative = buildMonthlyGrowthNarrative(report);
  const calendarNarrative = buildCalendarNarrative(report);

  return (
    <Page data-pdf-page="trajectory" style={themeVars}>
      <SectionTitle>자산과 배당은 이렇게 자랍니다</SectionTitle>
      {yearlyTrend ? <ChartImage src={yearlyTrend.src} alt={yearlyTrend.alt} /> : null}

      {assetGrowthNarrative ? <Narrative>{assetGrowthNarrative}</Narrative> : null}
      <Narrative>{buildDividendNarrative(report)}</Narrative>
      {monthlyGrowthNarrative ? <Narrative>{monthlyGrowthNarrative}</Narrative> : null}

      <NoteText>{PDF_REPORT_MONTHLY_NOTE}</NoteText>
      <Caption>{buildMonthlyCaption(report.finalYearCalendar)}</Caption>
      {monthlyDividend ? <ChartImage src={monthlyDividend.src} alt={monthlyDividend.alt} /> : null}
      {calendarNarrative ? <Narrative>{calendarNarrative}</Narrative> : null}
      <PdfPageFooter title={title} label="3" />
    </Page>
  );
}

export default PdfTrajectoryPage;
