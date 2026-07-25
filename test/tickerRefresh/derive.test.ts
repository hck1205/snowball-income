import { describe, expect, it } from 'vitest';
import { computeDividendCagr, computeTtmYield, inferFrequency, inferPayoutMonths, roundTo } from '@/scripts/tickerRefresh';
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
