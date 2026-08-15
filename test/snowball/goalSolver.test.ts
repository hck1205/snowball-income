// @vitest-environment node — DOM 을 쓰지 않는 순수 테스트 (기준: vitest.config.ts)
import type { YieldFormValues } from '@/shared/types';
import type { TickerProfile } from '@/shared/types/snowball';
import { defaultYieldFormValues, solveRequiredMonthlyContribution } from '@/shared/lib/snowball';
import { buildSimulation, solveRequiredMonthlyContributionForPortfolio } from '@/pages/Main/utils/simulation';

/**
 * **목표 → 필요 월 적립금 역산.**
 *
 * 이 기능의 치명적 실패 모드는 단 하나다: **앱이 알려준 금액을 넣었는데 여전히 미도달.**
 * 그러면 화면이 자기 자신과 모순되고, 사용자는 숫자를 믿을 이유를 잃는다.
 * 그래서 이 파일의 중심은 "역산 결과를 실제 시뮬레이션에 다시 넣어 도달을 확인"하는 왕복 검증이다.
 */

const buildValues = (overrides: Partial<YieldFormValues> = {}): YieldFormValues => ({
  ...defaultYieldFormValues,
  ...overrides
});

const buildProfile = (overrides: Partial<TickerProfile> = {}): TickerProfile => ({
  id: 'a',
  ticker: 'SCHD',
  name: '',
  initialPrice: 100_000,
  dividendYield: 3.5,
  dividendGrowth: 5,
  expectedTotalReturn: 8.5,
  frequency: 'quarterly',
  ...overrides
});

describe('solveRequiredMonthlyContribution — 순수 이분탐색', () => {
  it('단조 판정의 임계점을 찾는다', () => {
    const result = solveRequiredMonthlyContribution({
      reachesTarget: (value) => value >= 12_345,
      probeStart: 1_000
    });

    // 유효숫자 3자리 **올림** — 12,345 를 넘기는 가장 가까운 눈금.
    expect(result).toBe(12_400);
  });

  it('🔴 돌려준 값은 반드시 도달한다 — 올림 방향이 뒤집히면 이 기능은 거짓말이 된다', () => {
    for (const threshold of [1, 999, 1_000, 1_001, 123_456, 7_777_777]) {
      const reachesTarget = (value: number): boolean => value >= threshold;
      const result = solveRequiredMonthlyContribution({ reachesTarget, probeStart: 1_000 });

      expect(result).not.toBeNull();
      expect(result as number).toBeGreaterThanOrEqual(threshold);
      expect(reachesTarget(result as number)).toBe(true);
    }
  });

  it('최소값에 충분히 붙는다 — 과하게 큰 금액을 요구하지 않는다', () => {
    const threshold = 4_312_000;
    const result = solveRequiredMonthlyContribution({
      reachesTarget: (value) => value >= threshold,
      probeStart: 1_000_000
    }) as number;

    // 유효숫자 3자리 올림이 만드는 여유 이상으로 벌어지면 안 된다.
    expect(result / threshold).toBeLessThan(1.01);
  });

  it('적립 0으로도 도달하면 0이다 — 초기 투자금만으로 채워지는 경우', () => {
    expect(solveRequiredMonthlyContribution({ reachesTarget: () => true, probeStart: 1_000 })).toBe(0);
  });

  it('어떤 금액으로도 도달할 수 없으면 null — 무한히 넓히지 않는다', () => {
    expect(solveRequiredMonthlyContribution({ reachesTarget: () => false, probeStart: 1_000 })).toBeNull();
  });

  it('probeStart 가 0·음수·비유한이어도 답은 같다 — 시작 눈금은 속도이지 정답이 아니다', () => {
    const reachesTarget = (value: number): boolean => value >= 500_000;

    for (const probeStart of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(solveRequiredMonthlyContribution({ reachesTarget, probeStart })).toBe(500_000);
    }
  });

  it('판정 호출 횟수가 유한하고 작다 — 판정 1회가 시뮬레이션 1회다', () => {
    let calls = 0;
    solveRequiredMonthlyContribution({
      reachesTarget: (value) => {
        calls += 1;
        return value >= 3_000_000;
      },
      probeStart: 1_000_000
    });

    expect(calls).toBeLessThanOrEqual(30);
  });
});

