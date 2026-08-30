// @vitest-environment node — 순수 함수만 본다.
import { describe, expect, it } from 'vitest';
import type { SimulationResult } from '@/shared/types';
import { resolveGoalOutcome } from '@/pages/Main/components';
import { findLandingGoal } from '@/shared/constants/landingGoals';
import { findAssetTargetYear, findTargetYear } from '@/shared/lib/snowball';

/**
 * 첫 화면에서 고른 목표를 계산기가 **어떻게 판정하는가**.
 *
 * 🔴 화면에 "N년째에 닿습니다"를 내보내는 계산이라, 틀리면 사용자가 잘못된 계획을 세운다.
 */

const goal = (id: string) => {
  const found = findLandingGoal(id);
  if (!found) throw new Error(`목표 데이터가 없다: ${id}`);
  return found;
};

/** 연간 행 최소 픽스처. 판정이 보는 열은 `year`·`assetValue`·`monthlyDividend` 셋뿐이다. */
const rows = (specs: ReadonlyArray<{ assetValue: number; monthlyDividend: number }>): SimulationResult[] =>
  specs.map((spec, index) => ({
    year: 2026 + index,
    totalContribution: 0,
    assetValue: spec.assetValue,
    annualDividend: spec.monthlyDividend * 12,
    cumulativeDividend: 0,
    monthlyDividend: spec.monthlyDividend
  }));

describe('자산 목표 — 자산 열을 훑는다', () => {
  it('목표 자산을 넘는 첫 해를 N년차로 답한다', () => {
    const outcome = resolveGoalOutcome(
      goal('asset-100m'),
      rows([
        { assetValue: 30_000_000, monthlyDividend: 0 },
        { assetValue: 70_000_000, monthlyDividend: 0 },
        { assetValue: 110_000_000, monthlyDividend: 0 }
      ])
    );

    expect(outcome.status).toBe('reached');
    expect(outcome.reachedInYears).toBe(3);
    expect(outcome.answer).toContain('3년째');
  });

  it('🔴 배당 열을 보지 않는다 — 배당이 아무리 커도 자산이 모자라면 미달이다', () => {
    /*
     * 이 단정이 "목표 자산을 배당으로 환산하지 않는다"는 규율의 집행이다. 환산 구현이었다면
     * 배당이 큰 이 픽스처가 도달로 뒤집힌다.
     */
    const outcome = resolveGoalOutcome(
      goal('asset-100m'),
      rows([
        { assetValue: 10_000_000, monthlyDividend: 5_000_000 },
        { assetValue: 20_000_000, monthlyDividend: 9_000_000 }
      ])
    );

    expect(outcome.status).toBe('missed');
    expect(outcome.reachedInYears).toBeNull();
  });

  it('못 닿으면 기간을 밝혀 말한다', () => {
    const outcome = resolveGoalOutcome(
      goal('asset-500m'),
      rows([
        { assetValue: 10_000_000, monthlyDividend: 0 },
        { assetValue: 20_000_000, monthlyDividend: 0 }
      ])
    );

    expect(outcome.status).toBe('missed');
    expect(outcome.answer).toContain('2년');
  });
});

describe('배당 목표 — 월배당 열을 훑는다', () => {
  it('목표 월배당을 넘는 첫 해를 N년차로 답한다', () => {
    const outcome = resolveGoalOutcome(
      goal('dividend-100'),
      rows([
        { assetValue: 0, monthlyDividend: 400_000 },
        { assetValue: 0, monthlyDividend: 1_200_000 }
      ])
    );

    expect(outcome.status).toBe('reached');
    expect(outcome.reachedInYears).toBe(2);
  });

  it('🔴 자산 열을 보지 않는다 — 자산이 커도 배당이 모자라면 미달이다', () => {
    const outcome = resolveGoalOutcome(
      goal('dividend-200'),
      rows([{ assetValue: 5_000_000_000, monthlyDividend: 100_000 }])
    );

    expect(outcome.status).toBe('missed');
  });
});

describe('판정할 수 없을 때', () => {
  it('결과가 없으면 숫자를 지어내지 않고 무엇이 없는지 말한다', () => {
    const outcome = resolveGoalOutcome(goal('asset-300m'), []);

    expect(outcome.status).toBe('unknown');
    expect(outcome.reachedInYears).toBeNull();
    expect(outcome.answer).toContain('종목을 담으면');
  });
});

describe('첫 화면이 말했던 값을 함께 싣는다', () => {
  it('🔴 두 숫자를 나란히 놓는다 — 없으면 "아까랑 왜 다르지"에서 멈춘다', () => {
    const asset = resolveGoalOutcome(goal('asset-100m'), rows([{ assetValue: 1, monthlyDividend: 0 }]));
    const dividend = resolveGoalOutcome(goal('dividend-50'), rows([{ assetValue: 1, monthlyDividend: 0 }]));

    expect(asset.landingEstimate).toMatch(/일반 가정/);
    expect(asset.landingEstimate).toMatch(/년|개월/);
    expect(dividend.landingEstimate).toMatch(/원금 약/);
  });
});

describe('엔진 판정 함수와 같은 답을 낸다', () => {
  it('배당 목표는 findTargetYear 와, 자산 목표는 findAssetTargetYear 와 일치한다', () => {
    const table = rows([
      { assetValue: 50_000_000, monthlyDividend: 300_000 },
      { assetValue: 120_000_000, monthlyDividend: 700_000 },
      { assetValue: 320_000_000, monthlyDividend: 1_100_000 }
    ]);

    // 판정을 두 벌로 구현하면 같은 화면에서 "도달"과 "미도달"이 동시에 나온다(findTargetYear 주석).
    expect(resolveGoalOutcome(goal('asset-100m'), table).reachedInYears).toBe(
      (findAssetTargetYear(table, 100_000_000) as number) - table[0].year + 1
    );
    expect(resolveGoalOutcome(goal('dividend-100'), table).reachedInYears).toBe(
      (findTargetYear(table, 1_000_000) as number) - table[0].year + 1
    );
  });
});
