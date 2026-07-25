import { describe, expect, it } from 'vitest';
import {
  computeDividendCagr,
  computeTtmYield,
  deriveEstimatedPayDays,
  inferFrequency,
  inferPayoutMonths,
  roundTo
} from '@/scripts/tickerRefresh';
import type { DividendPayment } from '@/scripts/tickerRefresh';
import { JEPI_DIVIDENDS, monthlyHistory, quarterlyHistory, SCHD_DIVIDENDS } from './fixtures';

const AS_OF = '2026-07-14';

describe('computeTtmYield', () => {
  it('sums only the dividends paid in the 12 months ending at asOf', () => {
    // 2025-09-20 + 2025-12-20 (0.265 each) + 2026-03-20 + 2026-06-20 (0.28 each) = 1.09
    expect(computeTtmYield(SCHD_DIVIDENDS, 32.1, AS_OF)).toBeCloseTo((1.09 / 32.1) * 100, 6);
  });

  it('ignores dividends older than the window', () => {
    const dividends = [
      { date: '2020-01-01', amount: 100 },
      { date: '2026-01-15', amount: 1 }
    ];
    expect(computeTtmYield(dividends, 100, AS_OF)).toBeCloseTo(1, 6);
  });

  it('counts a special dividend inside the window', () => {
    const dividends = [
      { date: '2026-01-15', amount: 1 },
      { date: '2026-02-15', amount: 4 }
    ];
    expect(computeTtmYield(dividends, 100, AS_OF)).toBeCloseTo(5, 6);
  });

  it('returns null for an empty history', () => {
    expect(computeTtmYield([], 100, AS_OF)).toBeNull();
  });

  it('returns null when no dividend falls inside the window', () => {
    expect(computeTtmYield([{ date: '2020-01-01', amount: 1 }], 100, AS_OF)).toBeNull();
  });

  it.each([0, -5, Number.NaN, Number.POSITIVE_INFINITY])('returns null for an invalid price (%s)', (price) => {
    expect(computeTtmYield(SCHD_DIVIDENDS, price, AS_OF)).toBeNull();
  });

  it('returns null for an unparseable asOf', () => {
    expect(computeTtmYield(SCHD_DIVIDENDS, 32.1, 'not-a-date')).toBeNull();
  });

  it('skips malformed payments instead of poisoning the sum with NaN', () => {
    const dividends = [
      { date: '2026-01-15', amount: Number.NaN },
      { date: 'garbage', amount: 1 },
      { date: '2026-02-15', amount: -1 },
      { date: '2026-03-15', amount: 2 }
    ];
    expect(computeTtmYield(dividends, 100, AS_OF)).toBeCloseTo(2, 6);
  });
});

describe('inferFrequency', () => {
  it('detects quarterly', () => {
    expect(inferFrequency(SCHD_DIVIDENDS)).toBe('quarterly');
  });

  it('detects monthly', () => {
    expect(inferFrequency(JEPI_DIVIDENDS)).toBe('monthly');
  });

  it('detects semiannual', () => {
    expect(
      inferFrequency([
        { date: '2025-09-10', amount: 1 },
        { date: '2026-03-10', amount: 1 }
      ])
    ).toBe('semiannual');
  });

  it('detects annual', () => {
    expect(
      inferFrequency([
        { date: '2024-05-10', amount: 1 },
        { date: '2025-05-10', amount: 1 },
        { date: '2026-05-10', amount: 1 }
      ])
    ).toBe('annual');
  });

  it('stays quarterly when a special dividend adds a 5th payment', () => {
    const withSpecial = [...quarterlyHistory({ 2025: 4, 2026: 4 }), { date: '2026-05-02', amount: 3 }];
    expect(inferFrequency(withSpecial)).toBe('quarterly');
  });

  it('stays monthly when a couple of months are missing from the data', () => {
    const patchy = monthlyHistory({ 2026: 12 }).filter(
      (payment) => !payment.date.startsWith('2026-04') && !payment.date.startsWith('2026-08')
    );
    expect(inferFrequency(patchy)).toBe('monthly');
  });

  it('uses the latest payment (not today) as the window anchor, so stale data is not undercounted', () => {
    // Data stops in 2023, but the cadence is still clearly quarterly.
    expect(inferFrequency(quarterlyHistory({ 2022: 4, 2023: 4 }))).toBe('quarterly');
  });

  it('returns annual for a single payment', () => {
    expect(inferFrequency([{ date: '2026-01-05', amount: 1 }])).toBe('annual');
  });

  it('returns null for an empty history', () => {
    expect(inferFrequency([])).toBeNull();
  });

  it('returns null when every payment is malformed', () => {
    expect(inferFrequency([{ date: 'nope', amount: 1 }])).toBeNull();
  });
});

