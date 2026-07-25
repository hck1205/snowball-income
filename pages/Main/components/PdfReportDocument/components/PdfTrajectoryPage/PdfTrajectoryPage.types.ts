import type { SnowballReport } from '@/shared/lib/snowball';
import type { PdfReportChartImage } from '../../PdfReportDocument.types';

export type PdfTrajectoryPageProps = {
  report: SnowballReport;
  yearlyTrend: PdfReportChartImage | null;
  monthlyDividend: PdfReportChartImage | null;
  title: string;
  themeVars: Record<string, string>;
};
