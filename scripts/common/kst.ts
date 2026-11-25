/**
 * 한국시간(KST, UTC+9) 날짜 — 스크립트 공용(2026-11-25 정리: aiReporter · gaReport 에 같은 계산이 세 벌 있었다).
 *
 * GitHub Actions 러너는 UTC 다. 워크플로가 `TZ: Asia/Seoul` 을 걸어도 스크립트를 로컬에서 돌리면 PC 시간대가
 * 섞이므로, 시간대에 기대지 않고 **9시간을 더한 UTC 필드**를 한국 벽시계로 읽는다.
 */
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

/** `now` 를 9시간 민 Date — getUTC* 필드가 곧 한국 벽시계 값이다. */
export const toKstWallClock = (now: Date = new Date()): Date => new Date(now.getTime() + KST_OFFSET_MS);

/** 오늘(한국) `YYYY-MM-DD`. */
export const kstIsoDate = (now: Date = new Date()): string => toKstWallClock(now).toISOString().slice(0, 10);

/** 오늘(한국) 자정을 **로컬 Date**(연·월·일)로 — 달력 계산(`new Date(y, m, d)` 꼴)에 넘길 때. */
export const kstToday = (now: Date = new Date()): Date => {
  const kst = toKstWallClock(now);
  return new Date(kst.getUTCFullYear(), kst.getUTCMonth(), kst.getUTCDate());
};

/** 지금이 한국시간 월요일인가. */
export const isKstMonday = (now: Date = new Date()): boolean => toKstWallClock(now).getUTCDay() === 1;
