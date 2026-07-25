import type { SnowballReport } from '@/shared/lib/snowball';

export type PdfTaxPageProps = {
  report: SnowballReport;
  title: string;
  themeVars: Record<string, string>;
  /** `4 + yearlyPages.length` — 연도별 페이지 수에 따라 달라지므로 부모가 계산해 넘긴다. */
  footerLabel: string;
};
