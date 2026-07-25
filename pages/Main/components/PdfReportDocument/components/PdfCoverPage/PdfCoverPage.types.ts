import type { SnowballReport } from '@/shared/lib/snowball';

export type PdfCoverPageProps = {
  report: SnowballReport;
  title: string;
  /** `formatGeneratedAt`로 이미 포맷된 생성 시각 문구. */
  generatedLabel: string;
  themeVars: Record<string, string>;
};
