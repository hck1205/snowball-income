// @vitest-environment node — DOM 을 쓰지 않는 순수 테스트 (기준: vitest.config.ts)
import { SCENARIO_PAYLOAD_MATRIX, buildMatrixPayload, MATRIX_JEPI, MATRIX_SCHD, MATRIX_VIG } from './scenarioPayloadMatrix';
import type { PortfolioMonthlyPoint, YieldFormValues } from '@/shared/types';
import {
  aggregateMonthly,
  currentMonthlyDividend,
  defaultYieldFormValues,
  findTargetMonth,
  findTargetYear,
  runScenarioPayload,
  runSimulation,
  toSimulationInput
} from '@/shared/lib/snowball';

/**
 * 목표 달성(월 해상도) 계산 — `aggregateMonthly` / `findTargetMonth` / `currentMonthlyDividend`.
 *
 * 세 함수는 **같은 식**(직전 12개월 세후 배당합 ÷ 12)을 공유해야 한다. 그래야 화면의
 * 현재값 · 달성률 · 예상 달성월이 서로 어긋나지 않는다. 아래 테스트는 그 정합과,
 * 연 해상도(`findTargetYear`)와의 불변식, 지급 주기 off-by-one 을 고정한다.
 */

const buildValues = (overrides: Partial<YieldFormValues> = {}): YieldFormValues => ({
  ...defaultYieldFormValues,
  ...overrides
});

/** 재투자·적립 없이 "1주당 배당만" 보는 결정적 픽스처 (지급 주기 판정 전용). */
const buildFlatValues = (overrides: Partial<YieldFormValues> = {}): YieldFormValues =>
  buildValues({
    initialPrice: 100,
    initialInvestment: 1_200,
    monthlyContribution: 0,
    dividendYield: 10,
    dividendGrowth: 0,
    expectedTotalReturn: 10,
    taxRate: 0,
    reinvestDividends: false,
    durationYears: 3,
    investmentStartDate: '2026-01-01',
    ...overrides
  });

const runPortfolio = (payload: unknown) => {
  const run = runScenarioPayload(payload);
  if (!run) throw new Error('payload 실행 실패 — 픽스처가 잘못됐다');

  return run;
};

describe('aggregateMonthly — 달력 연·월 합산', () => {
  it('단일 종목이면 원본 월 스냅샷과 같은 값이다 (합산이 항등)', () => {
    const run = runPortfolio(buildMatrixPayload([MATRIX_SCHD], { t1: 100 }, { durationYears: 3 }));
    const [output] = run.outputs;

    expect(run.monthly).toHaveLength(36);
    run.monthly.forEach((point, index) => {
      const snapshot = output.monthly[index];
      expect(point.monthIndex).toBe(snapshot.monthIndex);
      expect(point.year).toBe(snapshot.year);
      expect(point.month).toBe(snapshot.month);
      expect(point.dividendPaid).toBe(snapshot.dividendPaid);
      expect(point.taxPaid).toBe(snapshot.taxPaid);
      expect(point.portfolioValue).toBe(snapshot.portfolioValue);
      expect(point.cumulativeDividend).toBe(snapshot.cumulativeDividend);
    });
  });

  it('여러 종목이면 같은 달의 값을 종목별로 더한다', () => {
    const payload = buildMatrixPayload([MATRIX_SCHD, MATRIX_JEPI, MATRIX_VIG], { t1: 50, t2: 30, t3: 20 }, { durationYears: 5 });
    const run = runPortfolio(payload);

    expect(run.monthly).toHaveLength(60);
    run.monthly.forEach((point, index) => {
      const expectedDividend = run.outputs.reduce((sum, output) => sum + output.monthly[index].dividendPaid, 0);
      const expectedValue = run.outputs.reduce((sum, output) => sum + output.monthly[index].portfolioValue, 0);

      expect(point.dividendPaid).toBeCloseTo(expectedDividend, 8);
      expect(point.portfolioValue).toBeCloseTo(expectedValue, 8);
    });
  });

  it('비-1월 시작에서도 달력 연·월이 연속으로 증가한다 (롤오버)', () => {
    const run = runPortfolio(
      buildMatrixPayload([MATRIX_SCHD, MATRIX_JEPI], { t1: 50, t2: 50 }, { investmentStartDate: '2024-07-01', durationYears: 2 })
    );

    expect(run.monthly[0]).toMatchObject({ monthIndex: 1, year: 2024, month: 7 });
    expect(run.monthly[5]).toMatchObject({ monthIndex: 6, year: 2024, month: 12 });
    expect(run.monthly[6]).toMatchObject({ monthIndex: 7, year: 2025, month: 1 });
    expect(run.monthly[23]).toMatchObject({ monthIndex: 24, year: 2026, month: 6 });

    run.monthly.forEach((point, index) => {
      if (index === 0) return;
      const previous = run.monthly[index - 1];
      expect(point.year * 12 + point.month).toBe(previous.year * 12 + previous.month + 1);
    });
  });

  it('12개월째 롤링 평균은 연 해상도 1년차 monthlyDividend 와 같다 (같은 정의)', () => {
    const run = runPortfolio(buildMatrixPayload([MATRIX_SCHD, MATRIX_JEPI, MATRIX_VIG], { t1: 40, t2: 40, t3: 20 }));

    [1, 2, 3, 10].forEach((yearIndex) => {
      const rolling = run.monthly
        .slice((yearIndex - 1) * 12, yearIndex * 12)
        .reduce((sum, point) => sum + point.dividendPaid, 0) / 12;

      expect(rolling).toBeCloseTo(run.yearly[yearIndex - 1].monthlyDividend, 6);
    });
  });

  it('빈 입력이면 빈 배열 (던지지 않는다)', () => {
    expect(aggregateMonthly([])).toEqual([]);
  });
});

