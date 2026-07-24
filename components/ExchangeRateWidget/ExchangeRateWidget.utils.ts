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

// 응답 파싱(`parseFxRate`)은 조회를 소유하는 상태 계층과 공유하므로 `@/shared/lib/fx` 에 있다.
// 여기에는 **표시 포맷**만 둔다.
