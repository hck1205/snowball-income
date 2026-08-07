import type { PortfolioSummary } from '@/shared/lib/portfolio';

/**
 * 월간 리캡 — **한 해의 배당 리듬과 이번 달의 자리**를 한 블록으로.
 *
 * ## 왜 있나
 * 이 앱은 한 번 계산하면 볼 일이 끝난다. 배당은 실제로 매달 들어오는데 앱은 그 사실을 사용자에게
 * 말해 주지 않았다("돌아올 계기가 0개"— docs/site-assessment-2026-08-06.md P1-⑤).
 * 이 블록이 그 자리를 받는다: 이번 달 얼마인지, 지난달과 견줘 어떤지, 앞으로 어떤 달이 큰지.
 *
 * ## 🔴 이것은 **예상**이지 받은 돈이 아니다
 * 값의 출처는 종목별 `annualDividendUsd` 를 그 종목의 `payoutMonths` 개수로 나눈 것이다 —
 * 즉 "이 종목은 연 4회 주니 한 번에 4분의 1" 이라는 **균등 가정**이다. 실제 배당은 회차마다
 * 다르고 회사가 바꿀 수도 있다. 카피가 반드시 "예상"이라고 말해야 하고, 이 파일은 어디서도
 * "받았다"는 뜻의 값을 만들지 않는다.
 *
 * ## 순수 함수다
 * ⚠ `Date.now()` 를 읽지 않는다 — '이번 달'은 `summary.thisMonth` 로 주입받는다
 *   (`PortfolioPage.nextPayoutTile.ts` 와 같은 규율. 테스트가 시간을 고정할 수 있어야 한다).
 */

/** 한 달 칸. */
export type MonthlyRecapMonth = {
  /** 1~12. */
  readonly month: number;
  readonly usd: number;
  /** 이 달이 '이번 달'인가 — 화면이 이 칸만 강조한다. */
  readonly isCurrent: boolean;
  /** 가장 큰 달 대비 높이 비율(0~1). 전부 0이면 0. */
  readonly ratio: number;
};

export type MonthlyRecapModel = {
  readonly thisMonthUsd: number;
  readonly lastMonthUsd: number;
  /**
   * 지난달 대비 변화율(%). **지난달이 0이면 `null`** 이다 —
   * 0에서 늘어난 것을 "+∞%" 나 "+100%" 로 적으면 둘 다 거짓이다.
   */
  readonly changePercent: number | null;
  /** 1월부터 12월까지 열두 칸. 길이는 항상 12다(빈 달도 자리를 지킨다 — 리듬이 곧 정보다). */
  readonly months: readonly MonthlyRecapMonth[];
  /** 배당이 한 번이라도 들어오는 달의 수. 0이면 화면이 이 블록을 그리지 않는다. */
  readonly payingMonthCount: number;
};

/** 12로 감싸 1~12 로 되돌린다. `month - 1` 이 0일 때 12가 되어야 한다. */
const wrapMonth = (month: number): number => ((month - 1 + 12) % 12) + 1;

/**
 * 그 달에 들어올 배당(USD, 세전).
 *
 * 🔴 지급월을 모르는 종목은 **더하지 않는다**. `frequency` 로 지급월을 지어내면 없는 달에 돈이
 * 생긴다 — 이 레포가 `payoutMonths` 를 "있을 때만" 두는 이유와 같다(PortfolioTypes 주석).
 */
const dividendForMonth = (summary: PortfolioSummary, month: number): number =>
  summary.holdings.reduce((sum, holding) => {
    const months = holding.market?.payoutMonths;
    if (!months || months.length === 0) return sum;
    if (!months.includes(month)) return sum;
    /* 균등 분배 — 회차별 실제 배당액은 이 앱이 갖고 있지 않다(위 머리말의 "예상"). */
    return sum + holding.annualDividendUsd / months.length;
  }, 0);

export const buildMonthlyRecap = (summary: PortfolioSummary): MonthlyRecapModel => {
  const current = summary.thisMonth.month;
  const amounts = Array.from({ length: 12 }, (_, index) => dividendForMonth(summary, index + 1));
  const peak = Math.max(...amounts);

  const thisMonthUsd = amounts[current - 1] ?? 0;
  const lastMonthUsd = amounts[wrapMonth(current - 1) - 1] ?? 0;

  return {
    thisMonthUsd,
    lastMonthUsd,
    changePercent: lastMonthUsd > 0 ? ((thisMonthUsd - lastMonthUsd) / lastMonthUsd) * 100 : null,
    months: amounts.map((usd, index) => ({
      month: index + 1,
      usd,
      isCurrent: index + 1 === current,
      /* 0으로 나누지 않는다 — 전부 0이면 막대가 전부 바닥이다(NaN 이 CSS 로 새면 조용히 사라진다). */
      ratio: peak > 0 ? usd / peak : 0
    })),
    payingMonthCount: amounts.filter((usd) => usd > 0).length
  };
};
