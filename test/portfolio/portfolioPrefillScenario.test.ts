import { describe, expect, it } from 'vitest';
import type { TickerDraft } from '@/shared/types/snowball';
import { defaultYieldFormValues } from '@/shared/lib/snowball';
import {
  PORTFOLIO_PREFILL_SCENARIO_NAME,
  buildPortfolioPrefillScenario,
  evaluatePortfolioPrefillCommit,
  isScenarioPrefillSafe
} from '@/pages/Main/utils';
import { PORTFOLIO_PREFILL_WEIGHT_TOTAL } from '@/shared/constants';

/**
 * 프리필 → 시뮬레이터 시나리오 **매핑·커밋 대상 판정**(순수 계층).
 *
 * 여기서 잡는 회귀 셋: ①유니버스에서 못 찾은 티커를 버리면서 비중을 재정규화하지 않아 포트폴리오가
 * 통째로 작아지는 것(프리셋에서 실제로 났던 사고와 같은 종류) ②다른 화면의 CTA가 사용자가 만들던
 * 시나리오를 덮어쓰는 것 ③비로그인 사용자가 "아무 일도 안 일어난다"를 겪는 것.
 */

const draft = (ticker: string): TickerDraft => ({
  ticker,
  name: '',
  initialPrice: 100,
  dividendYield: 3.5,
  dividendGrowth: 5,
  expectedTotalReturn: 8.5,
  frequency: 'quarterly'
});

const UNIVERSE: Record<string, TickerDraft> = { SCHD: draft('SCHD'), JEPI: draft('JEPI') };

const sumWeights = (weightByTickerId: Record<string, number>): number =>
  Object.values(weightByTickerId).reduce((sum, weight) => sum + weight, 0);

describe('buildPortfolioPrefillScenario — 프리필을 시나리오 내용으로', () => {
  it('티커·비중·초기 투자금을 그대로 옮긴다', () => {
    const scenario = buildPortfolioPrefillScenario({
      prefill: {
        initialInvestmentKrw: 12_000_000,
        holdings: [
          { ticker: 'SCHD', weightPercent: 70 },
          { ticker: 'JEPI', weightPercent: 30 }
        ]
      },
      universe: UNIVERSE
    });

    expect(scenario?.profiles.map((profile) => profile.ticker)).toEqual(['SCHD', 'JEPI']);
    expect(scenario?.includedIds).toHaveLength(2);
    expect(new Set(scenario?.includedIds)).toHaveLength(2);
    expect(scenario?.selectedTickerId).toBe(scenario?.includedIds[0]);
    expect(Object.values(scenario?.fixedByTickerId ?? {})).toEqual([false, false]);
    expect(sumWeights(scenario?.weightByTickerId ?? {})).toBe(PORTFOLIO_PREFILL_WEIGHT_TOTAL);
    expect(scenario?.initialInvestment).toBe(12_000_000);
    expect(scenario?.droppedTickers).toEqual([]);
  });

  it('유니버스에 없는 티커는 버리고 **남은 비중을 100으로 재정규화**한다', () => {
    const scenario = buildPortfolioPrefillScenario({
      prefill: {
        initialInvestmentKrw: 0,
        holdings: [
          { ticker: 'SCHD', weightPercent: 30 },
          { ticker: 'ZZZZ', weightPercent: 70 }
        ]
      },
      universe: UNIVERSE
    });

    expect(scenario?.profiles.map((profile) => profile.ticker)).toEqual(['SCHD']);
    // 재정규화를 빼먹으면 30%짜리 포트폴리오가 남는다(프리셋에서 났던 사고와 같은 종류).
    expect(sumWeights(scenario?.weightByTickerId ?? {})).toBe(PORTFOLIO_PREFILL_WEIGHT_TOTAL);
    // 무음 제외 금지 — 무엇을 버렸는지 결과로 돌려준다.
    expect(scenario?.droppedTickers).toEqual(['ZZZZ']);
  });

  it('비중이 딸려 온 항목에서 그대로 온다 (인덱스가 밀려 서로 바뀌지 않는다)', () => {
    const scenario = buildPortfolioPrefillScenario({
      prefill: {
        initialInvestmentKrw: 0,
        holdings: [
          { ticker: 'ZZZZ', weightPercent: 10 },
          { ticker: 'SCHD', weightPercent: 60 },
          { ticker: 'JEPI', weightPercent: 30 }
        ]
      },
      universe: UNIVERSE
    });

    const weights = scenario?.profiles.map((profile) => scenario.weightByTickerId[profile.id]) ?? [];
    // 남은 60:30 비율을 유지한 채 100으로.
    expect(weights[0] / weights[1]).toBeCloseTo(2, 9);
    expect(sumWeights(scenario?.weightByTickerId ?? {})).toBeCloseTo(PORTFOLIO_PREFILL_WEIGHT_TOTAL, 9);
  });

  it('아는 티커가 하나도 없으면 null (빈 탭만 만들지 않는다)', () => {
    expect(
      buildPortfolioPrefillScenario({
        prefill: { initialInvestmentKrw: 1_000, holdings: [{ ticker: 'ZZZZ', weightPercent: 100 }] },
        universe: UNIVERSE
      })
    ).toBeNull();
  });
});

