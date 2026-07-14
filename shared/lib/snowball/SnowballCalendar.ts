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

/**
 * `YYYY-MM-DD` 문자열을 로컬 타임존 기준 Date 로 변환한다.
 *
 * 알려진 이슈(의도적으로 유지): 파싱에 실패하면 `new Date()`(현재 시각)로 폴백하기 때문에
 * 이 함수는 잘못된 입력에 대해 순수하지 않다. 수정은 별도 승인 후 진행한다.
 */
export const toStartDate = (value: string): Date => {
  const [yearText, monthText, dayText] = value.split('-');
  const year = Number(yearText);
  const monthIndex = Number(monthText) - 1;
  const day = Number(dayText);
  const date = new Date(year, monthIndex, day);

  if (
    !Number.isFinite(year) ||
    !Number.isFinite(monthIndex) ||
    !Number.isFinite(day) ||
    date.getFullYear() !== year ||
    date.getMonth() !== monthIndex ||
    date.getDate() !== day
  ) {
    return new Date();
  }

  return date;
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
