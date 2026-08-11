// @vitest-environment node — 순수 계산 테스트
import { describe, expect, it } from 'vitest';
import { buildPortfolioMonthCalendar } from '@/shared/lib/portfolio';
import type { PortfolioHolding, PortfolioMarketInfo } from '@/shared/lib/portfolio';

/**
 * **내 배당 달력의 금액 계약.**
 *
 * 🔴 이 숫자는 사용자가 생활비 계획에 쓴다. 그래서 두 가지를 **지어내지 않는다**는 것이 이 파일의
 *    주제다:
 *      ① 회차별 금액 — 연배당을 지급월 수로 균등 분배한다(포트폴리오 #6 과 같은 규칙).
 *      ② 날짜 — 근거가 있는 종목만 일자를 갖고, 나머지는 `day: null`("N월 중").
 * 🔴 **포트폴리오 화면과 같은 값이어야 한다.** 두 화면이 같은 종목·같은 달에 다른 금액을 말하면
 *    둘 다 신뢰를 잃는다. 그래서 분배 규칙을 복제하지 않고 같은 규칙을 쓴다(가드: 아래 균등분배 케이스).
 */

const market = (over: Partial<PortfolioMarketInfo> = {}): PortfolioMarketInfo => ({
  price: 100,
  dividendYield: 4,
  payoutMonths: [3, 6, 9, 12],
  payoutMonthsSource: 'pay',
  estimatedPayDayByMonth: { '3': 15, '6': 15, '9': 15, '12': 15 },
  freshness: 'snapshot',
  asOf: '2026-08-01',
  ...over
});

/** 티커별 시장 정보를 고정 주입한다 — 실제 스냅샷에 매이면 데이터 갱신 때마다 빨개진다. */
const resolverOf = (byTicker: Record<string, PortfolioMarketInfo | null>) => (holding: PortfolioHolding) =>
  byTicker[holding.ticker.toUpperCase()] ?? null;

const holding = (ticker: string, quantity: number): PortfolioHolding => ({ ticker, quantity });

describe('buildPortfolioMonthCalendar — 그 달의 배당 예정', () => {
  it('연배당을 지급월 수로 균등 분배한다 — 포트폴리오 #6 과 같은 규칙', () => {
    // 100주 × $100 × 4% = 연 $400, 분기 지급(4회) → 회당 $100.
    const result = buildPortfolioMonthCalendar([holding('SCHD', 100)], {
      year: 2026,
      month: 3,
      resolve: resolverOf({ SCHD: market() })
    });

    expect(result.entries).toHaveLength(1);
    expect(result.entries[0]).toMatchObject({ ticker: 'SCHD', day: 15, amountUsd: 100, source: 'pay' });
    expect(result.totalUsd).toBe(100);
  });

  it('지급월이 아닌 달은 빈 달이다 — "모르는 것"으로 세지 않는다', () => {
    const result = buildPortfolioMonthCalendar([holding('SCHD', 100)], {
      year: 2026,
      month: 4,
      resolve: resolverOf({ SCHD: market() })
    });

    expect(result.entries).toEqual([]);
    expect(result.totalUsd).toBe(0);
    // 이 달에 안 주는 것은 정상이다. 여기에 세면 "데이터가 없다"는 잘못된 경고가 뜬다.
    expect(result.unknownCount).toBe(0);
  });

  it('🔴 배당락 기반(ex)은 일자를 붙이지 않는다 — 실제 입금이 다음 달일 수 있다', () => {
    const result = buildPortfolioMonthCalendar([holding('VIG', 50)], {
      year: 2026,
      month: 3,
      resolve: resolverOf({
        VIG: market({ payoutMonthsSource: 'ex', estimatedPayDayByMonth: undefined })
      })
    });

    expect(result.entries[0]).toMatchObject({ day: null, source: 'ex' });
    // 금액은 그대로 낸다 — 날짜를 모르는 것과 금액을 모르는 것은 다르다.
    expect(result.entries[0].amountUsd).toBeCloseTo(50, 10);
  });

  it('말일을 넘는 예상 일자는 그 달 말일로 접힌다 — 2월 31일을 만들지 않는다', () => {
    const result = buildPortfolioMonthCalendar([holding('O', 10)], {
      year: 2026,
      month: 2,
      resolve: resolverOf({
        O: market({ payoutMonths: [2], estimatedPayDayByMonth: { '2': 31 } })
      })
    });

    expect(result.entries[0].day).toBe(28);
  });

  it('🔴 금액을 낼 수 없는 보유는 버리지 않고 센다 — 무음 제외 금지', () => {
    const result = buildPortfolioMonthCalendar(
      [
        holding('SCHD', 100),
        holding('NOQTY', 0), // 수량 미입력
        holding('UNKNOWN', 10), // 시장 정보 없음
        holding('NOMONTH', 10) // 지급월 모름
      ],
      {
        year: 2026,
        month: 3,
        resolve: resolverOf({
          SCHD: market(),
          NOQTY: market(),
          UNKNOWN: null,
          NOMONTH: market({ payoutMonths: undefined, payoutMonthsSource: 'none' })
        })
      }
    );

    expect(result.entries.map((entry) => entry.ticker)).toEqual(['SCHD']);
    expect(result.unknownCount).toBe(3);
  });

  it('일자를 아는 것이 먼저, 모르는 것이 뒤 — 같은 조건이면 티커순', () => {
    const result = buildPortfolioMonthCalendar(
      [holding('ZZZ', 10), holding('AAA', 10), holding('LATE', 10), holding('EARLY', 10)],
      {
        year: 2026,
        month: 3,
        resolve: resolverOf({
          // 일자 없음(ex) 둘 — 티커순으로 뒤에 선다.
          ZZZ: market({ payoutMonthsSource: 'ex', estimatedPayDayByMonth: undefined }),
          AAA: market({ payoutMonthsSource: 'ex', estimatedPayDayByMonth: undefined }),
          // 일자 있음 둘 — 일자 오름차순으로 앞에 선다.
          LATE: market({ estimatedPayDayByMonth: { '3': 28 } }),
          EARLY: market({ estimatedPayDayByMonth: { '3': 2 } })
        })
      }
    );

    expect(result.entries.map((entry) => entry.ticker)).toEqual(['EARLY', 'LATE', 'AAA', 'ZZZ']);
  });

  it('합계는 그 달 항목의 합이다', () => {
    const result = buildPortfolioMonthCalendar([holding('A', 100), holding('B', 100)], {
      year: 2026,
      month: 6,
      // A: 연 $400 ÷ 4 = $100, B: 연 $600 ÷ 12 = $50
      resolve: resolverOf({
        A: market(),
        B: market({
          dividendYield: 6,
          payoutMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
          estimatedPayDayByMonth: { '6': 10 }
        })
      })
    });

    expect(result.totalUsd).toBeCloseTo(150, 10);
  });

  it('보유가 비어 있으면 빈 달이다', () => {
    const result = buildPortfolioMonthCalendar([], { year: 2026, month: 8, resolve: resolverOf({}) });

    expect(result).toMatchObject({ year: 2026, month: 8, entries: [], totalUsd: 0, unknownCount: 0 });
  });
});