describe('computeDividendCagr', () => {
  it('computes CAGR from complete calendar years', () => {
    // 2025 total 1.06 vs 2020 total 0.72 over 5 years.
    const expected = ((1.06 / 0.72) ** (1 / 5) - 1) * 100;
    expect(computeDividendCagr(SCHD_DIVIDENDS, 5)).toBeCloseTo(expected, 6);
  });

  it('excludes the partially-paid current year, so a mid-year snapshot is not read as a cut', () => {
    // SCHD_DIVIDENDS has only 2 of 4 payments in 2026; including it would understate growth.
    const cagr = computeDividendCagr(SCHD_DIVIDENDS, 5);
    expect(cagr).not.toBeNull();
    expect(cagr as number).toBeGreaterThan(0);
  });

  it('uses the latest year when it is complete', () => {
    const complete = quarterlyHistory({ 2020: 1, 2021: 1.1, 2022: 1.2, 2023: 1.3, 2024: 1.4, 2025: 2 });
    const expected = ((2 / 1) ** (1 / 5) - 1) * 100;
    expect(computeDividendCagr(complete, 5)).toBeCloseTo(expected, 6);
  });

  it('handles a dividend cut (negative CAGR)', () => {
    const cut = quarterlyHistory({ 2023: 4, 2024: 3, 2025: 2 });
    const expected = ((2 / 4) ** (1 / 2) - 1) * 100;
    expect(computeDividendCagr(cut, 2)).toBeCloseTo(expected, 6);
    expect(computeDividendCagr(cut, 2) as number).toBeLessThan(0);
  });

  it('returns null when history is shorter than the requested window', () => {
    expect(computeDividendCagr(quarterlyHistory({ 2024: 1, 2025: 1.1 }), 5)).toBeNull();
  });

  it('returns null when the base year is incomplete (would fake explosive growth)', () => {
    const thinBaseYear = [
      { date: '2021-12-20', amount: 0.25 },
      ...quarterlyHistory({ 2022: 1, 2023: 1.1, 2024: 1.2, 2025: 1.3, 2026: 1.4 })
    ];
    expect(computeDividendCagr(thinBaseYear, 5)).toBeNull();
  });

  it('returns null for an empty history', () => {
    expect(computeDividendCagr([], 5)).toBeNull();
  });

  it('returns null for a single payment', () => {
    expect(computeDividendCagr([{ date: '2026-01-01', amount: 1 }], 5)).toBeNull();
  });

  it.each([0, -1, 1.5])('returns null for an invalid year window (%s)', (years) => {
    expect(computeDividendCagr(SCHD_DIVIDENDS, years)).toBeNull();
  });
});

describe('roundTo', () => {
  it('rounds to the requested precision', () => {
    expect(roundTo(3.14159, 2)).toBe(3.14);
    expect(roundTo(1.005, 2)).toBe(1.01);
    expect(roundTo(-2.345, 1)).toBe(-2.3);
  });
});

/**
 * 지급월 추론 — 배당 캘린더의 전제.
 *
 * `inferFrequency` 는 "얼마나 자주"만 답한다. 캘린더는 "언제"가 있어야 값어치가 있다 —
 * SCHD 와 JEPI 를 엔진은 구분하지 못하지만 사용자에게는 3·6·9·12월과 매월이 전혀 다른 화면이다.
 */
