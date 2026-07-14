import { CHART_SERIES } from '@/shared/styles';

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
 * 연도별 시리즈 색. 값만 디자인 시스템 팔레트(`CHART_SERIES`)와 정렬했고 키/순서는 그대로다.
 *
 * 의미 부여: 자산 가치 = 브랜드 애저(주인공 지표), 누적 투자금 = 중립 슬레이트(기준선이라 눈에 덜 띄어야 한다),
 * 배당 3종 = 오렌지/그린/바이올렛으로 서로 구분.
 *
 * 대비·구분(ΔE) 검증은 `shared/styles/contrast.test.ts`가 팔레트 단위로 강제한다.
 */
export const YEARLY_SERIES_COLOR: Record<YearlySeriesKey, string> = {
  assetValue: CHART_SERIES[0],
  totalContribution: CHART_SERIES[7],
  monthlyDividend: CHART_SERIES[1],
  annualDividend: CHART_SERIES[2],
  cumulativeDividend: CHART_SERIES[4]
};
