import {
  buildAgendaDays,
  buildExpectedPayouts,
  buildMonthViewModel,
  formatCalendarDate,
  getCalendarMonthOf,
  getDaysInMonth,
  getExpectedPayoutDay,
  isSameCalendarMonth,
  shiftCalendarMonth
} from '@/pages/DividendCalendar/utils';
import type { CalendarTickerEntry } from '@/pages/DividendCalendar/utils';

/**
 * v2 월간 그리드의 순수 계산. v1 파일(calendarSchedule/ShareUrl/Storage)의 계약은 건드리지 않는다.
 *
 * 날짜가 걸린 계산이라 **오늘을 주입**해 검증한다 — 유틸이 내부에서 `new Date()` 를 부르면
 * 이 스위트가 매달 저절로 깨진다.
 */

const entry = (
  ticker: string,
  payoutMonths: number[],
  source: 'pay' | 'ex' = 'pay'
): CalendarTickerEntry => ({
  ticker,
  name: `${ticker} 한글명`,
  hasSchedule: true,
  payoutMonths,
  source
});

/** 지급월 데이터 자체가 없는 종목(19종 부류). */
const emptyEntry = (ticker: string): CalendarTickerEntry => ({
  ticker,
  name: `${ticker} 한글명`,
  hasSchedule: false
});

describe('월 이동 · 날짜 포맷', () => {
  it('연 경계를 자동으로 넘는다', () => {
    expect(shiftCalendarMonth({ year: 2026, month: 12 }, 1)).toEqual({ year: 2027, month: 1 });
    expect(shiftCalendarMonth({ year: 2026, month: 1 }, -1)).toEqual({ year: 2025, month: 12 });
    expect(shiftCalendarMonth({ year: 2026, month: 7 }, 0)).toEqual({ year: 2026, month: 7 });
    expect(shiftCalendarMonth({ year: 2026, month: 3 }, -14)).toEqual({ year: 2025, month: 1 });
  });

  it('로컬 기준으로 날짜 문자열을 만든다 (UTC 변환 금지 계약)', () => {
    expect(formatCalendarDate(2026, 7, 1)).toBe('2026-07-01');
    expect(formatCalendarDate(2026, 12, 25)).toBe('2026-12-25');
  });

  it('KST 자정에도 오늘이 하루 밀리지 않는다', () => {
    // 로컬 2026-07-25 00:10. toISOString() 을 썼다면 UTC 기준 07-24 로 밀린다.
    const today = new Date(2026, 6, 25, 0, 10);
    expect(getCalendarMonthOf(today)).toEqual({ year: 2026, month: 7 });

    const viewModel = buildMonthViewModel({
      year: 2026,
      month: 7,
      today,
      selected: [],
      entries: [],
      resolveDay: () => null
    });
    const todayCells = viewModel.weeks.flat().filter((cell) => cell.isToday);

    expect(todayCells).toHaveLength(1);
    expect(todayCells[0].date).toBe('2026-07-25');
  });

  it('윤년 2월의 일수를 로컬 기준으로 센다', () => {
    expect(getDaysInMonth(2024, 2)).toBe(29);
    expect(getDaysInMonth(2026, 2)).toBe(28);
    expect(getDaysInMonth(2026, 7)).toBe(31);
  });

  it('같은 달인지 비교한다', () => {
    expect(isSameCalendarMonth({ year: 2026, month: 7 }, { year: 2026, month: 7 })).toBe(true);
    expect(isSameCalendarMonth({ year: 2026, month: 7 }, { year: 2025, month: 7 })).toBe(false);
  });
});

describe('예상 지급일 해석', () => {
  it('스냅샷에 일자가 있는 종목만 날짜를 준다', () => {
    // KO = {4:1, 7:2, 10:2, 12:17} (실데이터, 2026-07-25 스냅샷)
    expect(getExpectedPayoutDay('KO', 2026, 7)).toBe(2);
    expect(getExpectedPayoutDay('KO', 2026, 12)).toBe(17);
    // KO 는 8월에 지급하지 않는다 → 키 없음 → null
    expect(getExpectedPayoutDay('KO', 2026, 8)).toBeNull();
    // SCHD 는 payoutMonthsSource='ex' 라 일자 자체가 없다
    expect(getExpectedPayoutDay('SCHD', 2026, 9)).toBeNull();
    expect(getExpectedPayoutDay('NOT_A_TICKER', 2026, 7)).toBeNull();
  });

  it('월 범위를 벗어난 입력은 null', () => {
    expect(getExpectedPayoutDay('KO', 2026, 0)).toBeNull();
    expect(getExpectedPayoutDay('KO', 2026, 13)).toBeNull();
  });
});

describe('buildExpectedPayouts', () => {
  const entries = [entry('ABBV', [2, 5, 8, 11]), entry('SCHD', [3, 6, 9, 12], 'ex'), emptyEntry('QQQ')];

  it('그 달에 지급하는 선택 종목만, 티커 오름차순으로 모은다', () => {
    const payouts = buildExpectedPayouts(entries, ['SCHD', 'ABBV', 'QQQ'], 2026, 2, () => 14);

    expect(payouts.map((payout) => payout.ticker)).toEqual(['ABBV']);
    expect(payouts[0]).toMatchObject({ source: 'pay', day: 14 });
  });

  it('일자를 모르면 day=null 로 남긴다 (임의 날짜로 채우지 않는다)', () => {
    const payouts = buildExpectedPayouts(entries, ['SCHD'], 2026, 3, () => null);

    expect(payouts).toHaveLength(1);
    expect(payouts[0]).toMatchObject({ ticker: 'SCHD', source: 'ex', day: null });
  });

  it('선택이 비었거나 그 달 지급이 없으면 빈 배열', () => {
    expect(buildExpectedPayouts(entries, [], 2026, 2, () => 14)).toEqual([]);
    expect(buildExpectedPayouts(entries, ['ABBV'], 2026, 1, () => 14)).toEqual([]);
  });

  it('소문자·중복 선택을 흡수한다', () => {
    const payouts = buildExpectedPayouts(entries, ['abbv', 'ABBV'], 2026, 5, () => 15);
    expect(payouts.map((payout) => payout.ticker)).toEqual(['ABBV']);
  });
});

