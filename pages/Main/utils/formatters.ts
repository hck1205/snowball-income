import type { DisplayCurrency } from '@/shared/constants';
import { formatApproxKRW, formatApproxUSD, formatKRW, formatUSD } from '@/shared/utils';

/**
 * `formatApproxKRW`는 커뮤니티 시뮬 요약과 공유하기 위해 `shared/utils/format.ts`로 승격했다.
 * 기존 호출부(charts.ts, vite.config의 OG 예시 번들)가 이 모듈을 바라보므로 re-export로 보존한다.
 */
export { formatApproxKRW } from '@/shared/utils';

export const targetYearLabel = (year: number | undefined): string => (year ? `${year}년` : '미도달');

export const formatPercent = (value: number): string => `${(value * 100).toFixed(2)}%`;

export const formatResultAmount = (value: number, compact: boolean): string => (compact ? formatApproxKRW(value) : formatKRW(value));

/** 결과 표시용 금액 포맷터의 형태 — 원화 기준 값과 "간략 표기 여부"를 받는다. */
export type ResultAmountFormatter = (value: number, compact: boolean) => string;

/**
 * 표시 통화에 맞는 금액 포맷터를 만든다. **입력은 언제나 원화 값**이고, 달러 모드일 때만
 * 표시 직전에 한 번 나눈다(환산 지점을 여기 하나로 모아 이중 반올림을 막는다).
 *
 * `rate` 가 없으면 원화 포맷터를 그대로 돌려주므로 `$NaN` 이 나올 경로가 없다
 * (1차 방어선은 상태 계층의 effective/preferred 분리, 여기가 2차 방어선).
 */
export const createResultAmountFormatter = (currency: DisplayCurrency, rate: number | null): ResultAmountFormatter =>
  currency === 'USD' && rate
    ? (value, compact) => (compact ? formatApproxUSD(value / rate) : formatUSD(value / rate))
    : formatResultAmount;

/** 차트 축·툴팁용 정밀 포맷터(간략 여부가 없는 자리). */
export const createChartValueFormatter = (currency: DisplayCurrency, rate: number | null): ((value: number) => string) =>
  currency === 'USD' && rate ? (value) => formatUSD(value / rate) : formatKRW;

/** 차트 안 축약 라벨(파이 중앙 월배당 등)용 간략 포맷터. */
export const createChartCompactFormatter = (currency: DisplayCurrency, rate: number | null): ((value: number) => string) =>
  currency === 'USD' && rate ? (value) => formatApproxUSD(value / rate) : formatApproxKRW;
