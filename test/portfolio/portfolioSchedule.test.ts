import {
  computePortfolioSummary,
  findNextPayout,
  getPortfolioDaysInMonth,
  resolvePortfolioPayoutDay,
  type PortfolioMarketInfo
} from '@/shared/lib/portfolio';
import {
  FIXTURE_MONTHLY,
  FIXTURE_NO_SCHEDULE,
  FIXTURE_ODD_QUARTERLY,
  FIXTURE_QUARTERLY,
  FIXTURE_ZERO_YIELD,
  fixtureResolver,
  localDate
} from './portfolioFixtures';

/**
 * 다음 배당 지급일(#7) — 3단 근거(일자 추정 / 월만 / 없음)와 경계 규칙.
 *
 * 확정된 경계 규칙(카피가 이 규칙에 의존한다):
 * - 예상 일자를 아는 달은 **오늘 = 예상 지급일이면 오늘을 반환**한다(당일 포함). 오늘보다 **이전**일
 *   때만 다음 지급월로 넘어간다.
 * - 예상 일자를 모르는 달은 당월이 지급월이면 **당월**("N월 중")을 반환한다.
 */

/** 지급월이 하나뿐이고 그 달이 이미 지난 경우 — 같은 달의 **내년** 차례를 찾아야 한다. */
const SINGLE_MONTH_PAY: PortfolioMarketInfo = {
  price: 100,
  dividendYield: 5,
  frequency: 'annual',
  payoutMonths: [3],
  payoutMonthsSource: 'pay',
  estimatedPayDayByMonth: { '3': 5 },
  freshness: 'snapshot',
  asOf: '2026-07-25'
};

/** 방어용: 배당락 추정('ex') 소스인데 일자 맵이 섞여 들어온 경우 — 일자를 믿지 않는다. */
const EX_SOURCE_WITH_DAYS: PortfolioMarketInfo = {
  ...FIXTURE_QUARTERLY,
  estimatedPayDayByMonth: { '9': 12 }
};

describe('findNextPayout — 월만 아는 종목(month-only)', () => {
  it('오늘 이후 가장 가까운 지급월을 준다', () => {
    expect(findNextPayout(FIXTURE_QUARTERLY, localDate(2026, 7, 15))).toEqual({ kind: 'month-only', month: 9 });
    expect(findNextPayout(FIXTURE_QUARTERLY, localDate(2026, 10, 1))).toEqual({ kind: 'month-only', month: 12 });
  });

  it('당월이 지급월이면 며칠인지 몰라도 당월이다 (지났다고 단정하지 않는다)', () => {
    expect(findNextPayout(FIXTURE_QUARTERLY, localDate(2026, 9, 1))).toEqual({ kind: 'month-only', month: 9 });
    expect(findNextPayout(FIXTURE_QUARTERLY, localDate(2026, 9, 30))).toEqual({ kind: 'month-only', month: 9 });
  });

  it('연 경계를 넘는다 (12월 → 이듬해 3월)', () => {
    expect(findNextPayout(FIXTURE_QUARTERLY, localDate(2026, 12, 31))).toEqual({ kind: 'month-only', month: 12 });
    expect(findNextPayout(FIXTURE_QUARTERLY, localDate(2027, 1, 1))).toEqual({ kind: 'month-only', month: 3 });
  });

  it("'ex' 소스는 일자 맵이 있어도 일자를 쓰지 않는다 (추정 근거 등급을 지킨다)", () => {
    expect(findNextPayout(EX_SOURCE_WITH_DAYS, localDate(2026, 8, 1))).toEqual({ kind: 'month-only', month: 9 });
  });
});