describe('findTargetMonth — 지급 주기 off-by-one', () => {
  /**
   * 성장 0 · 재투자 OFF · 적립 0 이면 1년치 세후 배당은 주기와 무관하게 같다(연 120원).
   * 다만 **언제 채워지는가**가 다르다: monthly 는 매달, quarterly 는 3·6·9·12개월째,
   * semiannual 은 6·12, annual 은 12개월째에만 들어온다.
   * 목표를 "연배당 ÷ 12"(=10원)로 잡으면 롤링 12개월 창이 꽉 차는 **12개월째**에 처음 도달해야 한다.
   */
  const TARGET = 10;

  it.each([
    ['monthly', 12],
    ['quarterly', 12],
    ['semiannual', 12],
    ['annual', 12]
  ] as const)('%s — 연 목표치는 정확히 %i개월째에 도달한다', (frequency, expectedMonthIndex) => {
    const result = runSimulation(toSimulationInput(buildFlatValues({ frequency })));
    const reached = findTargetMonth(result.monthly, TARGET);

    expect(reached).not.toBeNull();
    expect(reached?.monthIndex).toBe(expectedMonthIndex);
    expect(reached?.year).toBe(2026);
    expect(reached?.month).toBe(12);
    expect(reached?.monthlyDividend).toBeCloseTo(TARGET, 8);
  });

  it('11개월째까지는 창이 덜 차 미달이다 (분기·반기·연배당의 off-by-one 가드)', () => {
    (['monthly', 'quarterly', 'semiannual', 'annual'] as const).forEach((frequency) => {
      const result = runSimulation(toSimulationInput(buildFlatValues({ frequency })));
      const partial = result.monthly
        .slice(0, 11)
        .reduce((sum, snapshot) => sum + snapshot.dividendPaid, 0) / 12;

      expect(partial).toBeLessThan(TARGET);
    });
  });

  it('분기 배당은 지급월(3·6·9·12개월째)에만 값이 들어온다', () => {
    const result = runSimulation(toSimulationInput(buildFlatValues({ frequency: 'quarterly' })));
    const paidMonths = result.monthly.slice(0, 12).filter((snapshot) => snapshot.dividendPaid > 0);

    expect(paidMonths.map((snapshot) => snapshot.monthIndex)).toEqual([3, 6, 9, 12]);
  });

  it('반기 배당은 6·12개월째에만 값이 들어온다', () => {
    const result = runSimulation(toSimulationInput(buildFlatValues({ frequency: 'semiannual' })));
    const paidMonths = result.monthly.slice(0, 12).filter((snapshot) => snapshot.dividendPaid > 0);

    expect(paidMonths.map((snapshot) => snapshot.monthIndex)).toEqual([6, 12]);
  });

  it('비-1월 시작이면 도달 달력월이 시작월 기준으로 밀린다 (7월 시작 → 다음 해 6월)', () => {
    const result = runSimulation(
      toSimulationInput(buildFlatValues({ frequency: 'quarterly', investmentStartDate: '2026-07-01' }))
    );
    const reached = findTargetMonth(result.monthly, TARGET);

    expect(reached).toMatchObject({ monthIndex: 12, year: 2027, month: 6 });
  });

  it('도달하지 못하면 null', () => {
    const result = runSimulation(toSimulationInput(buildFlatValues()));

    expect(findTargetMonth(result.monthly, 999_999_999)).toBeNull();
  });

  it('목표 0 이면 첫 달에 도달한다 (findTargetYear(rows, 0) 이 1년차인 것과 동일)', () => {
    const result = runSimulation(toSimulationInput(buildFlatValues()));

    expect(findTargetMonth(result.monthly, 0)).toMatchObject({ monthIndex: 1, year: 2026, month: 1 });
    expect(findTargetYear(result.yearly, 0)).toBe(2026);
  });

  it('빈 시계열이면 null', () => {
    expect(findTargetMonth([], 100)).toBeNull();
  });
});

