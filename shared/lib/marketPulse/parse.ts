import type { PulseSeriesPoint } from './marketPulse.types';

/**
 * 원자료 CSV 파싱 — **순수 함수**. 네트워크는 서버 핸들러가 담당한다.
 *
 * 두 기관이 서로 다른 모양을 준다. 각각의 함정을 여기 한 곳에 가둔다.
 */

/**
 * FRED 그래프 CSV.
 *
 *   observation_date,VIXCLS
 *   2026-08-05,15.81
 *   2026-08-06,.
 *
 * 🔴 **결측을 `.` 로 준다.** 휴장일·미발표가 전부 이 점 하나다. `Number('.')` 는 `NaN` 이지만
 *    `Number('')` 는 **0** 이라, 빈 문자열로 오해하고 처리하면 VIX 가 0 인 날이 생긴다 —
 *    그래프에 절벽이 그려지고 아무도 오류라고 생각하지 않는다. 숫자가 아니면 **행을 버린다.**
 * ⚠ 헤더 첫 칸 이름이 시리즈마다 다르다(`DATE`·`observation_date`). 이름으로 찾지 말고
 *   **위치**로 읽는다.
 */
export const parseFredCsv = (csv: string): PulseSeriesPoint[] => {
  const lines = csv.trim().split(/\r?\n/);
  const points: PulseSeriesPoint[] = [];

  for (let index = 1; index < lines.length; index += 1) {
    const [date, raw] = lines[index].split(',');
    if (!date || raw === undefined) continue;

    const value = Number(raw.trim());
    /* `.`(결측)·빈칸·문자 → 버린다. 0 으로 만들지 않는다. */
    if (!Number.isFinite(value) || raw.trim() === '') continue;

    points.push({ date: date.trim(), value });
  }

  return points;
};

/**
 * Cboe 지수 히스토리 CSV.
 *
 *   DATE,OPEN,HIGH,LOW,CLOSE
 *   08/07/2026,15.300000,15.360000,14.770000,14.900000
 *
 * 🔴 날짜가 **MM/DD/YYYY** 다. 그대로 `new Date()` 에 넣으면 로케일에 따라 달과 일이 바뀐다
 *    (8월 7일 ↔ 7월 8일). 문자열로 잘라 ISO 로 만든다 — 시간대도 타지 않는다.
 * ⚠ 파일이 오래된 앞부분에 빈 줄과 주석 줄을 섞어 두는 때가 있어, 다섯 칸이 아니면 버린다.
 */
export const parseCboeCsv = (csv: string): PulseSeriesPoint[] => {
  const lines = csv.trim().split(/\r?\n/);
  const points: PulseSeriesPoint[] = [];

  for (let index = 1; index < lines.length; index += 1) {
    const cells = lines[index].split(',');
    if (cells.length < 5) continue;

    const [month, day, year] = cells[0].trim().split('/');
    if (!month || !day || !year || year.length !== 4) continue;

    const close = Number(cells[4]);
    if (!Number.isFinite(close) || close <= 0) continue;

    points.push({ date: `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`, value: close });
  }

  return points;
};

/** 시계열의 마지막 점. 빈 배열이면 `null` — 0 을 돌려주지 않는다. */
export const latestOf = (points: PulseSeriesPoint[]): PulseSeriesPoint | null =>
  points.length === 0 ? null : points[points.length - 1];

/**
 * 최근 N개만 남긴다(그래프용).
 *
 * ⚠ 응답 크기를 줄이려는 것이기도 하다 — Cboe VIX 히스토리는 1990년부터라 470KB 다.
 *   그대로 브라우저에 보내면 계기판 한 장에 0.5MB 를 쓴다.
 */
export const tailOf = (points: PulseSeriesPoint[], count: number): PulseSeriesPoint[] =>
  count >= points.length ? points : points.slice(points.length - count);

/**
 * 단순 이동평균. 점이 모자라면 `null` — **있는 것만으로 평균을 내지 않는다**
 * (50일 평균이라 부르면서 12일로 계산한 값을 내보내는 것이 이 함수가 막는 일이다).
 */
export const movingAverage = (points: PulseSeriesPoint[], window: number): number | null => {
  if (points.length < window) return null;
  const slice = points.slice(points.length - window);
  return slice.reduce((sum, point) => sum + point.value, 0) / window;
};

/**
 * 값이 과거 분포의 몇 번째 백분위인가(0~100).
 *
 * 🔴 이 화면에서 백분위는 **"비싸다/싸다"의 대체어가 아니다.** "지난 N년 중 이 근처에 얼마나
 *    있었나"라는 사실 진술이다. 그래서 결과를 문장으로 옮길 때도 그 이상을 말하지 않는다.
 */
export const percentileOf = (points: PulseSeriesPoint[], value: number): number | null => {
  if (points.length === 0) return null;
  const below = points.filter((point) => point.value <= value).length;
  return (below / points.length) * 100;
};
