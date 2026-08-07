import { describe, expect, it } from 'vitest';
import { buildMonthlyRecap } from '@/pages/Portfolio/PortfolioPage/PortfolioPage.monthlyRecap';
import type { PortfolioSummary } from '@/shared/lib/portfolio';

/**
 * 월간 리캡의 계산 계약.
 *
 * 🔴 이 값들은 **예상**이다 — 종목의 연 배당을 지급월 수로 나눈 균등 가정이다. 그래서 이 파일이
 * 지키는 것은 "정확한 금액"이 아니라 **거짓말을 하지 않는 것**이다:
 *   ① 지급월을 모르는 종목의 돈을 아무 달에나 만들지 않는다
 *   ② 0에서 늘어난 것을 퍼센트로 적지 않는다
 *   ③ 전부 0일 때 NaN 을 화면으로 흘리지 않는다
 */
const holding = (annualUsd: number, payoutMonths?: number[]) =>
  ({
    annualDividendUsd: annualUsd,
    market: payoutMonths ? { payoutMonths } : undefined
  }) as unknown as PortfolioSummary['holdings'][number];

const summaryOf = (month: number, holdings: PortfolioSummary['holdings']) =>
  ({ thisMonth: { year: 2026, month }, holdings }) as unknown as PortfolioSummary;

describe('월간 리캡 — 열두 칸', () => {
  it('항상 12칸이다 — 빈 달도 자리를 지킨다(리듬이 곧 정보다)', () => {
    const recap = buildMonthlyRecap(summaryOf(8, [holding(1200, [3, 6, 9, 12])]));

    expect(recap.months).toHaveLength(12);
    expect(recap.months.map((m) => m.month)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });

  it('연 배당을 지급월 수로 균등하게 나눈다', () => {
    const recap = buildMonthlyRecap(summaryOf(3, [holding(1200, [3, 6, 9, 12])]));

    expect(recap.months[2]?.usd).toBe(300); // 3월
    expect(recap.months[3]?.usd).toBe(0); // 4월
  });

  it('여러 종목이 같은 달에 겹치면 더한다', () => {
    const recap = buildMonthlyRecap(
      summaryOf(1, [holding(1200, [1, 4, 7, 10]), holding(600, [1, 7])])
    );

    expect(recap.months[0]?.usd).toBe(600); // 300 + 300
  });

  /** 🔴 지급월을 모르는 종목의 돈이 아무 달에나 생기면, 없는 입금을 알리는 화면이 된다. */
  it('지급월을 모르는 종목은 어느 달에도 더하지 않는다', () => {
    const recap = buildMonthlyRecap(summaryOf(5, [holding(1200)]));

    expect(recap.months.every((m) => m.usd === 0)).toBe(true);
    expect(recap.payingMonthCount).toBe(0);
  });
});

describe('이번 달 · 지난달', () => {
  it('이번 달과 지난달을 각각 집는다', () => {
    const recap = buildMonthlyRecap(summaryOf(8, [holding(1200, [7, 8]), holding(600, [8])]));

    expect(recap.thisMonthUsd).toBe(1200); // 8월: 600 + 600
    expect(recap.lastMonthUsd).toBe(600); // 7월: 600
    expect(recap.changePercent).toBe(100);
  });

  /** ⚠ 1월의 지난달은 **12월**이다. `month - 1` 을 그냥 쓰면 0월이 되어 값이 사라진다. */
  it('1월의 지난달은 12월이다', () => {
    const recap = buildMonthlyRecap(summaryOf(1, [holding(1200, [12])]));

    expect(recap.lastMonthUsd).toBe(1200);
  });

  /** 🔴 0에서 늘어난 것을 "+100%" 나 "+∞%" 로 적으면 둘 다 거짓이다 — 화면이 문장으로 말해야 한다. */
  it('지난달이 0이면 변화율을 만들지 않는다(null)', () => {
    const recap = buildMonthlyRecap(summaryOf(8, [holding(1200, [8])]));

    expect(recap.lastMonthUsd).toBe(0);
    expect(recap.changePercent).toBeNull();
  });

  it('줄어든 달은 음수로 말한다', () => {
    const recap = buildMonthlyRecap(summaryOf(8, [holding(1200, [7]), holding(600, [8])]));

    expect(recap.changePercent).toBe(-50);
  });
});

describe('막대 비율', () => {
  it('가장 큰 달이 1 이고 나머지는 그 비율이다', () => {
    const recap = buildMonthlyRecap(summaryOf(1, [holding(1200, [1]), holding(600, [2])]));

    expect(recap.months[0]?.ratio).toBe(1);
    expect(recap.months[1]?.ratio).toBe(0.5);
  });

  /** 🔴 0으로 나누면 NaN 이 폭 값으로 새어 나가고, CSS 는 그것을 조용히 무시한다. */
  it('전부 0이면 비율도 0이다 — NaN 을 화면으로 흘리지 않는다', () => {
    const recap = buildMonthlyRecap(summaryOf(5, [holding(0, [1, 2, 3])]));

    expect(recap.months.every((m) => m.ratio === 0)).toBe(true);
    expect(recap.months.every((m) => Number.isFinite(m.ratio))).toBe(true);
  });
});