describe('solveRequiredMonthlyContributionForPortfolio — 화면과의 왕복', () => {
  const runWithContribution = (
    profiles: TickerProfile[],
    values: YieldFormValues,
    monthlyContribution: number
  ): boolean => {
    const simulation = buildSimulation({
      isValid: true,
      includedProfiles: profiles,
      normalizedAllocation: profiles.map((profile) => ({ profile, weight: 1 / profiles.length })),
      values: { ...values, monthlyContribution }
    });

    return simulation?.summary.targetMonthDividendReachedYear !== undefined;
  };

  it('🔴 역산 결과를 그대로 넣으면 화면이 도달이라고 답한다 (단일 종목)', () => {
    const profiles = [buildProfile()];
    const values = buildValues({
      initialInvestment: 0,
      monthlyContribution: 100_000,
      targetMonthlyDividend: 2_000_000,
      durationYears: 20
    });

    expect(runWithContribution(profiles, values, values.monthlyContribution)).toBe(false);

    const required = solveRequiredMonthlyContributionForPortfolio({
      isValid: true,
      includedProfiles: profiles,
      normalizedAllocation: [{ profile: profiles[0], weight: 1 }],
      values
    });

    expect(required).not.toBeNull();
    expect(runWithContribution(profiles, values, required as number)).toBe(true);
  });

  it('🔴 그보다 뚜렷이 적은 금액은 도달하지 못한다 — 필요 이상을 요구하고 있지 않다는 증거', () => {
    const profiles = [buildProfile()];
    const values = buildValues({
      initialInvestment: 0,
      monthlyContribution: 100_000,
      targetMonthlyDividend: 2_000_000,
      durationYears: 20
    });

    const required = solveRequiredMonthlyContributionForPortfolio({
      isValid: true,
      includedProfiles: profiles,
      normalizedAllocation: [{ profile: profiles[0], weight: 1 }],
      values
    }) as number;

    expect(runWithContribution(profiles, values, required * 0.95)).toBe(false);
  });

  it('여러 종목·비대칭 비중에서도 왕복이 성립한다 — 배분까지 같은 규칙을 쓴다', () => {
    const profiles = [
      buildProfile({ id: 'a', ticker: 'AAA', dividendYield: 2, dividendGrowth: 7, expectedTotalReturn: 9 }),
      buildProfile({ id: 'b', ticker: 'BBB', dividendYield: 8, dividendGrowth: -1, expectedTotalReturn: 7, frequency: 'monthly' })
    ];
    const normalizedAllocation = [
      { profile: profiles[0], weight: 0.3 },
      { profile: profiles[1], weight: 0.7 }
    ];
    const values = buildValues({
      initialInvestment: 5_000_000,
      monthlyContribution: 200_000,
      targetMonthlyDividend: 3_000_000,
      durationYears: 15
    });

    const required = solveRequiredMonthlyContributionForPortfolio({
      isValid: true,
      includedProfiles: profiles,
      normalizedAllocation,
      values
    }) as number;

    expect(required).not.toBeNull();

    const reachedAt = (monthlyContribution: number): boolean =>
      buildSimulation({
        isValid: true,
        includedProfiles: profiles,
        normalizedAllocation,
        values: { ...values, monthlyContribution }
      })?.summary.targetMonthDividendReachedYear !== undefined;

    expect(reachedAt(required)).toBe(true);
    expect(reachedAt(required * 0.95)).toBe(false);
  });

  it('초기 투자금만으로 이미 도달하면 0 — 적립이 필요 없다고 정직하게 답한다', () => {
    const profiles = [buildProfile({ dividendYield: 8, dividendGrowth: 0, expectedTotalReturn: 8 })];
    const values = buildValues({
      initialInvestment: 2_000_000_000,
      monthlyContribution: 0,
      targetMonthlyDividend: 1_000_000,
      durationYears: 10
    });

    expect(
      solveRequiredMonthlyContributionForPortfolio({
        isValid: true,
        includedProfiles: profiles,
        normalizedAllocation: [{ profile: profiles[0], weight: 1 }],
        values
      })
    ).toBe(0);
  });

  it('🔴 무배당 종목이면 null — 아무리 넣어도 배당이 안 나오는데 금액을 지어내지 않는다', () => {
    const profiles = [
      buildProfile({ ticker: 'BRK.B', dividendYield: 0, dividendGrowth: 9, expectedTotalReturn: 9, frequency: 'none' })
    ];
    const values = buildValues({ targetMonthlyDividend: 1_000_000, durationYears: 20 });

    expect(
      solveRequiredMonthlyContributionForPortfolio({
        isValid: true,
        includedProfiles: profiles,
        normalizedAllocation: [{ profile: profiles[0], weight: 1 }],
        values
      })
    ).toBeNull();
  });

  it('목표 미설정(0)이면 null — 0 은 첫 해에 자동 도달이라 답이 무의미하다', () => {
    const profiles = [buildProfile()];

    expect(
      solveRequiredMonthlyContributionForPortfolio({
        isValid: true,
        includedProfiles: profiles,
        normalizedAllocation: [{ profile: profiles[0], weight: 1 }],
        values: buildValues({ targetMonthlyDividend: 0 })
      })
    ).toBeNull();
  });

  it('입력이 무효이거나 종목이 없으면 null', () => {
    const profiles = [buildProfile()];
    const values = buildValues({ targetMonthlyDividend: 1_000_000 });

    expect(
      solveRequiredMonthlyContributionForPortfolio({
        isValid: false,
        includedProfiles: profiles,
        normalizedAllocation: [{ profile: profiles[0], weight: 1 }],
        values
      })
    ).toBeNull();

    expect(
      solveRequiredMonthlyContributionForPortfolio({
        isValid: true,
        includedProfiles: [],
        normalizedAllocation: [],
        values
      })
    ).toBeNull();
  });
});