describe('inferPayoutMonths', () => {
  it('분기 지급의 실제 지급월을 오름차순으로 낸다', () => {
    expect(inferPayoutMonths(SCHD_DIVIDENDS, 'quarterly')).toEqual([3, 6, 9, 12]);
  });

  it('월 지급은 12개월 전부를 낸다', () => {
    expect(inferPayoutMonths(JEPI_DIVIDENDS, 'monthly')).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });

  it('특별배당이 낀 달을 지급월로 승격시키지 않는다', () => {
    // 정규 분기 지급(3·6·9·12) 위에 2026-02 특별배당 1회. 빈도가 낮아 상위 4개에 들지 못한다.
    const withSpecial = [...SCHD_DIVIDENDS, { date: '2026-02-10', amount: 0.5 }];
    expect(inferPayoutMonths(withSpecial, 'quarterly')).toEqual([3, 6, 9, 12]);
  });

  it('빈도가 허용하는 개수까지만 남긴다', () => {
    expect(inferPayoutMonths(SCHD_DIVIDENDS, 'semiannual')).toHaveLength(2);
    expect(inferPayoutMonths(SCHD_DIVIDENDS, 'annual')).toHaveLength(1);
  });

  it('지급 이력이 없으면 null — 호출부가 이전 값을 지키게 한다', () => {
    expect(inferPayoutMonths([], 'quarterly')).toBeNull();
    expect(inferPayoutMonths([{ date: 'not-a-date', amount: 1 }], 'quarterly')).toBeNull();
    expect(inferPayoutMonths([{ date: '2026-01-01', amount: 0 }], 'quarterly')).toBeNull();
  });

  it('같은 이력에서 항상 같은 결과가 나온다 (동률은 이른 달 우선)', () => {
    // 세 달이 각 1회씩 동률 — 빈도상 2개만 남으므로 이른 달 둘이 결정론적으로 선택된다.
    const tied = [
      { date: '2026-02-10', amount: 1 },
      { date: '2026-05-10', amount: 1 },
      { date: '2026-08-10', amount: 1 }
    ];
    expect(inferPayoutMonths(tied, 'semiannual')).toEqual([2, 5]);
    expect(inferPayoutMonths([...tied].reverse(), 'semiannual')).toEqual([2, 5]);
  });
});

/**
 * 월 지급의 월말 경계 문제 — 실제 JEPI 데이터로 확인한 회귀.
 *
 * JEPI 의 ex-date 는 매월 첫 영업일이라 1월 배당이 `2025-12-31` 로 찍힌다. 월을 세면 12월이 두 번,
 * 1월이 0번이 되어 "JEPI 는 1월에 안 준다"는 오답이 나온다. 빈도가 이미 답한 것을 다시 추론하지
 * 않는 것이 해법이다.
 */
describe('inferPayoutMonths — 월 지급 경계', () => {
  it('ex-date 가 전월 말일로 밀려도 12개월 전부를 낸다', () => {
    const boundaryShifted = [
      { date: '2025-10-01', amount: 0.37 },
      { date: '2025-11-03', amount: 0.37 },
      { date: '2025-12-01', amount: 0.37 },
      { date: '2025-12-31', amount: 0.37 }, // 실제로는 2026년 1월분
      { date: '2026-02-02', amount: 0.37 },
      { date: '2026-03-02', amount: 0.37 }
    ];
    expect(inferPayoutMonths(boundaryShifted, 'monthly')).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });

  it('이력이 아예 없으면 월 지급이라도 null 이다 (없는 사실을 지어내지 않는다)', () => {
    expect(inferPayoutMonths([], 'monthly')).toBeNull();
  });
});

/** 배당락 이력 생성기 — `years × months` 전부 같은 일자에 지급한다. */
const exHistory = (
  years: readonly number[],
  months: readonly number[],
  day: number
): DividendPayment[] =>
  years.flatMap((year) =>
    months.map((month) => ({
      date: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      amount: 0.5
    }))
  );

const RECENT_YEARS = [2024, 2025, 2026];

/**
 * 예상 지급일 — 캘린더가 "며칠"을 그리는 근거.
 *
 * 일일 갱신은 **배당락일**만 본다. 실제 입금일은 거기에 `exToPayLagDays` 를 더해야 나오고,
 * 그 덧셈이 달을 넘기는 순간(ABBV 30일, KO 17일) 월 키가 통째로 틀린다 — 이 블록이 지키는 게
 * 그 지점이다.
 */
