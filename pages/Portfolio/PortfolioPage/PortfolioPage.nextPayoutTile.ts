import type { PortfolioNextPayout, PortfolioSummary } from '@/shared/lib/portfolio';
import { PORTFOLIO_COPY } from '../copy';
import type { PortfolioDDayModel, PortfolioTileModel } from './PortfolioPage.types';

/**
 * 다음 예상 지급일 타일(#7) 전용 — 정렬·묶기·표기 규칙이 다른 타일보다 촘촘해 독립된 서브모듈로
 * 떼어 뒀다(`test/portfolio/portfolioNextPayoutTile.test.ts` 가 이 경계로 이미 따로 검증한다).
 * **순수 함수만**. `Date.now()`를 읽지 않는다 — '오늘'은 `summary.thisMonth.year`로 전달받는다.
 *
 * 히어로의 **D-Day**(`buildNextPayoutDDay`)도 여기 산다 — 같은 지급을 고르는 두 표면이
 * 다른 파일에 있으면 한쪽만 규칙이 바뀌어 **두 화면이 서로 다른 날짜를 말하게 된다.**
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
 * 가장 가까운 지급과 **그 지급을 함께 받는 종목들**. 없으면 `null`.
 *
 * 🔴 타일(#7)과 히어로 D-Day 가 **같은 함수로 같은 지급을 고른다.** 두 표면이 각자 정렬하면
 * 규칙이 한쪽만 바뀌었을 때 한 화면이 "8월 20일"이라고 하고 다른 화면이 "D-3"(=8월 18일)이라고
 * 말하게 된다 — 사용자는 어느 쪽도 믿지 못한다.
 *
 * 대상은 **지급 일정이 계산에 들어간 행**뿐이다(수량 미입력·시장데이터 없음·지급월 미상은 제외).
 */
const selectNearestPayout = (
  summary: PortfolioSummary
): { payout: ScheduledPayout; sharing: number; firstTicker: string } | null => {
  const scheduled = summary.holdings.filter((row) => row.includedInSchedule && row.nextPayout.kind !== 'none');
  if (scheduled.length === 0) return null;

  const todayYear = summary.thisMonth.year;
  const sorted = [...scheduled].sort(
    (left, right) => payoutSortKey(left.nextPayout, todayYear) - payoutSortKey(right.nextPayout, todayYear)
  );

  const nearest = sorted[0].nextPayout;
  // 위에서 걸러냈지만 배열 필터는 타입을 좁히지 않는다 — 실행되지 않는 가지를 명시해 둔다.
  if (nearest.kind === 'none') return null;

  const sharing = sorted.filter((row) => isSamePayout(row.nextPayout, nearest));

  return { payout: nearest, sharing: sharing.length, firstTicker: sharing[0].ticker };
};

/**
 * 다음 예상 지급일 타일(#7). 엔진의 `{ kind }` 3분기를 그대로 화면 3분기로 옮긴다 — **날짜 날조 금지**.
 */
export const buildNextPayoutTile = (summary: PortfolioSummary): PortfolioTileModel => {
  const selected = selectNearestPayout(summary);

  if (selected === null) {
    return { label: copy.summary.tiles.nextPayout, value: copy.summary.tiles.nextPayoutNone, hint: copy.summary.tiles.nextPayoutNoneHint };
  }

  const todayYear = summary.thisMonth.year;
  const nearest = selected.payout;
  const tickers = copy.summary.tiles.tickerSummary(selected.firstTicker, selected.sharing);
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

/** 로컬 자정 기준의 날짜 하나. `Date.UTC`·`toISOString` 은 KST 에서 하루 밀린다(pitfalls 2026-07-25). */
const localMidnight = (year: number, month: number, day: number): Date => new Date(year, month - 1, day);

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * 히어로의 **다음 배당 D-Day**. 없으면 `null`(= 화면에 아무것도 그리지 않는다).
 *
 * `null` 이 되는 경우 셋: ①보유가 없거나 지급 일정을 아는 행이 없다 ②가장 가까운 지급이
 * **월만 아는**(`month-only`) 지급이다 ③지급이 이미 지났다(음수 — 엔진이 오늘 이후만 돌려주므로
 * 정상 경로에서는 나오지 않지만, 방어한다). 🔴 셋 중 어느 경우에도 **"D-—" 를 남기지 않는다** —
 * 값이 없으면 줄 자체가 없다(조건 스트립의 "— 단독 금지"와 같은 규칙).
 *
 * ## '오늘'의 기준
 * `today` 는 컨테이너가 마운트 시점에 한 번 고정해 내려준다(`PortfolioPage.tsx` 의 `now`).
 * 여기서는 **로컬 자정끼리** 뺀다 — 시각이 섞이면 오전 9시에 재는 D-Day 와 오후 11시에 재는
 * D-Day 가 하루 달라진다. 지급일도 로컬 자정으로 만들어 같은 축에 놓는다(KST 는 DST 가 없고,
 * 그래도 남을 시간 오차는 `Math.round` 가 흡수한다).
 */
export const buildNextPayoutDDay = (summary: PortfolioSummary, today: Date): PortfolioDDayModel | null => {
  if (!(today instanceof Date) || Number.isNaN(today.getTime())) return null;

  const selected = selectNearestPayout(summary);
  if (selected === null) return null;

  // 월만 아는 지급으로는 D-Day 를 만들 수 없다. 요약 타일이 "N월 지급 예정"으로 이미 말하고 있다.
  if (selected.payout.kind !== 'estimated-day') return null;

  const { year, month, day } = selected.payout;
  const from = localMidnight(today.getFullYear(), today.getMonth() + 1, today.getDate());
  const to = localMidnight(year, month, day);
  const daysUntil = Math.round((to.getTime() - from.getTime()) / MS_PER_DAY);

  if (daysUntil < 0) return null;

  return {
    label: daysUntil === 0 ? copy.hero.dDay.todayLabel : copy.hero.dDay.label,
    value: daysUntil === 0 ? copy.hero.dDay.todayValue : copy.hero.dDay.value(daysUntil),
    tickers: copy.summary.tiles.tickerSummary(selected.firstTicker, selected.sharing)
  };
};