describe('buildMonthViewModel', () => {
  const entries = [entry('ABBV', [2, 5, 8, 11]), entry('JEPI', [7], 'pay'), entry('SCHD', [7], 'ex')];
  const today = new Date(2026, 6, 25);

  const build = (month = 7, resolveDay = (ticker: string) => (ticker === 'JEPI' ? 3 : null)) =>
    buildMonthViewModel({
      year: 2026,
      month,
      today,
      selected: ['JEPI', 'SCHD'],
      entries,
      resolveDay: (ticker) => resolveDay(ticker)
    });

  it('항상 6주 × 7일이다 (행 수가 흔들리면 레이아웃이 튄다)', () => {
    const viewModel = build();

    expect(viewModel.weeks).toHaveLength(6);
    for (const week of viewModel.weeks) expect(week).toHaveLength(7);
  });

  it('일요일에서 시작하고 이월 칸을 앞뒤로 채운다', () => {
    const viewModel = build();
    const first = viewModel.weeks[0][0];

    // 2026-07-01 은 수요일 → 앞에 6월 28·29·30 이 붙는다.
    expect(first.date).toBe('2026-06-28');
    expect(first.inMonth).toBe(false);
    expect(viewModel.weeks[0][3]).toMatchObject({ date: '2026-07-01', day: 1, inMonth: true });
  });

  it('weekStart=1 이면 월요일에서 시작한다', () => {
    const viewModel = buildMonthViewModel({
      year: 2026,
      month: 7,
      today,
      selected: [],
      entries,
      resolveDay: () => null,
      weekStart: 1
    });

    expect(viewModel.weeks[0][0].date).toBe('2026-06-29');
  });

  it('날짜가 있는 종목만 칸에 놓고 나머지는 undated 로 뺀다', () => {
    const viewModel = build();
    const dayThree = viewModel.weeks.flat().find((cell) => cell.date === '2026-07-03');

    expect(dayThree?.items.map((item) => item.ticker)).toEqual(['JEPI']);
    expect(viewModel.datedCount).toBe(1);
    expect(viewModel.undated.map((item) => item.ticker)).toEqual(['SCHD']);
    // 미정 종목은 어느 날짜 칸에도 없어야 한다.
    expect(viewModel.weeks.flat().some((cell) => cell.items.some((item) => item.ticker === 'SCHD'))).toBe(
      false
    );
  });

  it('이월 칸에는 칩을 놓지 않는다', () => {
    // 8월을 보는데 ABBV 는 8월 지급 → 8월 칸에만 놓이고 9월 이월 칸에는 없다.
    const viewModel = buildMonthViewModel({
      year: 2026,
      month: 8,
      today,
      selected: ['ABBV'],
      entries,
      resolveDay: () => 14
    });

    expect(viewModel.weeks.flat().filter((cell) => !cell.inMonth).every((cell) => cell.items.length === 0)).toBe(
      true
    );
    expect(viewModel.datedCount).toBe(1);
  });

  it('과거 표시는 이번 달을 보고 있을 때만 켜진다', () => {
    const july = build();
    expect(july.weeks.flat().find((cell) => cell.date === '2026-07-24')?.isPast).toBe(true);
    expect(july.weeks.flat().find((cell) => cell.date === '2026-07-25')?.isPast).toBe(false);
    expect(july.weeks.flat().find((cell) => cell.date === '2026-07-26')?.isPast).toBe(false);

    // 지난 달을 보고 있으면 전부 회색이 되는 대신 아무 날도 과거로 표시하지 않는다.
    const june = buildMonthViewModel({
      year: 2026,
      month: 6,
      today,
      selected: [],
      entries,
      resolveDay: () => null
    });
    expect(june.weeks.flat().some((cell) => cell.isPast)).toBe(false);
    expect(june.weeks.flat().some((cell) => cell.isToday)).toBe(false);
  });
});

describe('buildAgendaDays', () => {
  it('항목이 있는 날만 날짜 오름차순으로 편다', () => {
    const entries = [entry('AAA', [7]), entry('BBB', [7]), entry('CCC', [7])];
    const dayByTicker: Record<string, number> = { AAA: 20, BBB: 3, CCC: 20 };

    const viewModel = buildMonthViewModel({
      year: 2026,
      month: 7,
      today: new Date(2026, 6, 25),
      selected: ['AAA', 'BBB', 'CCC'],
      entries,
      resolveDay: (ticker) => dayByTicker[ticker] ?? null
    });

    const agenda = buildAgendaDays(viewModel);

    expect(agenda.map((entryDay) => entryDay.day)).toEqual([3, 20]);
    expect(agenda[0]).toMatchObject({ date: '2026-07-03', month: 7, weekday: 5 });
    expect(agenda[1].items.map((item) => item.ticker)).toEqual(['AAA', 'CCC']);
  });

  it('지급이 없으면 빈 배열', () => {
    const viewModel = buildMonthViewModel({
      year: 2026,
      month: 7,
      today: new Date(2026, 6, 25),
      selected: [],
      entries: [],
      resolveDay: () => null
    });

    expect(buildAgendaDays(viewModel)).toEqual([]);
  });
});
