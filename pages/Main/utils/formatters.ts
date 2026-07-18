import { formatApproxKRW, formatKRW } from '@/shared/utils';

/**
 * `formatApproxKRW`는 커뮤니티 시뮬 요약과 공유하기 위해 `shared/utils/format.ts`로 승격했다.
 * 기존 호출부(charts.ts, vite.config의 OG 예시 번들)가 이 모듈을 바라보므로 re-export로 보존한다.
 */
export { formatApproxKRW } from '@/shared/utils';

export const targetYearLabel = (year: number | undefined): string => (year ? `${year}년` : '미도달');

export const formatPercent = (value: number): string => `${(value * 100).toFixed(2)}%`;

export const formatResultAmount = (value: number, compact: boolean): string => (compact ? formatApproxKRW(value) : formatKRW(value));
