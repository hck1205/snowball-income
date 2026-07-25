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