describe('findTargetMonth — 연 해상도(findTargetYear)와의 불변식', () => {
  /** 목표는 시계열에 딱 걸치지 않게 비정수 배율로 만든다 (합산 순서 차이로 인한 경계 흔들림 회피). */
  const TARGET_RATIOS = [0, 0.13, 0.37, 0.62, 0.88, 0.97, 1.31];

  const cases = SCENARIO_PAYLOAD_MATRIX.flatMap((matrixCase) =>
    TARGET_RATIOS.map((ratio) => [`${matrixCase.name} · 목표 ${Math.round(ratio * 100)}%`, matrixCase, ratio] as const)
  );

  it.each(cases)('%s — 월 도달 ⇔ 연 도달, 월 도달이 더 이르다', (_name, matrixCase, ratio) => {
    const run = runPortfolio(matrixCase.payload);
    const finalMonthly = run.yearly[run.yearly.length - 1].monthlyDividend;
    const target = finalMonthly * ratio;

    const reachedMonth = findTargetMonth(run.monthly, target);
    const reachedYear = findTargetYear(run.yearly, target);

    // 불변식 ①: 월 해상도 도달 존재 ⇔ 연 해상도 도달 존재
    expect(reachedMonth !== null).toBe(reachedYear !== undefined);

    if (!reachedMonth || reachedYear === undefined) return;

    // 불변식 ②: 월 도달은 연 도달 연차의 마지막 달(12k)보다 늦지 않다.
    const startYear = Number(run.values.investmentStartDate.slice(0, 4));
    const yearIndex = reachedYear - startYear + 1;
    expect(reachedMonth.monthIndex).toBeLessThanOrEqual(yearIndex * 12);

    // ⚠ 연 해상도 `year` 는 달력 연도가 아니라 "시작연도 + 경과연차" 라벨이다.
    // 1월 시작이면 두 값이 같은 축이지만, 그 밖의 달에 시작하면 달력 연도가 최대 1 클 수 있다.
    const startMonth = Number(run.values.investmentStartDate.slice(5, 7));
    expect(reachedMonth.year).toBeLessThanOrEqual(startMonth === 1 ? reachedYear : reachedYear + 1);
  });

  /**
   * ⚠ **알려진 갈림(엔진이 아니라 부동소수 결합순서)**: 목표가 연 해상도 값과 **정확히 같을 때만** 두
   * 해상도의 판정이 갈릴 수 있다. 연 합산은 "종목별 연배당을 더해 12로 나눔", 월 합산은 "달마다 종목을
   * 더한 뒤 12달을 더해 12로 나눔"이라 결합순서가 달라 마지막 자리(1e-16 상대오차)가 어긋난다.
   * 실측(2026-07-26): '4종목 · 주기 혼합 · 가중'에서 연 1,658,469.36943415366 vs 월 1,658,469.36943415343
   * (절대차 -2.3e-10원). 목표를 1원만 낮추면 두 해상도 모두 240개월째에 도달한다.
   * 사람이 넣는 목표(만원·백만원 단위)로는 도달 불가능한 폭이라 **비교식을 느슨하게 만들지 않고**
   * 계약으로 고정만 해 둔다 — 나중에 엡실론을 넣고 싶어지면 이 테스트가 근거다.
   */
  it('목표가 연 해상도 값과 정확히 같으면 마지막 해에서 두 해상도가 갈릴 수 있다 (결합순서 오차 · 기록용)', () => {
    const matrixCase = SCENARIO_PAYLOAD_MATRIX.find((item) => item.name === '4종목 · 주기 혼합 · 가중');
    if (!matrixCase) throw new Error('픽스처 이름이 바뀌었다');

    const run = runPortfolio(matrixCase.payload);
    const exactTarget = run.yearly[run.yearly.length - 1].monthlyDividend;
    const rollingLast = run.monthly.slice(-12).reduce((sum, point) => sum + point.dividendPaid, 0) / 12;

    // 두 값의 차이는 1원의 10억분의 1 미만 — 그럼에도 `>=` 는 갈린다.
    expect(Math.abs(rollingLast - exactTarget)).toBeLessThan(1e-6);
    expect(rollingLast).toBeLessThan(exactTarget);
    expect(findTargetYear(run.yearly, exactTarget)).toBeDefined();
    expect(findTargetMonth(run.monthly, exactTarget)).toBeNull();

    // 1원만 낮추면 두 해상도가 다시 일치한다.
    expect(findTargetMonth(run.monthly, exactTarget - 1)?.monthIndex).toBe(240);
  });

  /**
   * ⚠ 연 해상도 `year` 는 **달력 연도가 아니라 라벨**(시작연도 + 경과연차)이다. UI 가 두 값을
   * 그대로 비교하면 "월 도달이 연 도달보다 늦다"는 착시가 생긴다. 실측 사례를 못박아 둔다.
   */
  it('비-1월 시작이면 월 도달의 달력 연도가 연 라벨보다 1 클 수 있다 (착시 주의)', () => {
    const run = runPortfolio(
      buildMatrixPayload([MATRIX_SCHD, MATRIX_VIG, MATRIX_JEPI], { t1: 50, t3: 30, t2: 20 }, { investmentStartDate: '2024-07-01' })
    );
    const target = run.yearly[9].monthlyDividend * 0.13;

    const reachedMonth = findTargetMonth(run.monthly, target);
    const reachedYear = findTargetYear(run.yearly, target);

    expect(reachedMonth).not.toBeNull();
    expect(reachedYear).toBeDefined();
    // 같은 1년차(2024-07~2025-06)를 연 해상도는 2024, 월 해상도는 달력 그대로 부른다.
    expect(reachedMonth?.year).toBe((reachedYear as number) + 1);
    expect(reachedMonth?.monthIndex).toBeLessThanOrEqual(((reachedYear as number) - 2024 + 1) * 12);
  });

  it('연 도달 연차의 마지막 달에서는 언제나 목표를 만족한다 (연 해상도 표본추출 관계)', () => {
    const run = runPortfolio(buildMatrixPayload([MATRIX_SCHD, MATRIX_JEPI], { t1: 60, t2: 40 }));
    const target = run.yearly[9].monthlyDividend * 0.8;
    const reachedYear = findTargetYear(run.yearly, target);
    const startYear = Number(run.values.investmentStartDate.slice(0, 4));

    expect(reachedYear).toBeDefined();
    const yearEndIndex = ((reachedYear as number) - startYear + 1) * 12 - 1;
    const rolling = run.monthly.slice(yearEndIndex - 11, yearEndIndex + 1).reduce((sum, point) => sum + point.dividendPaid, 0) / 12;

    expect(rolling).toBeGreaterThanOrEqual(target);
  });
});

