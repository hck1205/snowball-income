/**
 * 차트 시리즈 — 시맨틱 토큰 승격 (chart-series-0..7)
 *
 * 캔버스는 테마별 색 교체가 안 되므로 프리셋마다 **한 세트가 light/dark 양쪽**에서
 * 3:1(WCAG 1.4.11)을 만족해야 한다 — 그래서 light/dark 맵에 같은 값이 들어간다.
 * 세트 내 모든 쌍 ΔE ≥ 20 (contrast.test.ts가 강제).
 */

import type { ThemeTokens } from '../semantic';

export type ChartSeries = readonly [string, string, string, string, string, string, string, string];

export const chartSeriesTokens = (series: ChartSeries): ThemeTokens =>
  Object.fromEntries(series.map((hex, index) => [`chart-series-${index}`, hex] as const));
