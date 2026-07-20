import { SCENARIO_PAYLOAD_MATRIX, buildMatrixPayload, MATRIX_SCHD, MATRIX_SEMI, MATRIX_VIG } from './scenarioPayloadMatrix';
import { buildSnowballReport } from '@/shared/lib/snowball';
import type { SnowballReport } from '@/shared/lib/snowball';

/**
 * `buildSnowballReport`의 **불변식**을 payload 행렬 전체에서 고정한다.
 *
 * 개별 케이스 회귀(report.test.ts)와 달리 여기서는 "어떤 입력에서도 깨지면 안 되는 성질"만 본다:
 * 3분해 항등식 / 가중평균 정의 / 캘린더 12칸·시간 순 / 목표 0 가드 / NaN·Infinity 무유출.
 * 한 케이스라도 깨지면 그 payload 이름이 실패 메시지에 남는다.
 */

const reports: { name: string; report: SnowballReport }[] = SCENARIO_PAYLOAD_MATRIX.map(({ name, payload }) => {
  const report = buildSnowballReport(payload);
  if (!report) throw new Error(`행렬 케이스가 리포트를 만들지 못했습니다: ${name}`);
  return { name, report };
});

const cases = reports.map(({ name }, index) => [name, index] as const);

/** 리포트 안의 모든 숫자를 훑는다 — 종이에 NaN/Infinity가 인쇄되면 그 자체로 사고다. */
const collectNumbers = (value: unknown, path: string, out: [string, number][]): void => {
  if (typeof value === 'number') {
    out.push([path, value]);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectNumbers(item, `${path}[${index}]`, out));
    return;
  }
  if (value && typeof value === 'object') {
    Object.entries(value).forEach(([key, item]) => collectNumbers(item, `${path}.${key}`, out));
  }
};

describe('buildSnowballReport 불변식 — 항등식', () => {
  it.each(cases)('%s — 원금 + 재투자배당 + 시세평가이익 = 최종 자산', (_name, index) => {
    const { composition, outcome } = reports[index].report;
    const sum = composition.contribution + composition.reinvestedDividend + composition.marketGain;

    // 부동소수 오차 범위: 최종 자산의 1e-9 상대오차(또는 1원) 이내.
    const tolerance = Math.max(1, Math.abs(outcome.finalAssetValue) * 1e-9);
    expect(Math.abs(sum - outcome.finalAssetValue)).toBeLessThanOrEqual(tolerance);
  });

  it.each(cases)('%s — 취득원가 = 원금 + 재투자배당, 평가이익 = 최종자산 − 취득원가', (_name, index) => {
    const { composition, outcome, taxes } = reports[index].report;

    expect(taxes.totalCostBasis).toBeCloseTo(composition.contribution + composition.reinvestedDividend, 6);
    expect(taxes.unrealizedGain).toBeCloseTo(outcome.finalAssetValue - taxes.totalCostBasis, 6);
    expect(taxes.afterCapitalGainsTaxValue).toBeCloseTo(
      outcome.finalAssetValue - taxes.estimatedCapitalGainsTax,
      6
    );
  });

  it.each(cases)('%s — 종목별 기여 배당·평가액의 합이 포트폴리오 합계와 같다', (_name, index) => {
    const { portfolio, outcome } = reports[index].report;
    const dividendSum = portfolio.holdings.reduce((sum, item) => sum + item.finalAnnualDividend, 0);
    const assetSum = portfolio.holdings.reduce((sum, item) => sum + item.finalAssetValue, 0);

    expect(dividendSum).toBeCloseTo(outcome.finalAnnualDividend, 6);
    expect(assetSum).toBeCloseTo(outcome.finalAssetValue, 6);
  });

  it.each(cases)('%s — 월평균 배당 = 연 배당 / 12', (_name, index) => {
    const { outcome } = reports[index].report;
    expect(outcome.finalMonthlyAverageDividend).toBeCloseTo(outcome.finalAnnualDividend / 12, 9);
  });
});

describe('buildSnowballReport 불변식 — 비중과 가중평균', () => {
  it.each(cases)('%s — 정규화 비중의 합은 1이고 음수가 없다', (_name, index) => {
    const { holdings } = reports[index].report.portfolio;

    expect(holdings.reduce((sum, item) => sum + item.weight, 0)).toBeCloseTo(1, 10);
    holdings.forEach((item) => expect(item.weight).toBeGreaterThanOrEqual(0));
  });

  it.each(cases)('%s — 가중평균 배당률/성장률/총수익률이 정규화 비중 기준 Σ와 같다', (_name, index) => {
    const { portfolio } = reports[index].report;
    const weighted = (getValue: (holding: (typeof portfolio.holdings)[number]) => number): number =>
      portfolio.holdings.reduce((sum, item) => sum + getValue(item) * item.weight, 0);

    expect(portfolio.weightedAverageDividendYieldPercent).toBeCloseTo(
      weighted((item) => item.dividendYieldPercent),
      10
    );
    expect(portfolio.weightedAverageDividendGrowthPercent).toBeCloseTo(
      weighted((item) => item.dividendGrowthPercent),
      10
    );
    // 정합 모델: 총수익률은 배당률 + 배당성장률의 파생값이라 가중평균도 두 값의 합이어야 한다.
    expect(portfolio.weightedAverageExpectedTotalReturnPercent).toBeCloseTo(
      portfolio.weightedAverageDividendYieldPercent + portfolio.weightedAverageDividendGrowthPercent,
      10
    );
  });

  it.each(cases)('%s — 주기 분포의 종목 수·비중 합이 보유 종목과 일치한다', (_name, index) => {
    const { portfolio } = reports[index].report;
    const mixCount = portfolio.frequencyMix.reduce((sum, item) => sum + item.tickerCount, 0);
    const mixWeight = portfolio.frequencyMix.reduce((sum, item) => sum + item.weight, 0);

    expect(mixCount).toBe(portfolio.tickerCount);
    expect(mixCount).toBe(portfolio.holdings.length);
    expect(mixWeight).toBeCloseTo(1, 10);
    // 존재하지 않는 주기는 목록에 없다.
    portfolio.frequencyMix.forEach((item) => expect(item.tickerCount).toBeGreaterThan(0));
  });

  it.each(cases)('%s — 배분 금액은 입력 금액 × 비중이다', (_name, index) => {
    const { inputs, portfolio } = reports[index].report;

    portfolio.holdings.forEach((holding) => {
      expect(holding.allocatedInitialInvestment).toBeCloseTo(inputs.initialInvestment * holding.weight, 6);
      expect(holding.allocatedMonthlyContribution).toBeCloseTo(inputs.monthlyContribution * holding.weight, 6);
    });
  });
});