describe('currentMonthlyDividend — 오늘 기준 현재 월배당(세후)', () => {
  const run = () => runPortfolio(buildMatrixPayload([MATRIX_SCHD, MATRIX_JEPI], { t1: 60, t2: 40 }));

  it('12개월 이상 경과했으면 직전 12개월 평균을 쓴다', () => {
    const { monthly, yearly } = run();
    const current = currentMonthlyDividend({ monthly, now: { year: 2025, month: 12 } });

    expect(current.mode).toBe('trailing12m');
    expect(current.isFallback).toBe(false);
    expect(current.asOf).toEqual({ year: 2025, month: 12 });
    expect(current.monthsCovered).toBe(12);
    // 2024-01 시작이므로 2025-12 = 24개월째 = 연 해상도 2년차 행과 같은 창이다.
    expect(current.amount).toBeCloseTo(yearly[1].monthlyDividend, 6);
  });

  it('Date 로 "오늘"을 주입해도 같은 결과다', () => {
    const { monthly } = run();

    expect(currentMonthlyDividend({ monthly, now: new Date(2025, 11, 27) }).amount).toBeCloseTo(
      currentMonthlyDividend({ monthly, now: { year: 2025, month: 12 } }).amount,
      10
    );
  });

  it('12개월 미경과면 1년차 월평균으로 폴백한다', () => {
    const { monthly, yearly } = run();
    const current = currentMonthlyDividend({ monthly, now: { year: 2024, month: 6 } });

    expect(current.mode).toBe('firstYearAverage');
    expect(current.isFallback).toBe(true);
    expect(current.monthsCovered).toBe(12);
    expect(current.asOf).toEqual({ year: 2024, month: 12 });
    expect(current.amount).toBeCloseTo(yearly[0].monthlyDividend, 6);
  });

  it('투자 시작 전이면 1년차 월평균으로 폴백한다', () => {
    const { monthly, yearly } = run();
    const current = currentMonthlyDividend({ monthly, now: { year: 2019, month: 3 } });

    expect(current.isFallback).toBe(true);
    expect(current.amount).toBeCloseTo(yearly[0].monthlyDividend, 6);
  });

  it('시작 후 정확히 12개월째부터 폴백이 풀린다 (경계)', () => {
    const { monthly } = run();

    expect(currentMonthlyDividend({ monthly, now: { year: 2024, month: 11 } }).mode).toBe('firstYearAverage');
    expect(currentMonthlyDividend({ monthly, now: { year: 2024, month: 12 } }).mode).toBe('trailing12m');
  });

  it('시뮬레이션 종료 이후면 마지막 달까지의 12개월로 클램프한다 (0으로 채우지 않는다)', () => {
    const { monthly, yearly } = run();
    const last = monthly[monthly.length - 1];
    const current = currentMonthlyDividend({ monthly, now: { year: last.year + 5, month: 3 } });

    expect(current.mode).toBe('trailing12m');
    expect(current.asOf).toEqual({ year: last.year, month: last.month });
    expect(current.amount).toBeCloseTo(yearly[yearly.length - 1].monthlyDividend, 6);
  });

  it('빈 시계열이면 0 · 폴백 표시 (던지지 않는다)', () => {
    expect(currentMonthlyDividend({ monthly: [], now: { year: 2026, month: 1 } })).toEqual({
      amount: 0,
      mode: 'firstYearAverage',
      isFallback: true,
      monthsCovered: 0
    });
  });

  it('세후 정의를 한 번만 반영한다 (세율 15.4% → 세전의 84.6%)', () => {
    const noTax = runPortfolio(buildMatrixPayload([MATRIX_SCHD], { t1: 100 }, { taxRate: 0, reinvestDividends: false }));
    const taxed = runPortfolio(buildMatrixPayload([MATRIX_SCHD], { t1: 100 }, { taxRate: 15.4, reinvestDividends: false }));
    const now = { year: 2030, month: 6 };

    const gross = currentMonthlyDividend({ monthly: noTax.monthly, now }).amount;
    const net = currentMonthlyDividend({ monthly: taxed.monthly, now }).amount;

    expect(net / gross).toBeCloseTo(0.846, 10);
  });
});

