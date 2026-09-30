import { describe, expect, it } from 'vitest';
import {
  buildWeightedTickersPrefillState,
  readPortfolioSimulationPrefillRequest,
  readPortfolioSimulationPrefillScenarioName
} from '@/shared/constants';

/**
 * ETF 조합 짜기 → 시뮬레이터 프리필. 🔴 받는 쪽 계약(`sanitizePortfolioSimulationPrefill`)은 그대로다 —
 * 여기서는 보내는 값이 **받는 쪽 판독기를 그대로 통과하는지**(왕복)를 잠근다.
 */
const UNIVERSE = { SCHD: {}, VOO: {}, QQQ: {} };

describe('buildWeightedTickersPrefillState', () => {
  it('정한 비중을 100 으로 맞춰 싣고, 받는 쪽 판독기가 같은 값을 읽는다(왕복)', () => {
    const { state, excluded } = buildWeightedTickersPrefillState(
      [
        { ticker: 'schd', weight: 60 },
        { ticker: 'VOO', weight: 30 },
        { ticker: 'QQQ', weight: 10 }
      ],
      'ETF 조합',
      UNIVERSE
    );
    expect(excluded).toEqual([]);
    expect(readPortfolioSimulationPrefillRequest(state)).toEqual({
      initialInvestmentKrw: 0,
      holdings: [
        { ticker: 'SCHD', weightPercent: 60 },
        { ticker: 'VOO', weightPercent: 30 },
        { ticker: 'QQQ', weightPercent: 10 }
      ]
    });
    expect(readPortfolioSimulationPrefillScenarioName(state)).toBe('ETF 조합');
  });

  it('🔴 시뮬레이터가 모르는 티커는 빼고 그 사실을 돌려준다 — 남은 비중은 다시 100', () => {
    const { state, excluded } = buildWeightedTickersPrefillState(
      [
        { ticker: 'SCHD', weight: 50 },
        { ticker: 'ZZZZ', weight: 25 },
        { ticker: 'VOO', weight: 25 }
      ],
      'ETF 조합',
      UNIVERSE
    );
    expect(excluded).toEqual(['ZZZZ']);
    const holdings = readPortfolioSimulationPrefillRequest(state)!.holdings;
    expect(holdings.map((holding) => holding.ticker)).toEqual(['SCHD', 'VOO']);
    expect(holdings[0]!.weightPercent).toBeCloseTo(66.667, 2);
    expect(holdings.reduce((sum, holding) => sum + holding.weightPercent, 0)).toBeCloseTo(100, 9);
  });

  it('아는 티커가 하나도 없으면 state 가 없다(버튼을 잠근다)', () => {
    expect(buildWeightedTickersPrefillState([{ ticker: 'ZZZZ', weight: 100 }], 'x', UNIVERSE)).toEqual({
      state: null,
      excluded: ['ZZZZ']
    });
  });
});
