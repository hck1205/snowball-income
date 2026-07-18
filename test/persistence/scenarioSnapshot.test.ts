import {
  DEFAULT_SCENARIO_TAB_ID,
  DEFAULT_SCENARIO_TAB_NAME,
  EMPTY_INVESTMENT_SETTINGS,
  EMPTY_PORTFOLIO_STATE,
  type PersistedScenarioState
} from '@/jotai';
import { buildScenariosSnapshot, isSameScenarioContent, mergeSharedScenarioIntoTabs } from '@/pages/Main/hooks/persistence';
import type { PortfolioPersistedState } from '@/shared/types/snowball';

const editedPortfolio: PortfolioPersistedState = {
  tickerProfiles: [
    {
      id: 'ticker-1',
      ticker: 'SCHD',
      name: '슈드',
      initialPrice: 27.5,
      dividendYield: 3.5,
      dividendGrowth: 6,
      expectedTotalReturn: 8.5,
      frequency: 'quarterly'
    }
  ],
  includedTickerIds: ['ticker-1'],
  weightByTickerId: { 'ticker-1': 100 },
  fixedByTickerId: {},
  selectedTickerId: 'ticker-1'
};

const editedSettings = { ...EMPTY_INVESTMENT_SETTINGS, durationYears: 30 };

const tab = (id: string, name: string): PersistedScenarioState => ({
  id,
  name,
  portfolio: EMPTY_PORTFOLIO_STATE,
  investmentSettings: EMPTY_INVESTMENT_SETTINGS
});

describe('buildScenariosSnapshot', () => {
  it('활성 탭에만 현재 편집 내용을 반영한다', () => {
    const tabs = [tab('a', 'A'), tab('b', 'B')];

    const snapshot = buildScenariosSnapshot(tabs, 'b', {
      portfolio: editedPortfolio,
      investmentSettings: editedSettings
    });

    expect(snapshot.activeScenarioId).toBe('b');
    expect(snapshot.scenarios[0]).toEqual(tabs[0]);
    expect(snapshot.scenarios[1]).toEqual({
      id: 'b',
      name: 'B',
      portfolio: editedPortfolio,
      investmentSettings: editedSettings
    });
  });

  it('활성 탭이 목록에 없으면 기본 탭 하나로 접는다', () => {
    const snapshot = buildScenariosSnapshot([tab('a', 'A')], 'ghost', {
      portfolio: editedPortfolio,
      investmentSettings: editedSettings
    });

    expect(snapshot.activeScenarioId).toBe(DEFAULT_SCENARIO_TAB_ID);
    expect(snapshot.scenarios).toEqual([
      {
        id: DEFAULT_SCENARIO_TAB_ID,
        name: DEFAULT_SCENARIO_TAB_NAME,
        portfolio: editedPortfolio,
        investmentSettings: editedSettings
      }
    ]);
  });

  it('탭이 하나도 없으면 기본 탭을 만든다', () => {
    const snapshot = buildScenariosSnapshot([], 'a', {
      portfolio: editedPortfolio,
      investmentSettings: editedSettings
    });

    expect(snapshot.scenarios).toHaveLength(1);
    expect(snapshot.scenarios[0].id).toBe(DEFAULT_SCENARIO_TAB_ID);
  });

  it('입력 탭 배열을 변형하지 않는다', () => {
    const tabs = [tab('a', 'A')];
    const before = structuredClone(tabs);

    buildScenariosSnapshot(tabs, 'a', { portfolio: editedPortfolio, investmentSettings: editedSettings });

    expect(tabs).toEqual(before);
  });
});

describe('isSameScenarioContent', () => {
  it('같은 참조/값이면 true', () => {
    const content = { portfolio: EMPTY_PORTFOLIO_STATE, investmentSettings: EMPTY_INVESTMENT_SETTINGS };
    expect(isSameScenarioContent(content, { ...content })).toBe(true);
  });

  it('포트폴리오 하위 객체 참조가 바뀌면 false (내용이 같아도)', () => {
    const a = { portfolio: EMPTY_PORTFOLIO_STATE, investmentSettings: EMPTY_INVESTMENT_SETTINGS };
    const b = {
      portfolio: { ...EMPTY_PORTFOLIO_STATE, tickerProfiles: [...EMPTY_PORTFOLIO_STATE.tickerProfiles] },
      investmentSettings: EMPTY_INVESTMENT_SETTINGS
    };

    expect(isSameScenarioContent(a, b)).toBe(false);
  });

  it('투자 설정 값이 하나라도 다르면 false', () => {
    const a = { portfolio: EMPTY_PORTFOLIO_STATE, investmentSettings: EMPTY_INVESTMENT_SETTINGS };
    const b = {
      portfolio: EMPTY_PORTFOLIO_STATE,
      investmentSettings: { ...EMPTY_INVESTMENT_SETTINGS, durationYears: EMPTY_INVESTMENT_SETTINGS.durationYears + 1 }
    };

    expect(isSameScenarioContent(a, b)).toBe(false);
  });

  it('taxRate undefined 여부 차이를 잡아낸다', () => {
    const a = { portfolio: EMPTY_PORTFOLIO_STATE, investmentSettings: EMPTY_INVESTMENT_SETTINGS };
    const b = {
      portfolio: EMPTY_PORTFOLIO_STATE,
      investmentSettings: { ...EMPTY_INVESTMENT_SETTINGS, taxRate: undefined }
    };

    expect(isSameScenarioContent(a, b)).toBe(false);
  });

  it('visibleYearlySeries는 참조로 비교한다 (내용이 같아도 새 객체면 false)', () => {
    const a = { portfolio: EMPTY_PORTFOLIO_STATE, investmentSettings: EMPTY_INVESTMENT_SETTINGS };
    const b = {
      portfolio: EMPTY_PORTFOLIO_STATE,
      investmentSettings: {
        ...EMPTY_INVESTMENT_SETTINGS,
        visibleYearlySeries: { ...EMPTY_INVESTMENT_SETTINGS.visibleYearlySeries }
      }
    };

    expect(isSameScenarioContent(a, b)).toBe(false);
  });
});

describe('mergeSharedScenarioIntoTabs', () => {
  const shared: PersistedScenarioState = {
    id: 'shared-tab',
    name: '공유된 탭',
    portfolio: editedPortfolio,
    investmentSettings: editedSettings
  };

  it('같은 id의 공유 탭이 없으면 맨 뒤에 추가한다', () => {
    const merged = mergeSharedScenarioIntoTabs([tab('a', 'A')], shared);

    expect(merged).toHaveLength(2);
    expect(merged[1]).toBe(shared);
  });

  it('같은 id의 공유 탭이 있으면 그 자리에서 교체한다 (순서 유지)', () => {
    const tabs = [tab('a', 'A'), tab('shared-tab', '이전 공유'), tab('b', 'B')];
    const merged = mergeSharedScenarioIntoTabs(tabs, shared);

    expect(merged).toHaveLength(3);
    expect(merged.map((scenario) => scenario.id)).toEqual(['a', 'shared-tab', 'b']);
    expect(merged[1]).toBe(shared);
  });

  it('입력 탭 배열을 변형하지 않는다', () => {
    const tabs = [tab('a', 'A')];
    mergeSharedScenarioIntoTabs(tabs, shared);
    expect(tabs).toHaveLength(1);
  });
});
