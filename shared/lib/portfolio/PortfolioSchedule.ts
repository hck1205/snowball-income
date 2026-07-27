import { hasPortfolioPayoutMonths } from './PortfolioMarketInfo';
import type { PortfolioMarketInfo, PortfolioNextPayout } from './PortfolioTypes';

/**
 * **다음 배당 지급일(#7) 계산 — 날짜를 지어내지 않는다.**
 *
 * ⚠ 날짜 계산에 UTC 게터·`toISOString()` 을 쓰지 않는다. KST(UTC+9)에서 로컬 자정은 UTC 전날 15:00
 * 이라 UTC 기준으로 읽으면 "오늘"이 하루 밀린다(배당 캘린더와 같은 규칙).
 */

const MONTHS_IN_YEAR = 12;

/**
 * 탐색 범위는 **오늘 달부터 13개월**(offset 0..12)이다. 12개월이 아닌 이유: 당월이 지급월인데 예상
 * 지급일이 이미 지났으면 그 달을 건너뛰어야 하고, 분기 지급 종목이라면 같은 달의 **내년** 차례
 * (offset 12)가 정답이기 때문이다.
 */
const SEARCH_HORIZON_MONTHS = 12;

/** 그 달의 마지막 날. `new Date(year, month, 0)` 은 로컬 기준이라 타임존에 안전하다. */
export const getPortfolioDaysInMonth = (year: number, month: number): number => new Date(year, month, 0).getDate();

/**
 * 그 종목이 `year`년 `month`월에 지급할 것으로 **예상되는 날**. 근거가 없으면 `null`.
 *
 * 근거는 `payoutMonthsSource === 'pay'` + `estimatedPayDayByMonth` 뿐이다 — 배당락 기반('ex')이나
 * 값이 없는 달을 1일·말일로 채우지 않는다. 값이 그 달 일수를 넘으면 말일로 clamp 만 한다.
 * (스냅샷의 2월 값은 **28 고정**이다 — 윤년 29 로 올려잡지 않는다. 값 그대로 쓴다.)
 */
export const resolvePortfolioPayoutDay = (
  info: PortfolioMarketInfo,
  year: number,
  month: number
): number | null => {
  if (info.payoutMonthsSource !== 'pay') return null;

  const raw = info.estimatedPayDayByMonth?.[String(month)];
  if (typeof raw !== 'number' || !Number.isFinite(raw) || raw < 1) return null;

  return Math.min(Math.trunc(raw), getPortfolioDaysInMonth(year, month));
};

/**
 * 오늘 기준(**당월 포함**) 가장 가까운 지급 예정. 연 경계를 넘어간다(12월 → 이듬해 1월).
 *
 * 경계 규칙(화면 카피가 이 규칙에 의존한다):
 * - 예상 일자를 아는 달: **오늘 = 예상 지급일이면 오늘을 그대로 반환**한다(입금일 당일에 "지났다"고
 *   말하지 않는다). 예상 일자가 오늘보다 **이전**일 때만 다음 지급월로 넘어간다.
 * - 예상 일자를 모르는 달: 당월이 지급월이면 **당월**을 반환한다("N월 중" — 며칠인지 모르니 지났다고
 *   단정할 수 없다).
 * - 지급월 정보가 없으면(무배당·미갱신·수동 입력) `'none'`.
 */
export const findNextPayout = (info: PortfolioMarketInfo | null, today: Date): PortfolioNextPayout => {
  if (!info || !hasPortfolioPayoutMonths(info)) return { kind: 'none' };
  if (!(today instanceof Date) || Number.isNaN(today.getTime())) return { kind: 'none' };

  const payoutMonths = info.payoutMonths ?? [];
  const todayYear = today.getFullYear();
  const todayMonthIndex = today.getMonth();
  const todayDate = today.getDate();

  for (let offset = 0; offset <= SEARCH_HORIZON_MONTHS; offset += 1) {
    const absoluteMonth = todayMonthIndex + offset;
    const year = todayYear + Math.floor(absoluteMonth / MONTHS_IN_YEAR);
    const month = (absoluteMonth % MONTHS_IN_YEAR) + 1;

    if (!payoutMonths.includes(month)) continue;

    const day = resolvePortfolioPayoutDay(info, year, month);
    if (day === null) return { kind: 'month-only', month };
    if (offset === 0 && day < todayDate) continue;

    return { kind: 'estimated-day', month, day };
  }

  return { kind: 'none' };
};