describe('세 숫자의 정합 — 현재값 · 달성률 · 예상 달성월', () => {
  const scenarios = [
    ['1월 시작 · 분기+월배당 혼합', buildMatrixPayload([MATRIX_SCHD, MATRIX_JEPI], { t1: 50, t2: 50 })],
    ['7월 시작 · 연배당 포함', buildMatrixPayload([MATRIX_SCHD, MATRIX_VIG], { t1: 70, t3: 30 }, { investmentStartDate: '2024-07-01' })]
  ] as const;

  it.each(scenarios)('%s — 도달월의 현재값이 곧 판정값이고, 그 직전 달은 미달이다', (_name, payload) => {
    const { monthly, yearly } = runPortfolio(payload);
    const target = yearly[9].monthlyDividend * 0.55;
    const reached = findTargetMonth(monthly, target);

    expect(reached).not.toBeNull();
    if (!reached) return;

    const atReach = currentMonthlyDividend({ monthly, now: { year: reached.year, month: reached.month } });
    expect(atReach.amount).toBe(reached.monthlyDividend);
    expect(atReach.amount / target).toBeGreaterThanOrEqual(1);

    const previous = monthly[reached.monthIndex - 2] as PortfolioMonthlyPoint;
    const beforeReach = currentMonthlyDividend({ monthly, now: { year: previous.year, month: previous.month } });
    expect(beforeReach.amount / target).toBeLessThan(1);
  });
});
