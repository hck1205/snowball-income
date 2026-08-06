/**
 * epoch 초를 **UTC 달력값**으로 바꾸는 정수 연산 유틸. 플랫폼 날짜 API 를 타지 않는다.
 *
 * ## 🔴 왜 직접 세는가 — 1970년 이전이 실제로 깨진다
 * 야후 chart 의 배당 이벤트는 1962년까지 거슬러 올라간다(KO 실측 2026-08-04: 첫 이벤트
 * `{ amount: 0.001563, date: -238501800 }`). 이 **음수** 타임스탬프에서 플랫폼 날짜 변환은 실제로 죽는다 —
 * 이 데이터를 조사하는 과정에서 Windows 의 Python `time.gmtime(-238501800)` 이 OSError 로 실패하는 것을
 * 겪었다. Node 22 의 `new Date(-238501800 * 1000)` 은 규격대로 1962-07-10 을 내는 것을 확인했지만,
 * 그래도 여기서 쓰지 않는 이유가 둘 있다.
 *
 *  ① **로컬 타임존 게터 하나면 연도가 통째로 밀린다.** `getUTCFullYear()` 대신 `getFullYear()` 를 한 번만
 *     잘못 써도 12/31·1/1 지급이 옆 해로 넘어간다. 이 연도 값이 "5년 성장률"의 분자·분모를 고르므로
 *     한 해가 밀리면 성장률이 **조용히** 틀린다(에러가 나지 않는다).
 *  ② 같은 계산이 수집기(Node)·테스트(Node)·조사용 스크립트(Python)로 흩어져도 결과가 같아야 한다.
 *
 * 그래서 윤년 규칙만으로 직접 센다. 외부 의존성 0 · 타임존 0 · 음수 안전.
 */

const SECONDS_PER_DAY = 86_400;

const isLeapYear = (year: number): boolean => (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

const daysInYear = (year: number): number => (isLeapYear(year) ? 366 : 365);

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31] as const;

/**
 * epoch 초 → epoch 일. `Math.floor` 여야 음수에서 하루가 밀리지 않는다
 * (`-1초`는 1969-12-31 이지 1970-01-01 이 아니다 — `Math.trunc` 는 여기서 틀린다).
 */
export const epochSecondsToEpochDay = (seconds: number): number => Math.floor(seconds / SECONDS_PER_DAY);

type UtcDateParts = { year: number; month: number; day: number };

const epochDayToUtcParts = (epochDay: number): UtcDateParts => {
  let year = 1970;
  let day = epochDay;
  while (day < 0) {
    year -= 1;
    day += daysInYear(year);
  }
  for (;;) {
    const length = daysInYear(year);
    if (day < length) break;
    day -= length;
    year += 1;
  }
  let month = 0;
  for (;;) {
    const length = DAYS_IN_MONTH[month] + (month === 1 && isLeapYear(year) ? 1 : 0);
    if (day < length) break;
    day -= length;
    month += 1;
  }
  return { year, month: month + 1, day: day + 1 };
};

const assertFinite = (seconds: number): void => {
  if (!Number.isFinite(seconds)) throw new RangeError(`epoch 초가 유한수가 아니다: ${String(seconds)}`);
};

/** epoch 초 → UTC 연도. 1970년 이전(음수)도 안전하다. */
export const epochSecondsToUtcYear = (seconds: number): number => {
  assertFinite(seconds);
  return epochDayToUtcParts(epochSecondsToEpochDay(seconds)).year;
};

/** epoch 초 → `YYYY-MM-DD`(UTC). 신고 줄에 "언제 지급이었나"를 사람이 읽을 형태로 남길 때 쓴다. */
export const epochSecondsToUtcDate = (seconds: number): string => {
  assertFinite(seconds);
  const { year, month, day } = epochDayToUtcParts(epochSecondsToEpochDay(seconds));
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

/** 두 시각 사이의 **일 수**. 날짜 경계 기준이라 시:분:초 차이에 흔들리지 않는다. */
export const daysBetweenEpochSeconds = (laterSeconds: number, earlierSeconds: number): number => {
  assertFinite(laterSeconds);
  assertFinite(earlierSeconds);
  return epochSecondsToEpochDay(laterSeconds) - epochSecondsToEpochDay(earlierSeconds);
};
