import type { PostInvestmentDividendProjectionRow } from '@/pages/Main/utils';

export type PostInvestmentProjectionPanelProps = {
  /** 성장률(연 %) 주석까지 포함한 완성 제목 — 계산은 부모(MainRightPanel)가 한다. */
  title: string;
  rows: PostInvestmentDividendProjectionRow[];
  hasData: boolean;
  emptyMessage: string;
  projectionYears: number;
  onProjectionYearsChange: (years: number) => void;
  /** false = 월배당 추정, true = 자산가치 추정. */
  isAssetView: boolean;
  onAssetViewChange: (isAssetView: boolean) => void;
  yAxisLabelFormatter: (value: number) => string;
  chartLabelSuffix: string;
};
