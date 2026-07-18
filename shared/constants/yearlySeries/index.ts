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
 * 연도별 시리즈 → 차트 시리즈 팔레트 인덱스.
 *
 * 의미 부여: 자산 가치 = 시리즈 0(각 프리셋의 주인공 색), 누적 투자금 = 슬레이트(기준선이라
 * 눈에 덜 띄어야 한다), 배당 3종 = 오렌지/그린(또는 프리셋 대체색)/바이올렛으로 서로 구분.
 * 실제 색은 프리셋이 정한다 — `getYearlySeriesColor(getChartTheme().series, key)`로 해석한다.
 *
 * 대비·구분(ΔE) 검증은 `shared/styles/contrast.test.ts`가 프리셋 단위로 강제한다.
 */
export const YEARLY_SERIES_INDEX: Record<YearlySeriesKey, number> = {
  assetValue: 0,
  totalContribution: 7,
  monthlyDividend: 1,
  annualDividend: 2,
  cumulativeDividend: 4
};

/** 현재 프리셋의 시리즈 세트(`getChartTheme().series`)에서 연도별 시리즈 색을 해석한다. */
export const getYearlySeriesColor = (series: readonly string[], key: YearlySeriesKey): string =>
  series[YEARLY_SERIES_INDEX[key]];

/**
 * @deprecated aurora 프리셋 고정 hex — 프리셋 전환을 따라가지 **않는다**.
 * `getYearlySeriesColor(getChartTheme().series, key)`를 쓴다.
 */
export const YEARLY_SERIES_COLOR: Record<YearlySeriesKey, string> = {
  assetValue: CHART_SERIES[YEARLY_SERIES_INDEX.assetValue],
  totalContribution: CHART_SERIES[YEARLY_SERIES_INDEX.totalContribution],
  monthlyDividend: CHART_SERIES[YEARLY_SERIES_INDEX.monthlyDividend],
  annualDividend: CHART_SERIES[YEARLY_SERIES_INDEX.annualDividend],
  cumulativeDividend: CHART_SERIES[YEARLY_SERIES_INDEX.cumulativeDividend]
};
