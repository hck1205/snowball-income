import { CHART_SERIES } from '@/shared/styles';

export * from './copy';

/**
 * 포트폴리오 비중 차트/범례 색.
 *
 * 팔레트 프리셋 도입 후 색 공급원이 갈렸다:
 *  - 캔버스(파이 조각, 실지급 배당 스택 바): `getChartTheme().series` — 옵션 빌드 시점에 해석.
 *  - DOM(범례 점): `CHART_SERIES_VARS` (`var(--sb-chart-series-N)`) — 프리셋 전환을 자동 추종.
 * 인덱스 규칙(티커 순서 % 8)은 양쪽이 동일해야 범례와 조각 색이 맞는다.
 */

/**
 * @deprecated aurora 프리셋 고정 hex — 프리셋 전환을 따라가지 **않는다**.
 * 캔버스는 `getChartTheme().series[index % 8]`, DOM은 `CHART_SERIES_VARS[index % 8]`를 쓴다.
 */
export const ALLOCATION_COLORS: string[] = [...CHART_SERIES];
