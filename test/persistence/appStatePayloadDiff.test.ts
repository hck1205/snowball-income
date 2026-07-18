import { describe, expect, it } from 'vitest';
import {
  isSameMeaningfulPayload,
  isSamePersistedPayload,
  serializeMeaningfulPayload
} from '@/jotai';
import type {
  PersistedAppStatePayload,
  PersistedInvestmentSettings
} from '@/jotai';
import type { PortfolioPersistedState } from '@/shared/types/snowball';

/**
 * 영속 payload 구조 비교 — no-op 클라우드 게이트(의미있는 액션만 저장)와 조용한 로드(현재와 같으면
 * 재적용 안 함)의 기반. 뷰 상태(탭 전환·뷰 토글·티커 선택)는 "의미없음"으로 걸러져야 한다.
 */

const investmentSettings = (over: Partial<PersistedInvestmentSettings> = {}): PersistedInvestmentSettings => ({
  initialInvestment: 1000,
  monthlyContribution: 100,
  targetMonthlyDividend: 200,
  investmentStartDate: '2026-01-01',
  durationYears: 10,
  reinvestDividends: true,
  reinvestDividendPercent: 100,
  taxRate: 15.4,
  reinvestTiming: 'sameMonth',
  dpsGrowthMode: 'annualStep',
  showQuickEstimate: false,
  showSplitGraphs: false,
  isResultCompact: false,
  isYearlyAreaFillOn: true,
  showPortfolioDividendCenter: true,
  visibleYearlySeries: {
    totalContribution: true,
    assetValue: true,
    annualDividend: false,
    monthlyDividend: false,
    cumulativeDividend: false
  },
  ...over
});

const portfolio = (over: Partial<PortfolioPersistedState> = {}): PortfolioPersistedState => ({
  tickerProfiles: [],
  includedTickerIds: [],
  weightByTickerId: {},
  fixedByTickerId: {},
  selectedTickerId: null,
  ...over
});

const basePayload = (): PersistedAppStatePayload => {
  const s1 = { id: 's1', name: '탭1', portfolio: portfolio(), investmentSettings: investmentSettings() };
  const s2 = {
    id: 's2',
    name: '탭2',
    portfolio: portfolio(),
    investmentSettings: investmentSettings({ initialInvestment: 5000 })
  };
  return {
    portfolio: s1.portfolio,
    investmentSettings: s1.investmentSettings,
    scenarios: [s1, s2],
    activeScenarioId: 's1'
  };
};

describe('isSamePersistedPayload — 전체(뷰 포함) 구조 비교', () => {
  it('내용이 같으면 키 순서가 달라도 같다', () => {
    const a = basePayload();
    const b: PersistedAppStatePayload = {
      activeScenarioId: a.activeScenarioId,
      scenarios: a.scenarios,
      investmentSettings: a.investmentSettings,
      portfolio: a.portfolio
    };
    expect(isSamePersistedPayload(a, b)).toBe(true);
  });

  it('뷰 상태(활성 탭)만 달라도 전체 비교로는 다르다', () => {
    const a = basePayload();
    const b = { ...basePayload(), activeScenarioId: 's2' };
    expect(isSamePersistedPayload(a, b)).toBe(false);
  });
});

describe('isSameMeaningfulPayload — 뷰 상태를 배제한 "의미있는 액션" 비교', () => {
  it('탭 전환(activeScenarioId + 최상위 미러 변화)은 의미없음 → 같다 (클라우드 저장 스킵)', () => {
    const before = basePayload();
    // 탭 s2로 전환: activeScenarioId + 최상위 portfolio/investmentSettings가 s2를 미러. 시나리오 목록은 동일.
    const s2 = before.scenarios[1];
    const afterSwitch: PersistedAppStatePayload = {
      ...before,
      activeScenarioId: 's2',
      portfolio: s2.portfolio,
      investmentSettings: s2.investmentSettings
    };
    expect(isSameMeaningfulPayload(before, afterSwitch)).toBe(true);
  });

  it('뷰 토글(showQuickEstimate 등)만 바뀌면 의미없음 → 같다', () => {
    const before = basePayload();
    const after = basePayload();
    after.scenarios[0].investmentSettings.showQuickEstimate = true;
    after.scenarios[0].investmentSettings.isResultCompact = true;
    after.scenarios[0].investmentSettings.visibleYearlySeries.monthlyDividend = true;
    expect(isSameMeaningfulPayload(before, after)).toBe(true);
  });

  it('티커 선택(selectedTickerId)만 바뀌면 의미없음 → 같다', () => {
    const before = basePayload();
    const after = basePayload();
    after.scenarios[0].portfolio.selectedTickerId = 'abc';
    expect(isSameMeaningfulPayload(before, after)).toBe(true);
  });

  it('초기 투자금 변경은 의미있음 → 다르다 (클라우드 저장)', () => {
    const before = basePayload();
    const after = basePayload();
    after.scenarios[0].investmentSettings.initialInvestment = 9999;
    expect(isSameMeaningfulPayload(before, after)).toBe(false);
  });

  it('시나리오 이름 변경(rename)은 의미있음 → 다르다', () => {
    const before = basePayload();
    const after = basePayload();
    after.scenarios[1].name = '새 이름';
    expect(isSameMeaningfulPayload(before, after)).toBe(false);
  });

  it('시나리오 추가는 의미있음 → 다르다', () => {
    const before = basePayload();
    const after = basePayload();
    after.scenarios.push({ id: 's3', name: '탭3', portfolio: portfolio(), investmentSettings: investmentSettings() });
    expect(isSameMeaningfulPayload(before, after)).toBe(false);
  });

  it('비중 변경은 의미있음 → 다르다', () => {
    const before = basePayload();
    const after = basePayload();
    after.scenarios[0].portfolio.weightByTickerId = { t1: 60 };
    expect(isSameMeaningfulPayload(before, after)).toBe(false);
  });

  it('직렬화는 키 순서에 무관하게 안정적이다(같은 내용 = 같은 문자열)', () => {
    expect(serializeMeaningfulPayload(basePayload())).toBe(serializeMeaningfulPayload(basePayload()));
  });
});