describe('deriveEstimatedPayDays', () => {
  it('배당락 중앙값 + lag 를 지급월 키에 붙인다 (월 넘김 포함)', () => {
    // ABBV 형: 1·4·7·10월 15일 배당락, lag 30일 → 실제 지급은 2·5·8·11월.
    const result = deriveEstimatedPayDays({
      dividends: exHistory(RECENT_YEARS, [1, 4, 7, 10], 15),
      exToPayLagDays: 30,
      payMonths: [2, 5, 8, 11]
    });

    // 1/15+30=2/14, 4/15+30=5/15(30일 달), 7/15+30=8/14, 10/15+30=11/14.
    expect(result).toEqual({ '2': 14, '5': 15, '8': 14, '11': 14 });
  });

  it('배당락월을 그대로 쓰지 않는다 — lag 가 0이면 그때만 두 기준이 같다', () => {
    const dividends = exHistory(RECENT_YEARS, [1, 4, 7, 10], 15);
    expect(deriveEstimatedPayDays({ dividends, exToPayLagDays: 0, payMonths: [1, 4, 7, 10] })).toEqual({
      '1': 15,
      '4': 15,
      '7': 15,
      '10': 15
    });
  });

  it('한 해만 며칠 밀려도 중앙값은 흔들리지 않는다', () => {
    const dividends = [
      ...exHistory([2024, 2025], [3, 6, 9, 12], 20),
      ...exHistory([2026], [3], 27), // 그 해만 일주일 밀린 3월
      ...exHistory([2026], [6, 9, 12], 20)
    ];

    const result = deriveEstimatedPayDays({ dividends, exToPayLagDays: 3, payMonths: [3, 6, 9, 12] });

    // 3월 표본은 [23, 23, 30] — 평균이면 25일이지만 중앙값은 23일 그대로다.
    expect(result?.['3']).toBe(23);
  });

  it('특별배당은 지급월을 새로 만들지도, 기존 일자를 밀지도 못한다', () => {
    const dividends = [
      ...exHistory(RECENT_YEARS, [3, 6, 9, 12], 20),
      { date: '2026-02-10', amount: 1.5 }, // 지급월 밖 1회성
      { date: '2026-03-01', amount: 1.5 } // 정규 지급월 안 1회성
    ];

    const result = deriveEstimatedPayDays({ dividends, exToPayLagDays: 3, payMonths: [3, 6, 9, 12] });

    expect(result).toEqual({ '3': 23, '6': 23, '9': 23, '12': 23 });
  });

  it('KO 형: lag 중앙값이 월말을 아슬아슬하게 못 넘겨도 지급월 키로 옮긴다', () => {
    // 실제 KO — 배당락 3/14·6/13·9/12·11/28, 관측 lag 17일, 실제 지급 4/1·7/1·10/1·12/15.
    // 3/14+17 = 3/31 로 "3월"이 나오지만 권위 있는 payoutMonths 는 4월이다.
    const dividends = [
      ...exHistory(RECENT_YEARS, [3], 14),
      ...exHistory(RECENT_YEARS, [6], 13),
      ...exHistory(RECENT_YEARS, [9], 12),
      ...exHistory(RECENT_YEARS, [11], 28)
    ];

    const result = deriveEstimatedPayDays({ dividends, exToPayLagDays: 17, payMonths: [4, 7, 10, 12] });

    // 경계로 밀린 셋은 다음 달 1일, 월 안에서 끝난 12월만 실제 중앙값(15일).
    expect(result).toEqual({ '4': 1, '7': 1, '10': 1, '12': 15 });
  });

  it('추정이 다음 달 초로 넘쳤고 지급월이 전월이면 전월 말일로 되돌린다', () => {
    // 3월 말 지급 펀드인데 lag 를 이틀 더 잡아 4/1 로 계산된 경우.
    const result = deriveEstimatedPayDays({
      dividends: exHistory(RECENT_YEARS, [3], 30),
      exToPayLagDays: 2,
      payMonths: [3]
    });

    expect(result).toEqual({ '3': 31 });
  });

  it('윤년 2월 29일은 28일로 클램프한다 (연도 없는 필드라 29일은 4년 중 3년은 없는 날)', () => {
    const result = deriveEstimatedPayDays({
      dividends: [{ date: '2024-02-27', amount: 0.5 }],
      exToPayLagDays: 2,
      payMonths: [2]
    });

    expect(result).toEqual({ '2': 28 });
  });

  it('지급월과 한 달 넘게 어긋나는 달은 만들지 않고 버린다', () => {
    // 5월 중순 추정 — 경계 문제가 아니라 데이터 불일치다. 없는 지급을 그리느니 비운다.
    const result = deriveEstimatedPayDays({
      dividends: exHistory(RECENT_YEARS, [5], 15),
      exToPayLagDays: 3,
      payMonths: [3, 6, 9, 12]
    });

    expect(result).toBeNull();
  });

  it('근거 없는 달은 비워 둔다 — 부분 결과는 정상이다 (UI 가 "날짜 미정"으로 받는다)', () => {
    const result = deriveEstimatedPayDays({
      dividends: exHistory(RECENT_YEARS, [3, 6], 20),
      exToPayLagDays: 3,
      payMonths: [3, 6, 9, 12]
    });

    expect(result).toEqual({ '3': 23, '6': 23 });
  });

  it('lag·지급월·이력 중 하나라도 없으면 null 이다 (추정 근거 부족)', () => {
    const dividends = exHistory(RECENT_YEARS, [3, 6, 9, 12], 20);

    expect(deriveEstimatedPayDays({ dividends, exToPayLagDays: -1, payMonths: [3] })).toBeNull();
    expect(deriveEstimatedPayDays({ dividends, exToPayLagDays: Number.NaN, payMonths: [3] })).toBeNull();
    expect(deriveEstimatedPayDays({ dividends, exToPayLagDays: 3, payMonths: [] })).toBeNull();
    expect(deriveEstimatedPayDays({ dividends: [], exToPayLagDays: 3, payMonths: [3] })).toBeNull();
    expect(
      deriveEstimatedPayDays({ dividends: [{ date: 'nope', amount: 1 }], exToPayLagDays: 3, payMonths: [3] })
    ).toBeNull();
  });

  it('월 지급도 12개월 전부에 일자를 채운다 (경계로 밀린 달 포함)', () => {
    const result = deriveEstimatedPayDays({
      dividends: monthlyHistory({ 2024: 12, 2025: 12, 2026: 12 }),
      exToPayLagDays: 3,
      payMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
    });

    // 매월 15일 배당락 + 3일.
    expect(result).toEqual(
      Object.fromEntries(Array.from({ length: 12 }, (_, index) => [String(index + 1), 18]))
    );
  });

  it('같은 이력이면 항상 같은 결과다 (입력 순서 무관)', () => {
    const dividends = exHistory(RECENT_YEARS, [1, 4, 7, 10], 15);
    const forward = deriveEstimatedPayDays({ dividends, exToPayLagDays: 30, payMonths: [2, 5, 8, 11] });
    const reversed = deriveEstimatedPayDays({
      dividends: [...dividends].reverse(),
      exToPayLagDays: 30,
      payMonths: [2, 5, 8, 11]
    });

    expect(reversed).toEqual(forward);
  });

  it('키는 월 오름차순, 값은 1~31 정수다 (스키마가 요구하는 형태)', () => {
    const result = deriveEstimatedPayDays({
      dividends: exHistory(RECENT_YEARS, [1, 4, 7, 10], 15),
      exToPayLagDays: 30,
      payMonths: [2, 5, 8, 11]
    });

    expect(Object.keys(result ?? {})).toEqual(['2', '5', '8', '11']);
    for (const day of Object.values(result ?? {})) {
      expect(Number.isInteger(day)).toBe(true);
      expect(day).toBeGreaterThanOrEqual(1);
      expect(day).toBeLessThanOrEqual(31);
    }
  });
});