describe('findNextPayout — 일자까지 아는 종목(estimated-day)', () => {
  it('예상 지급일이 아직 안 왔으면 당월 그대로', () => {
    // FIXTURE_MONTHLY 의 7월 예상 지급일 = 7일.
    expect(findNextPayout(FIXTURE_MONTHLY, localDate(2026, 7, 1))).toEqual({ kind: 'estimated-day', month: 7, day: 7 });
  });

  it('오늘이 곧 예상 지급일이면 오늘을 그대로 준다 (당일 포함)', () => {
    expect(findNextPayout(FIXTURE_MONTHLY, localDate(2026, 7, 7))).toEqual({ kind: 'estimated-day', month: 7, day: 7 });
  });

  it('예상 지급일이 지났으면 다음 지급월로 넘어간다', () => {
    // 7월 7일이 지난 뒤 → 8월(예상 5일).
    expect(findNextPayout(FIXTURE_MONTHLY, localDate(2026, 7, 8))).toEqual({ kind: 'estimated-day', month: 8, day: 5 });
    expect(findNextPayout(FIXTURE_MONTHLY, localDate(2026, 12, 6))).toEqual({ kind: 'estimated-day', month: 1, day: 7 });
  });

  it('지급월이 하나뿐이고 그 달이 지났으면 같은 달의 다음 해 차례를 찾는다 (13개월 탐색)', () => {
    expect(findNextPayout(SINGLE_MONTH_PAY, localDate(2026, 3, 20))).toEqual({
      kind: 'estimated-day',
      month: 3,
      day: 5
    });
    expect(findNextPayout(SINGLE_MONTH_PAY, localDate(2026, 3, 5))).toEqual({
      kind: 'estimated-day',
      month: 3,
      day: 5
    });
  });

  it('분기 종목의 11월 지급일이 지나면 다음은 이듬해 2월이다', () => {
    expect(findNextPayout(FIXTURE_ODD_QUARTERLY, localDate(2026, 11, 20))).toEqual({
      kind: 'estimated-day',
      month: 2,
      day: 28
    });
  });

  it('2월은 윤년에도 28 그대로다 (스냅샷 값이 28 고정 — 29 로 올려잡지 않는다)', () => {
    expect(findNextPayout(FIXTURE_ODD_QUARTERLY, localDate(2028, 2, 1))).toEqual({
      kind: 'estimated-day',
      month: 2,
      day: 28
    });
  });

  it('그 달 일수를 넘는 값은 말일로 clamp 된다', () => {
    const overflowing: PortfolioMarketInfo = {
      ...FIXTURE_ODD_QUARTERLY,
      estimatedPayDayByMonth: { '2': 31, '5': 31, '8': 14, '11': 14 }
    };

    expect(findNextPayout(overflowing, localDate(2026, 2, 1))).toEqual({ kind: 'estimated-day', month: 2, day: 28 });
    expect(findNextPayout(overflowing, localDate(2028, 2, 1))).toEqual({ kind: 'estimated-day', month: 2, day: 29 });
    // 5월은 31일까지 있으므로 clamp 되지 않는다.
    expect(findNextPayout(overflowing, localDate(2026, 5, 1))).toEqual({ kind: 'estimated-day', month: 5, day: 31 });
  });

  it('resolvePortfolioPayoutDay 는 근거가 없으면 null 이다 (날짜를 지어내지 않는다)', () => {
    expect(resolvePortfolioPayoutDay(FIXTURE_MONTHLY, 2026, 7)).toBe(7);
    expect(resolvePortfolioPayoutDay(FIXTURE_QUARTERLY, 2026, 9)).toBeNull();
    expect(resolvePortfolioPayoutDay(FIXTURE_ODD_QUARTERLY, 2026, 3)).toBeNull();
    expect(getPortfolioDaysInMonth(2026, 2)).toBe(28);
    expect(getPortfolioDaysInMonth(2028, 2)).toBe(29);
  });
});

describe('findNextPayout — 근거가 없는 경우', () => {
  it('지급월 정보가 없으면 none (무배당·미갱신·수동 입력)', () => {
    expect(findNextPayout(FIXTURE_NO_SCHEDULE, localDate(2026, 7, 15))).toEqual({ kind: 'none' });
    expect(findNextPayout(FIXTURE_ZERO_YIELD, localDate(2026, 7, 15))).toEqual({ kind: 'none' });
    expect(findNextPayout(null, localDate(2026, 7, 15))).toEqual({ kind: 'none' });
  });

  it('유효하지 않은 날짜가 들어와도 던지지 않고 none 이다', () => {
    expect(findNextPayout(FIXTURE_MONTHLY, new Date(Number.NaN))).toEqual({ kind: 'none' });
  });
});

describe('요약 행에 붙는 #7', () => {
  it('행마다 자기 근거 등급의 다음 지급일을 갖는다', () => {
    const summary = computePortfolioSummary(
      [
        { ticker: 'MONTHLY', quantity: 10 },
        { ticker: 'QUARTERLY', quantity: 10 },
        { ticker: 'NOSCHED', quantity: 10 },
        { ticker: 'ZZZZ', quantity: 10, manual: { price: 50, dividendYield: 3 } }
      ],
      { today: localDate(2026, 7, 15), resolve: fixtureResolver }
    );

    expect(summary.holdings.map((row) => row.nextPayout)).toEqual([
      { kind: 'estimated-day', month: 8, day: 5 },
      { kind: 'month-only', month: 9 },
      { kind: 'none' },
      { kind: 'none' }
    ]);
  });

  it('수량이 없어도 다음 지급일은 알려준다 (수량과 무관한 사실)', () => {
    const summary = computePortfolioSummary([{ ticker: 'QUARTERLY', quantity: 0 }], {
      today: localDate(2026, 7, 15),
      resolve: fixtureResolver
    });

    expect(summary.holdings[0].exclusion).toBe('no-quantity');
    expect(summary.holdings[0].nextPayout).toEqual({ kind: 'month-only', month: 9 });
  });
});
