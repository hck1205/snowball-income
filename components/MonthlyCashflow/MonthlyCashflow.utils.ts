/**
 * Keeps the user's chosen year while it still exists, otherwise falls back to the latest year.
 * Returns null when there is no cashflow data at all.
 */
export const resolveSelectedYear = (years: number[], previousYear: number | null): number | null => {
  if (years.length === 0) return null;
  if (previousYear !== null && years.includes(previousYear)) return previousYear;

  return years[years.length - 1] ?? null;
};

import { MARKET_DATA } from '@/shared/constants/marketData';
import type { MarketDataSnapshot } from '@/shared/constants/marketData';

/**
 * 지급 일정 한 줄 — "이 종목은 몇 월에 주는가"와 그 답의 **확실성**.
 *
 * 시뮬레이션 차트(위 캔버스)는 엔진이 frequency 로 분배한 값이라 건드리지 않는다 — 분배를 바꾸면
 * 기존 저장·공유 결과가 움직인다. 이 스트립은 그 옆에 **관측 데이터**(실제 지급 이력)를 따로 보여
 * 주는 표시 전용 레이어다.
 */
export type PayoutScheduleRow = {
  ticker: string;
  displayName: string;
  /** 1-12. 오름차순. */
  months: number[];
  /**
   * - `pay`: 실제 입금일 이력에서 관측 (Alpha Vantage) — 그대로 믿어도 된다.
   * - `ex` : 배당락일에서 추정 (Yahoo) — 월말 배당락이면 실제 입금은 다음 달일 수 있다.
   */
  source: 'pay' | 'ex';
  /** 배당락 → 입금까지 며칠(중앙값). 실측(pay) 종목만 있다. */
  exToPayLagDays: number | null;
};

/**
 * 포함된 종목들의 지급 일정을 만든다. 지급월 데이터가 없는 종목(직접 만든 티커, 무배당,
 * 갱신 가드에 걸린 종목)은 **빼는 게 정직하다** — frequency 로 아무 달이나 지어내지 않는다.
 */
export const buildPayoutScheduleRows = (
  tickers: readonly { ticker: string; displayName: string }[],
  snapshot: MarketDataSnapshot = MARKET_DATA
): PayoutScheduleRow[] =>
  tickers.flatMap(({ ticker, displayName }) => {
    const entry = snapshot.entries[ticker];
    const months = entry?.payoutMonths;
    if (!entry || !months || months.length === 0) return [];
    return [
      {
        ticker,
        displayName,
        months,
        source: entry.payoutMonthsSource === 'pay' ? 'pay' : 'ex',
        exToPayLagDays: entry.payoutMonthsSource === 'pay' ? (entry.exToPayLagDays ?? null) : null
      }
    ];
  });

/** 캘린더 셀 안의 종목 한 줄. `source` 는 금액을 어느 근거로 그 달에 놓았는지다. */
export type CalendarItem = {
  name: string;
  amount: number;
  /**
   * - `pay`: 실측 지급월(입금일 이력)에 연간 배당을 균등 분배
   * - `ex` : 추정 지급월(배당락일)에 균등 분배
   * - `sim`: 관측 데이터가 없어 엔진의 월 분배를 그대로 사용
   */
  source: 'pay' | 'ex' | 'sim';
};

export type CalendarMonth = {
  /** 1-12 */
  month: number;
  total: number;
  items: CalendarItem[];
};

type CashflowSeries = { name: string; data: number[] };

/**
 * 캘린더 뷰의 월별 분배 — **표시 전용 재배분**이다.
 *
 * 엔진은 투자 시작월 기준 frequency 로 배당을 놓는다(계약: 저장·공유 결과의 원천, 불변).
 * 캘린더는 "실제로 몇 월에 들어오나"를 묻는 화면이라, 종목의 **연간 합**(엔진 값 그대로)을
 * 관측된 지급월에 균등 분배해 다시 놓는다. 연간 합이 보존되므로 어느 뷰로 보든 1년 총액은 같다 —
 * 달라지는 건 월 배치뿐이고, 그 차이가 바로 이 뷰의 존재 이유다.
 *
 * 관측 데이터가 없는 종목(직접 만든 티커 등)은 엔진 분배를 그대로 둔다(`source: 'sim'`) —
 * 빼면 월 합계가 차트와 어긋나고, 지어내면 거짓이다. 그대로 두는 게 유일하게 정직하다.
 */
export const buildCalendarMonths = (
  series: readonly CashflowSeries[],
  scheduleRows: readonly PayoutScheduleRow[]
): CalendarMonth[] => {
  const scheduleByName = new Map(scheduleRows.map((row) => [row.displayName, row]));

  const months: CalendarMonth[] = Array.from({ length: 12 }, (_v, index) => ({
    month: index + 1,
    total: 0,
    items: []
  }));

  for (const item of series) {
    const schedule = scheduleByName.get(item.name);
    const annual = item.data.reduce((sum, value) => sum + value, 0);

    if (schedule && annual > 0) {
      const perPayment = annual / schedule.months.length;
      for (const month of schedule.months) {
        months[month - 1].items.push({ name: item.name, amount: perPayment, source: schedule.source });
        months[month - 1].total += perPayment;
      }
      continue;
    }

    item.data.forEach((amount, index) => {
      if (amount <= 0) return;
      months[index].items.push({ name: item.name, amount, source: 'sim' });
      months[index].total += amount;
    });
  }

  for (const cell of months) {
    cell.items.sort((left, right) => right.amount - left.amount);
  }

  return months;
};
