import type { SnowballReport } from '@/shared/lib/snowball';
import type { PdfReportChartImage } from '../../PdfReportDocument.types';

export type PdfAssumptionsPageProps = {
  report: SnowballReport;
  /** 파이 차트 — 없으면(null) 블록 자체를 생략한다. */
  allocationPie: PdfReportChartImage | null;
  title: string;
  themeVars: Record<string, string>;
};
