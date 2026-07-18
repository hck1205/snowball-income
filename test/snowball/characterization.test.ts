import { runSimulation, toSimulationInput } from '@/shared/lib/snowball';
import type { SimulationOutput } from '@/shared/types';
import goldenFixture from './characterization.golden.json';
import { SNOWBALL_SCENARIOS } from './scenarios';

/**
 * 특성화(characterization) 테스트.
 *
 * 리팩토링 전 엔진이 만들어낸 결과(골든 픽스처)를 그대로 고정한다.
 * 순수 함수 추출 과정에서 계산 결과가 단 하나라도 달라지면 여기서 깨진다.
 * 골든 값은 "정답"이 아니라 "현재 동작"이다. 의도적으로 동작을 바꿀 때만 갱신한다.
 */
const golden = goldenFixture as unknown as Record<string, SimulationOutput>;

describe('runSimulation characterization', () => {
  it.each(SNOWBALL_SCENARIOS)('reproduces golden output for $name', ({ name, values }) => {
    const expected = golden[name];
    expect(expected).toBeDefined();

    const actual = runSimulation(toSimulationInput(values));

    expect(actual.monthly).toEqual(expected.monthly);
    expect(actual.yearly).toEqual(expected.yearly);
    expect(actual.summary).toEqual(expected.summary);
    expect(actual.quickEstimate).toEqual(expected.quickEstimate);
  });

  it('covers every golden scenario', () => {
    expect(SNOWBALL_SCENARIOS.map((scenario) => scenario.name).sort()).toEqual(Object.keys(golden).sort());
  });
});
