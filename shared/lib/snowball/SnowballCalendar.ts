/**
 * 시뮬레이션 달력 계산.
 *
 * 핵심 개념: `simulationMonth` 는 달력월(1~12월)이 아니라 **투자 시작 후 N개월째**(1..12)다.
 * 예) 3월에 시작한 semiannual 종목의 6번째 시뮬레이션 월 = 달력상 8월.
 */

export const getDaysInMonth = (year: number, monthIndex: number): number => new Date(year, monthIndex + 1, 0).getDate();

/**
 * 말일 클램프: 1/31 + 1개월 = 2/28 (2/31 로 넘치지 않는다).
 */
export const addMonths = (baseDate: Date, monthsToAdd: number): Date => {
  const targetYear = baseDate.getFullYear();
  const targetMonthIndex = baseDate.getMonth() + monthsToAdd;
  const anchor = new Date(targetYear, targetMonthIndex, 1);
  const nextDay = Math.min(baseDate.getDate(), getDaysInMonth(anchor.getFullYear(), anchor.getMonth()));

  return new Date(anchor.getFullYear(), anchor.getMonth(), nextDay);
};

const DATE_INPUT_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * `YYYY-MM-DD` 문자열을 로컬 타임존 기준 Date 로 변환한다.
 * **달력상 실재하지 않는 날짜(`2026-02-31`, `2026-13-01`, 윤년 아닌 해의 `02-29`)면 `null`.**
 *
 * 예전에는 파싱 실패 시 조용히 `new Date()`(오늘)로 폴백했다. 그 탓에 `runSimulation` 이
 * 순수 함수가 아니게 되어 같은 입력이 **실행 날짜에 따라 다른 결과**를 냈다.
 * 이제 폴백하지 않는다 — 호출부가 명시적으로 처리한다.
 */
export const parseStartDate = (value: string): Date | null => {
  if (!DATE_INPUT_PATTERN.test(value)) return null;

  const [yearText, monthText, dayText] = value.split('-');
  const year = Number(yearText);
  const monthIndex = Number(monthText) - 1;
  const day = Number(dayText);
  const date = new Date(year, monthIndex, day);

  // JS Date 는 넘치는 날짜를 다음 달로 굴린다 (2026-02-31 → 2026-03-03).
  // 되돌려 읽어 값이 그대로인지 확인하면 실재하는 날짜인지 알 수 있다.
  if (date.getFullYear() !== year || date.getMonth() !== monthIndex || date.getDate() !== day) {
    return null;
  }

  return date;
};

/** 폼/영속 계층의 날짜 검증에 쓰는 술어. 형식 + 달력 유효성을 모두 본다. */
export const isCalendarDateInput = (value: string): boolean => parseStartDate(value) !== null;

/**
 * 검증을 이미 통과한 날짜 문자열을 Date 로 바꾼다.
 *
 * 여기 도달했는데 무효하다면 상위 검증(zod / sanitize)이 뚫린 것이므로 던진다.
 * 조용한 폴백으로 잘못된 결과를 그럴듯하게 보여주는 것보다 낫다.
 */
export const toStartDate = (value: string): Date => {
  const parsed = parseStartDate(value);
  if (!parsed) {
    throw new Error(`유효하지 않은 투자 시작 날짜입니다: ${value}`);
  }

  return parsed;
};

export type MonthContext = {
  /** 1부터 시작하는 시뮬레이션 경과 월 수 */
  monthIndex: number;
  /** monthIndex - 1 */
  elapsedMonths: number;
  /** 시작 시점부터 완료된 연 수 (라벨용) */
  elapsedYears: number;
  /** 투자 시작 후 N개월째 (1..12) — 지급월 판정에 사용 */
  simulationMonth: number;
  /** 연간 결과 행에 붙는 연도 라벨 (시작 연도 + elapsedYears) */
  simulationYearLabel: number;
  /** 달력 연도 */
  calendarYear: number;
  /** 달력 월 (1..12) */
  calendarMonth: number;
  /** floor(elapsedMonths / 12) — annualStep 성장 지수. 첫 12개월은 0 (아직 한 해를 못 채웠다). */
  completedYears: number;
  /** monthIndex / 12 — monthlySmooth 성장 지수 */
  elapsedYearFraction: number;
};

export const buildMonthContext = (startDate: Date, monthIndex: number): MonthContext => {
  const elapsedMonths = monthIndex - 1;
  const elapsedYears = Math.floor(elapsedMonths / 12);
  const simulationMonth = (elapsedMonths % 12) + 1;
  const simulationYearLabel = startDate.getFullYear() + elapsedYears;
  const calendarDate = addMonths(startDate, elapsedMonths);

  return {
    monthIndex,
    elapsedMonths,
    elapsedYears,
    simulationMonth,
    simulationYearLabel,
    calendarYear: calendarDate.getFullYear(),
    calendarMonth: calendarDate.getMonth() + 1,
    // monthIndex 는 1-based 다. floor(monthIndex / 12) 를 쓰면 12개월째(= 아직 1년차)에 이미 1이 되어
    // DPS 가 한 해 일찍 계단 상승했다. 완료된 연 수는 elapsedYears 와 같은 정의여야 한다.
    completedYears: elapsedYears,
    elapsedYearFraction: monthIndex / 12
  };
};
