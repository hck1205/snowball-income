import { describe, expect, it } from 'vitest';
import type { SimulationOutput } from '@/shared/types';
import { buildSimulation, buildNormalizedAllocation } from '@/pages/Main/utils';
import { PORTFOLIO_SCENARIOS } from './portfolioScenarios';
import golden from './portfolioCharacterization.golden.json';

/**
 * **포트폴리오 합산 특성화 테스트.**
 *
 * 단일 종목은 `characterization.test.ts` 가 지킨다. 이 파일은 그 사각지대인 **종목 간 합산**을
 * 굳힌다 — 지금은 종목마다 20년을 따로 돌리고 마지막에 더하는 구조다.
 *
 * 🔴 배당 **라우팅**(어느 종목의 배당으로 어느 종목을 사는가)을 넣으려면 그 구조를 하나의
 *    월 루프로 묶어야 한다. 그때 기본 라우팅(각자 자기 자신)이 이 값을 **한 자리도 안 틀리게**
 *    재현하는 것이 그 리팩터의 유일한 합격 조건이다. 그래서 엔진을 건드리기 **전에** 만들었다.
 *
 * 골든 값은 "정답"이 아니라 "현재 동작"이다. 의도적으로 동작을 바꿀 때만 갱신한다.
 */
const goldenByName = golden as unknown as Record<string, SimulationOutput>;

const runScenario = (scenario: (typeof PORTFOLIO_SCENARIOS)[number]): SimulationOutput => {
  const simulation = buildSimulation({
    isValid: true,
    includedProfiles: scenario.profiles,
    normalizedAllocation: buildNormalizedAllocation(scenario.profiles, scenario.weights),
    values: scenario.values
  });
  if (simulation === null) throw new Error(`${scenario.name}: 시뮬레이션이 null 이다`);
  return simulation;
};

describe('포트폴리오 합산 characterization', () => {
  it.each(PORTFOLIO_SCENARIOS)('$name 의 골든 출력을 재현한다', (scenario) => {
    const expected = goldenByName[scenario.name];
    expect(expected).toBeDefined();

    const actual = runScenario(scenario);

    expect(actual.monthly).toEqual(expected.monthly);
    expect(actual.yearly).toEqual(expected.yearly);
    expect(actual.summary).toEqual(expected.summary);
  });

  it('골든 시나리오를 하나도 빠뜨리지 않는다', () => {
    expect(PORTFOLIO_SCENARIOS.map((scenario) => scenario.name).sort()).toEqual(Object.keys(goldenByName).sort());
  });

  /*
   * 🔴 합산의 **항등식** — 골든 값과 별개로, 어떤 구현이든 이 둘은 성립해야 한다.
   *    골든은 "지금 값"을 지키고, 이 항등식은 "말이 되는 값"을 지킨다. 라우팅이 들어가면
   *    골든은 갱신될 수 있어도 이 둘은 그대로여야 한다.
   */
  it.each(PORTFOLIO_SCENARIOS)('$name — shares × price 가 평가금액과 일치한다', (scenario) => {
    const actual = runScenario(scenario);

    for (const row of actual.monthly) {
      if (row.shares <= 0) continue;
      expect(row.shares * row.price).toBeCloseTo(row.portfolioValue, 4);
    }
  });

  it.each(PORTFOLIO_SCENARIOS)('$name — 누적 배당이 줄어들지 않는다', (scenario) => {
    const actual = runScenario(scenario);

    actual.monthly.reduce((previous, row) => {
      expect(row.cumulativeDividend).toBeGreaterThanOrEqual(previous);
      return row.cumulativeDividend;
    }, 0);
  });
});
