import type { PortfolioNextPayout, PortfolioSummary } from '@/shared/lib/portfolio';
import { PORTFOLIO_COPY } from '../copy';
import type { PortfolioTileModel } from './PortfolioPage.types';

/**
 * 다음 예상 지급일 타일(#7) 전용 — 정렬·묶기·표기 규칙이 다른 타일보다 촘촘해 독립된 서브모듈로
 * 떼어 뒀다(`test/portfolio/portfolioNextPayoutTile.test.ts` 가 이 경계로 이미 따로 검증한다).
 * **순수 함수만**. `Date.now()`를 읽지 않는다 — '오늘'은 `summary.thisMonth.year`로 전달받는다.
 */

const copy = PORTFOLIO_COPY;

/** 지급월을 아는 지급(= 화면에 날짜/월을 적을 수 있는 것). */
type ScheduledPayout = Exclude<PortfolioNextPayout, { kind: 'none' }>;

/**
 * 지급 정렬 키. 가까운 달 → 날짜를 아는 쪽 → 이른 날 순.
 *
 * ⚠ `month` 만으로 "몇 달 뒤"를 재지 않는다 — 연 1회 종목의 다음 차례는 **내년 같은 달**이라
 * `(month - todayMonth + 12) % 12` 가 0(= 이번 달)으로 접힌다. 연도까지 함께 센다.
 */
const payoutSortKey = (payout: PortfolioNextPayout, todayYear: number): number => {
  if (payout.kind === 'none') return Number.POSITIVE_INFINITY;

  const monthsAhead = (payout.year - todayYear) * 12 + payout.month;
  const day = payout.kind === 'estimated-day' ? payout.day : 40;

  return monthsAhead * 100 + day;
};

/**
 * 같은 줄로 묶어 셀 수 있는 지급인가. 한쪽만 날짜를 아는 경우는 표기가 달라 묶지 않는다.
 *
 * **연도까지 같아야 한다** — 2026-08 과 2027-08 을 묶으면 내년 지급 종목이 이번 달 지급 줄의
 * "외 n종"에 들어가 없는 입금을 알리게 된다.
 */
const isSamePayout = (left: PortfolioNextPayout, right: PortfolioNextPayout): boolean => {
  if (left.kind === 'estimated-day' && right.kind === 'estimated-day') {
    return left.year === right.year && left.month === right.month && left.day === right.day;
  }
  if (left.kind === 'month-only' && right.kind === 'month-only') {
    return left.year === right.year && left.month === right.month;
  }

  return false;
};

/** 지급 표기. **연도는 올해가 아닐 때만** 병기한다 — 늘 붙이면 대부분의 화면에서 소음이다. */
const formatPayoutValue = (payout: ScheduledPayout, todayYear: number): string => {
  const isThisYear = payout.year === todayYear;

  if (payout.kind === 'estimated-day') {
    return isThisYear
      ? copy.summary.tiles.nextPayoutDay(payout.month, payout.day)
      : copy.summary.tiles.nextPayoutDayWithYear(payout.year, payout.month, payout.day);
  }

  return isThisYear
    ? copy.summary.tiles.nextPayoutMonthOnly(payout.month)
    : copy.summary.tiles.nextPayoutMonthOnlyWithYear(payout.year, payout.month);
};

/**
 * 다음 예상 지급일 타일(#7). 엔진의 `{ kind }` 3분기를 그대로 화면 3분기로 옮긴다 — **날짜 날조 금지**.
 * 대상은 **지급 일정이 계산에 들어간 행**뿐이다(수량 미입력·시장데이터 없음·지급월 미상은 제외).
 */
export const buildNextPayoutTile = (summary: PortfolioSummary): PortfolioTileModel => {
  const scheduled = summary.holdings.filter((row) => row.includedInSchedule && row.nextPayout.kind !== 'none');

  if (scheduled.length === 0) {
    return { label: copy.summary.tiles.nextPayout, value: copy.summary.tiles.nextPayoutNone, hint: copy.summary.tiles.nextPayoutNoneHint };
  }

  const todayYear = summary.thisMonth.year;
  const sorted = [...scheduled].sort(
    (left, right) => payoutSortKey(left.nextPayout, todayYear) - payoutSortKey(right.nextPayout, todayYear)
  );

  const nearest = sorted[0].nextPayout;
  // 위에서 걸러냈지만 배열 필터는 타입을 좁히지 않는다 — 실행되지 않는 가지를 명시해 둔다.
  if (nearest.kind === 'none') {
    return {
      label: copy.summary.tiles.nextPayout,
      value: copy.summary.tiles.nextPayoutNone,
      hint: copy.summary.tiles.nextPayoutNoneHint
    };
  }

  const sharing = sorted.filter((row) => isSamePayout(row.nextPayout, nearest));
  const tickers = copy.summary.tiles.tickerSummary(sharing[0].ticker, sharing.length);
  const value = formatPayoutValue(nearest, todayYear);

  if (nearest.kind === 'estimated-day') {
    return { label: copy.summary.tiles.nextPayout, value, hint: tickers };
  }

  return {
    label: copy.summary.tiles.nextPayout,
    value,
    hint: copy.summary.tiles.nextPayoutMonthOnlyHint(tickers)
  };
};