describe('buildSnowballReport 불변식 — 12개월 캘린더', () => {
  it.each(cases)('%s — 길이 12 · 시간 순 연속 · 합계 = 마지막 해 연 배당', (_name, index) => {
    const { finalYearCalendar, outcome } = reports[index].report;

    expect(finalYearCalendar).toHaveLength(12);
    expect(finalYearCalendar.reduce((sum, item) => sum + item.amount, 0)).toBeCloseTo(
      outcome.finalAnnualDividend,
      6
    );

    // 달력 1~12월 정렬이 아니라 "마지막 12개월"이다 — 시간 순으로 한 달씩 이어져야 한다.
    finalYearCalendar.slice(1).forEach((item, offset) => {
      const previous = finalYearCalendar[offset];
      const expectedMonth = previous.month === 12 ? 1 : previous.month + 1;
      const expectedYear = previous.month === 12 ? previous.year + 1 : previous.year;

      expect([item.year, item.month]).toEqual([expectedYear, expectedMonth]);
    });

    finalYearCalendar.forEach((item) => expect(item.amount).toBeGreaterThanOrEqual(0));
  });

  it('시작월이 1월이 아니면 캘린더는 1월에서 시작하지 않는다 (달력월 정렬이 아니다)', () => {
    const report = buildSnowballReport(
      buildMatrixPayload(
        [MATRIX_SCHD, MATRIX_VIG, MATRIX_SEMI],
        { t1: 50, t3: 30, t4: 20 },
        { investmentStartDate: '2024-07-01', durationYears: 10 }
      )
    )!;
    const calendar = report.finalYearCalendar;

    // 2024-07 시작 · 10년(120개월) → 마지막 12개월은 2033-07 ~ 2034-06.
    expect([calendar[0].year, calendar[0].month]).toEqual([2033, 7]);
    expect([calendar[11].year, calendar[11].month]).toEqual([2034, 6]);
    // 두 해에 걸쳐 있으므로 연도가 하나가 아니다.
    expect(new Set(calendar.map((item) => item.year)).size).toBe(2);
  });
});

describe('buildSnowballReport 불변식 — 목표 가드와 수치 위생', () => {
  it.each(cases)('%s — 목표가 없으면 달성 필드가 전부 null이다', (_name, index) => {
    const { target } = reports[index].report;

    expect(target.hasTarget).toBe(target.targetMonthlyDividend > 0);
    if (!target.hasTarget) {
      expect(target.reachedInYears).toBeNull();
      expect(target.reachedYearLabel).toBeNull();
      expect(target.finalProgressRatio).toBeNull();
    }
  });

  it.each(cases)('%s — 달성 연차는 1..기간 범위 안이고 연도 라벨과 정합한다', (_name, index) => {
    const { target, yearly } = reports[index].report;
    if (target.reachedInYears === null) return;

    expect(target.reachedInYears).toBeGreaterThanOrEqual(1);
    expect(target.reachedInYears).toBeLessThanOrEqual(yearly.length);
    expect(target.reachedYearLabel).toBe(yearly[target.reachedInYears - 1].year);
    // 그 해의 월평균 배당은 목표 이상이어야 한다.
    expect(yearly[target.reachedInYears - 1].monthlyDividend).toBeGreaterThanOrEqual(
      target.targetMonthlyDividend
    );
  });

  it.each(cases)('%s — 리포트 어디에도 NaN·Infinity가 없다', (_name, index) => {
    const numbers: [string, number][] = [];
    collectNumbers(reports[index].report, 'report', numbers);

    const dirty = numbers.filter(([, value]) => !Number.isFinite(value));
    expect(dirty).toEqual([]);
    expect(numbers.length).toBeGreaterThan(50);
  });

  it.each(cases)('%s — 연도별 행 수 = 투자 기간(년)', (_name, index) => {
    const { yearly, inputs } = reports[index].report;

    expect(yearly).toHaveLength(inputs.durationYears);
    // 연도는 오름차순으로 1년씩 증가한다.
    yearly.slice(1).forEach((row, offset) => expect(row.year).toBe(yearly[offset].year + 1));
  });
});
