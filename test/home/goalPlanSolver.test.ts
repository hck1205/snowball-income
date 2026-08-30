// @vitest-environment jsdom — 엔진이 Date·Intl 을 쓴다.
import { describe, expect, it } from 'vitest';
import { DIVIDEND_UNIVERSE } from '@/shared/constants';
import { PORTFOLIO_PRESET_PLACEHOLDERS } from '@/shared/constants/portfolioPresets';
import {
  LANDING_ASSET_GOALS,
  LANDING_DIVIDEND_GOALS,
  LANDING_GOALS,
  LANDING_GOAL_PRESET_ID,
  type LandingGoal
} from '@/shared/constants/landingGoals';
import { defaultYieldFormValues, findAssetTargetYear, findTargetYear } from '@/shared/lib/snowball';
import { buildNormalizedAllocation, buildPresetPortfolio, solveGoalMonthlyContribution } from '@/pages/Main/utils';
import { runGoalScenarioSimulation } from '@/pages/Main/utils/simulation';

/**
 * 🔴 목표를 누르면 **그 목표를 달성하는 계획**이 나와야 한다 (2026-08-31 사용자 지적:
 * "클릭하면 바로 5억 만들기의 포폴이 완성되어있어야 하지 않을까").
 *
 * 이 파일이 잠그는 것은 **역산의 보증**이다: 돌려준 금액을 실제로 넣으면 정말 목표에 닿는가.
 * 그게 깨지면 "앱이 알려준 금액을 넣었는데 미도달"이 되고, 그건 이 기능의 유일한 치명적 실패다.
 */

const setup = (goal: LandingGoal) => {
  const preset = PORTFOLIO_PRESET_PLACEHOLDERS.find(
    (candidate) => candidate.id === LANDING_GOAL_PRESET_ID[goal.kind]
  );
  if (!preset) throw new Error(`목표가 지목한 프리셋이 없다: ${LANDING_GOAL_PRESET_ID[goal.kind]}`);

  const portfolio = buildPresetPortfolio({ preset, universe: DIVIDEND_UNIVERSE });
  if (!portfolio) throw new Error(`프리셋을 포트폴리오로 만들지 못했다: ${preset.id}`);

  const includedProfiles = portfolio.profiles.filter((profile) => portfolio.includedIds.includes(profile.id));
  const values = { ...defaultYieldFormValues, ...portfolio.formPatch };

  return {
    preset,
    includedProfiles,
    values,
    normalizedAllocation: buildNormalizedAllocation(includedProfiles, portfolio.weightByTickerId)
  };
};

/** 그 적립금으로 실제 목표에 닿는가 — 화면이 쓰는 바로 그 경로로 다시 확인한다. */
const reaches = (goal: LandingGoal, monthlyContribution: number): boolean => {
  const { includedProfiles, normalizedAllocation, values } = setup(goal);
  const run = runGoalScenarioSimulation({
    includedProfiles,
    normalizedAllocation,
    values: { ...values, monthlyContribution, targetMonthlyDividend: goal.amount },
    reinvestPercentByTickerId: {},
    reinvestTargetByTickerId: {}
  });
  if (run === null) return false;

  const rows = run.simulation.yearly;
  return goal.kind === 'asset'
    ? findAssetTargetYear(rows, goal.amount) !== undefined
    : findTargetYear(rows, goal.amount) !== undefined;
};

describe('목표가 지목한 프리셋', () => {
  it('여섯 목표 전부 실재하는 프리셋을 가리킨다', () => {
    for (const goal of LANDING_GOALS) {
      const id = LANDING_GOAL_PRESET_ID[goal.kind];
      expect(PORTFOLIO_PRESET_PLACEHOLDERS.some((preset) => preset.id === id)).toBe(true);
    }
  });

  it('종류별로 하나씩만 있다 — 목표 크기에 따라 전략을 권하지 않는다', () => {
    const assetIds = new Set(LANDING_ASSET_GOALS.map((goal) => LANDING_GOAL_PRESET_ID[goal.kind]));
    const dividendIds = new Set(LANDING_DIVIDEND_GOALS.map((goal) => LANDING_GOAL_PRESET_ID[goal.kind]));

    expect(assetIds.size).toBe(1);
    expect(dividendIds.size).toBe(1);
    // 자산과 배당은 서로 달라야 한다 — 원하는 것이 다르면 담는 것도 달라야 한다.
    expect([...assetIds][0]).not.toBe([...dividendIds][0]);
  });
});

describe('🔴 역산의 보증 — 알려준 금액을 넣으면 정말 닿는다', () => {
  it.each(LANDING_GOALS.map((goal) => [goal.id, goal] as const))('%s', (_id, goal) => {
    const { includedProfiles, normalizedAllocation, values } = setup(goal);

    const solved = solveGoalMonthlyContribution({
      goal,
      includedProfiles,
      normalizedAllocation,
      values: { ...values, targetMonthlyDividend: goal.amount }
    });

    expect(solved).not.toBeNull();
    expect(solved).toBeGreaterThan(0);
    // 이 단정이 이 기능 전체를 지탱한다.
    expect(reaches(goal, solved as number)).toBe(true);
  });
});

describe('목표가 크면 더 넣어야 한다', () => {
  const solveAll = (goals: readonly LandingGoal[]) =>
    goals.map((goal) => {
      const { includedProfiles, normalizedAllocation, values } = setup(goal);
      return solveGoalMonthlyContribution({
        goal,
        includedProfiles,
        normalizedAllocation,
        values: { ...values, targetMonthlyDividend: goal.amount }
      });
    });

  it('🔴 자산 1억 < 3억 < 5억 — 셋이 같으면 버튼 셋이 같은 화면이 된다', () => {
    const [one, three, five] = solveAll(LANDING_ASSET_GOALS) as number[];

    expect(three).toBeGreaterThan(one);
    expect(five).toBeGreaterThan(three);
  });

  it('🔴 배당 월50 < 월100 < 월200', () => {
    const [fifty, hundred, twoHundred] = solveAll(LANDING_DIVIDEND_GOALS) as number[];

    expect(hundred).toBeGreaterThan(fifty);
    expect(twoHundred).toBeGreaterThan(hundred);
  });
});

describe('풀 수 없으면 지어내지 않는다', () => {
  it('담을 종목이 없으면 null', () => {
    expect(
      solveGoalMonthlyContribution({
        goal: LANDING_ASSET_GOALS[0],
        includedProfiles: [],
        normalizedAllocation: [],
        values: defaultYieldFormValues
      })
    ).toBeNull();
  });
});
