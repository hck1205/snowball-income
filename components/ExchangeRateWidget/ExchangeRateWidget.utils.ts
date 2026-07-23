import type { FxRate } from './ExchangeRateWidget.types';

/** 원 단위 정수 + ko-KR 콤마. 예: `1478.49` → `"1,478"`. */
export const formatKrwRate = (rate: number): string => Math.round(rate).toLocaleString('ko-KR');

/**
 * as-of ISO → `"YYYY-MM-DD"`.
 *
 * ISO 문자열의 **날짜부만 잘라** 쓴다(`new Date()` 로 재파싱하면 사용자 로컬 타임존에서 하루 밀릴 수
 * 있어, 소스가 준 달력 날짜를 그대로 보존한다). 형식이 어긋나면 Date 로 한 번 더 시도하고, 그래도 안 되면
 * 빈 문자열(라벨을 숨긴다 — 틀린 날짜보다 없는 편이 낫다).
 */
export const formatAsOfDate = (asOf: string): string => {
  const head = asOf.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(head)) return head;
  const parsed = new Date(asOf);
  return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString().slice(0, 10);
};

/**
 * 신뢰할 수 없는 `/api/fx` 응답을 `FxRate` 로 정규화한다. 형태가 어긋나면 `null`(가짜 값을 지어내지 않는다).
 * `rate` 는 유한한 양수여야 하고 `asOf` 는 비어 있지 않은 문자열이어야 한다.
 */
export const parseFxRate = (data: unknown): FxRate | null => {
  if (!data || typeof data !== 'object') return null;
  const record = data as Record<string, unknown>;

  const rate = record.rate;
  const asOf = record.asOf;
  if (typeof rate !== 'number' || !Number.isFinite(rate) || rate <= 0) return null;
  if (typeof asOf !== 'string' || asOf.length === 0) return null;

  return { rate, base: 'USD', quote: 'KRW', asOf };
};
