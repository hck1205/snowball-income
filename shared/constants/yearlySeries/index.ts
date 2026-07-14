export type YearlySeriesKey = 'totalContribution' | 'assetValue' | 'annualDividend' | 'monthlyDividend' | 'cumulativeDividend';

export const YEARLY_SERIES_ORDER: YearlySeriesKey[] = ['assetValue', 'totalContribution', 'monthlyDividend', 'annualDividend', 'cumulativeDividend'];

export const YEARLY_SERIES_LABEL: Record<YearlySeriesKey, string> = {
  totalContribution: '누적 투자금',
  assetValue: '자산 가치',
  annualDividend: '연 배당',
  monthlyDividend: '월 평균 배당',
  cumulativeDividend: '누적 배당'
};

/**
 * 연도별 시리즈 색. 값만 교체했고 키/순서는 그대로다.
 * (기존은 flat-UI 2014 계열 #c0392b / #f39c12 / #1e8449 조합이라 가장 낡아 보이던 부분)
 *
 * 의미 부여: 자산 가치 = 브랜드 블루(주인공 지표), 누적 투자금 = 중립 슬레이트(기준선),
 * 배당 3종 = 따뜻한 색/그린/바이올렛으로 구분.
 */
export const YEARLY_SERIES_COLOR: Record<YearlySeriesKey, string> = {
  assetValue: '#2f6f93',
  totalContribution: '#7a8a99',
  monthlyDividend: '#c26d22',
  annualDividend: '#48a06b',
  cumulativeDividend: '#8b6fc9'
};
