export type YearlySeriesKey = 'totalContribution' | 'assetValue' | 'annualDividend' | 'monthlyDividend' | 'cumulativeDividend';

export const YEARLY_SERIES_ORDER: YearlySeriesKey[] = ['assetValue', 'totalContribution', 'monthlyDividend', 'annualDividend', 'cumulativeDividend'];

export const YEARLY_SERIES_LABEL: Record<YearlySeriesKey, string> = {
  totalContribution: '누적 투자금',
  assetValue: '자산 가치',
  annualDividend: '연 배당',
  monthlyDividend: '월 평균 배당',
  cumulativeDividend: '누적 배당'
};

export const YEARLY_SERIES_COLOR: Record<YearlySeriesKey, string> = {
  totalContribution: '#0f4c81',
  assetValue: '#c0392b',
  annualDividend: '#1e8449',
  monthlyDividend: '#f39c12',
  cumulativeDividend: '#6c3483'
};