describe('evaluatePortfolioPrefillCommit — 어디에 커밋할까', () => {
  it('탭을 만들 수 있으면 항상 새 탭 (남의 시나리오를 덮지 않는다)', () => {
    expect(evaluatePortfolioPrefillCommit({ tabCreation: 'allowed', isActiveScenarioPristine: false })).toBe('new-tab');
    expect(evaluatePortfolioPrefillCommit({ tabCreation: 'allowed', isActiveScenarioPristine: true })).toBe('new-tab');
  });

  it('로그인 게이트에 막혀도 활성 탭이 비어 있으면 거기에 커밋한다 (비로그인도 프리필을 본다)', () => {
    expect(evaluatePortfolioPrefillCommit({ tabCreation: 'login-required', isActiveScenarioPristine: true })).toBe(
      'active-tab'
    );
  });

  it('로그인 게이트 + 쓰던 시나리오면 커밋하지 않고 로그인을 유도한다 (파괴 없음)', () => {
    expect(evaluatePortfolioPrefillCommit({ tabCreation: 'login-required', isActiveScenarioPristine: false })).toBe(
      'login-required'
    );
  });

  it('하드 상한이면 로그인 유도가 아니라 상한 사유를 돌려준다 (로그인해도 안 풀린다)', () => {
    expect(evaluatePortfolioPrefillCommit({ tabCreation: 'limit-reached', isActiveScenarioPristine: false })).toBe(
      'tab-limit-reached'
    );
    expect(evaluatePortfolioPrefillCommit({ tabCreation: 'limit-reached', isActiveScenarioPristine: true })).toBe(
      'active-tab'
    );
  });
});

describe('isScenarioPrefillSafe — 덮어써도 잃을 게 없는가', () => {
  it('티커가 없고 초기 투자금이 기본값이면 안전하다', () => {
    expect(
      isScenarioPrefillSafe({ tickerProfileCount: 0, initialInvestment: defaultYieldFormValues.initialInvestment })
    ).toBe(true);
  });

  it('티커가 하나라도 있으면 안전하지 않다 (포함에서 뺀 티커도 사용자 데이터다)', () => {
    expect(
      isScenarioPrefillSafe({ tickerProfileCount: 1, initialInvestment: defaultYieldFormValues.initialInvestment })
    ).toBe(false);
  });

  it('초기 투자금을 직접 적어 뒀으면 안전하지 않다', () => {
    expect(isScenarioPrefillSafe({ tickerProfileCount: 0, initialInvestment: 50_000_000 })).toBe(false);
  });
});

describe('새 탭 이름', () => {
  it('프리필로 만든 탭은 출처를 이름으로 말한다', () => {
    expect(PORTFOLIO_PREFILL_SCENARIO_NAME).toBe('내 포트폴리오');
  });
});
