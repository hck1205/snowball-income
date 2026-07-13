import {
  DEFAULT_SCENARIO_TAB_ID,
  DEFAULT_SCENARIO_TAB_NAME,
  EMPTY_INVESTMENT_SETTINGS,
  EMPTY_PORTFOLIO_STATE,
  normalizePersistedAppState,
  parsePersistedAppStateJson,
  sanitizeInvestmentSettings,
  sanitizePortfolioState,
  sanitizeSavedName,
  sanitizeScenarioState,
  sanitizeTickerProfile,
  type PersistedInvestmentSettings
} from '@/jotai';
import type { TickerProfile } from '@/shared/types/snowball';

const validProfile: TickerProfile = {
  id: 'ticker-1',
  ticker: 'SCHD',
  name: '슈드',
  initialPrice: 100,
  dividendYield: 3.5,
  dividendGrowth: 6,
  expectedTotalReturn: 8.5,
  frequency: 'quarterly'
};

describe('sanitizeTickerProfile', () => {
  it('유효한 프로필은 그대로 통과시키고 문자열은 trim 한다', () => {
    expect(sanitizeTickerProfile({ ...validProfile, ticker: '  SCHD  ', name: '  슈드  ', id: '  ticker-1  ' })).toEqual(validProfile);
  });

  it('id 또는 ticker가 비면 null', () => {
    expect(sanitizeTickerProfile({ ...validProfile, id: '   ' })).toBeNull();
    expect(sanitizeTickerProfile({ ...validProfile, ticker: '' })).toBeNull();
  });

  it('가격이 0 이하이거나 유한하지 않으면 null', () => {
    expect(sanitizeTickerProfile({ ...validProfile, initialPrice: 0 })).toBeNull();
    expect(sanitizeTickerProfile({ ...validProfile, initialPrice: -100 })).toBeNull();
    expect(sanitizeTickerProfile({ ...validProfile, initialPrice: Number.NaN })).toBeNull();
  });

  it('음수 배당률/배당성장률이면 null', () => {
    expect(sanitizeTickerProfile({ ...validProfile, dividendYield: -1 })).toBeNull();
    expect(sanitizeTickerProfile({ ...validProfile, dividendGrowth: -1 })).toBeNull();
  });

  it('알 수 없는 frequency면 null', () => {
    expect(sanitizeTickerProfile({ ...validProfile, frequency: 'weekly' })).toBeNull();
    expect(sanitizeTickerProfile({ ...validProfile, frequency: undefined })).toBeNull();
  });

  it('expectedTotalReturn이 없으면 dividendYield로 대체된다', () => {
    const profile = sanitizeTickerProfile({ ...validProfile, expectedTotalReturn: undefined });
    expect(profile?.expectedTotalReturn).toBe(validProfile.dividendYield);
  });

  it('객체가 아니면 null', () => {
    expect(sanitizeTickerProfile(null)).toBeNull();
    expect(sanitizeTickerProfile('SCHD')).toBeNull();
  });
});

describe('sanitizePortfolioState', () => {
  it('존재하지 않는 티커 id 참조를 모두 제거한다', () => {
    const result = sanitizePortfolioState({
      tickerProfiles: [validProfile],
      includedTickerIds: ['ticker-1', 'ghost'],
      weightByTickerId: { 'ticker-1': 60, ghost: 40 },
      fixedByTickerId: { 'ticker-1': true, ghost: true },
      selectedTickerId: 'ghost'
    });

    expect(result.includedTickerIds).toEqual(['ticker-1']);
    expect(result.weightByTickerId).toEqual({ 'ticker-1': 60 });
    expect(result.fixedByTickerId).toEqual({ 'ticker-1': true });
    expect(result.selectedTickerId).toBeNull();
  });

  it('깨진 프로필이 제거되면 그 프로필을 참조하던 값도 함께 사라진다', () => {
    const result = sanitizePortfolioState({
      tickerProfiles: [validProfile, { ...validProfile, id: 'ticker-2', initialPrice: -10 }],
      includedTickerIds: ['ticker-1', 'ticker-2'],
      weightByTickerId: { 'ticker-1': 50, 'ticker-2': 50 },
      fixedByTickerId: {},
      selectedTickerId: 'ticker-2'
    });

    expect(result.tickerProfiles).toEqual([validProfile]);
    expect(result.includedTickerIds).toEqual(['ticker-1']);
    expect(result.weightByTickerId).toEqual({ 'ticker-1': 50 });
    expect(result.selectedTickerId).toBeNull();
  });

  it('음수 비중은 버린다', () => {
    const result = sanitizePortfolioState({
      tickerProfiles: [validProfile],
      includedTickerIds: [],
      weightByTickerId: { 'ticker-1': -1 },
      fixedByTickerId: {},
      selectedTickerId: null
    });

    expect(result.weightByTickerId).toEqual({});
  });

  it('객체가 아니면 빈 포트폴리오', () => {
    expect(sanitizePortfolioState(undefined)).toEqual(EMPTY_PORTFOLIO_STATE);
  });
});

describe('sanitizeInvestmentSettings', () => {
  it('숫자 필드를 경계값으로 클램프한다', () => {
    const result = sanitizeInvestmentSettings({
      initialInvestment: -100,
      monthlyContribution: -1,
      targetMonthlyDividend: -1,
      durationYears: 0,
      reinvestDividendPercent: 150,
      taxRate: 200
    } satisfies Partial<PersistedInvestmentSettings>);

    expect(result.initialInvestment).toBe(0);
    expect(result.monthlyContribution).toBe(0);
    expect(result.targetMonthlyDividend).toBe(0);
    expect(result.durationYears).toBe(1);
    expect(result.reinvestDividendPercent).toBe(100);
    expect(result.taxRate).toBe(100);
  });

  it('durationYears는 정수로 잘라내고 최소 1을 보장한다', () => {
    expect(sanitizeInvestmentSettings({ durationYears: 10.9 }).durationYears).toBe(10);
    expect(sanitizeInvestmentSettings({ durationYears: -5 }).durationYears).toBe(1);
  });

  it('YYYY-MM-DD 형식이 아닌 시작일은 기본값으로 되돌린다', () => {
    expect(sanitizeInvestmentSettings({ investmentStartDate: '2024/01/01' }).investmentStartDate).toBe(
      EMPTY_INVESTMENT_SETTINGS.investmentStartDate
    );
    expect(sanitizeInvestmentSettings({ investmentStartDate: '2024-01-01' }).investmentStartDate).toBe('2024-01-01');
  });

  it('알 수 없는 reinvestTiming/dpsGrowthMode는 기본값으로 되돌린다', () => {
    const result = sanitizeInvestmentSettings({ reinvestTiming: 'later', dpsGrowthMode: 'linear' });
    expect(result.reinvestTiming).toBe(EMPTY_INVESTMENT_SETTINGS.reinvestTiming);
    expect(result.dpsGrowthMode).toBe(EMPTY_INVESTMENT_SETTINGS.dpsGrowthMode);
  });

  it('visibleYearlySeries의 누락 키는 기본 마스크로 채운다', () => {
    const result = sanitizeInvestmentSettings({ visibleYearlySeries: { annualDividend: true } });
    expect(result.visibleYearlySeries).toEqual({
      totalContribution: true,
      assetValue: true,
      annualDividend: true,
      monthlyDividend: false,
      cumulativeDividend: false
    });
  });

  // 현재 동작 고정(버그): taxRate를 undefined(비과세 계산용)로 저장해도 기본값 15.4로 되돌아온다.
  it('taxRate: undefined는 기본 세율로 되돌아간다 (현재 동작)', () => {
    expect(sanitizeInvestmentSettings({ taxRate: undefined }).taxRate).toBe(EMPTY_INVESTMENT_SETTINGS.taxRate);
  });

  it.todo('taxRate: undefined는 undefined 그대로 라운드트립되어야 한다 (버그: 기본값으로 덮어써짐)');
});

describe('sanitizeSavedName', () => {
  it('문자열이 아니거나 공백뿐이면 undefined', () => {
    expect(sanitizeSavedName(undefined)).toBeUndefined();
    expect(sanitizeSavedName(123)).toBeUndefined();
    expect(sanitizeSavedName('   ')).toBeUndefined();
  });

  it('앞뒤 공백을 제거한다', () => {
    expect(sanitizeSavedName('  내 포트폴리오  ')).toBe('내 포트폴리오');
  });
});

describe('sanitizeScenarioState', () => {
  it('id 또는 name이 비면 null', () => {
    expect(sanitizeScenarioState({ id: '', name: '탭', portfolio: EMPTY_PORTFOLIO_STATE, investmentSettings: EMPTY_INVESTMENT_SETTINGS })).toBeNull();
    expect(sanitizeScenarioState({ id: 'tab', name: '  ', portfolio: EMPTY_PORTFOLIO_STATE, investmentSettings: EMPTY_INVESTMENT_SETTINGS })).toBeNull();
  });
});

describe('normalizePersistedAppState', () => {
  it('빈 값이면 기본 탭 1개를 만든다', () => {
    const result = normalizePersistedAppState(undefined);

    expect(result.scenarios).toHaveLength(1);
    expect(result.scenarios[0].id).toBe(DEFAULT_SCENARIO_TAB_ID);
    expect(result.scenarios[0].name).toBe(DEFAULT_SCENARIO_TAB_NAME);
    expect(result.activeScenarioId).toBe(DEFAULT_SCENARIO_TAB_ID);
    expect(result.portfolio).toEqual(EMPTY_PORTFOLIO_STATE);
    expect(result.savedName).toBeUndefined();
  });

  it('빈 시나리오 배열이면 최상위 portfolio/investmentSettings로 기본 탭을 만든다', () => {
    const result = normalizePersistedAppState({
      portfolio: {
        tickerProfiles: [validProfile],
        includedTickerIds: ['ticker-1'],
        weightByTickerId: { 'ticker-1': 100 },
        fixedByTickerId: {},
        selectedTickerId: 'ticker-1'
      },
      investmentSettings: { ...EMPTY_INVESTMENT_SETTINGS, durationYears: 7 },
      scenarios: []
    });

    expect(result.scenarios).toHaveLength(1);
    expect(result.scenarios[0].id).toBe(DEFAULT_SCENARIO_TAB_ID);
    expect(result.scenarios[0].portfolio.tickerProfiles).toEqual([validProfile]);
    expect(result.scenarios[0].investmentSettings.durationYears).toBe(7);
  });

  it('활성 시나리오 id가 목록에 없으면 첫 시나리오로 되돌린다', () => {
    const result = normalizePersistedAppState({
      scenarios: [
        { id: 'a', name: 'A', portfolio: EMPTY_PORTFOLIO_STATE, investmentSettings: EMPTY_INVESTMENT_SETTINGS },
        { id: 'b', name: 'B', portfolio: EMPTY_PORTFOLIO_STATE, investmentSettings: EMPTY_INVESTMENT_SETTINGS }
      ],
      activeScenarioId: 'ghost'
    });

    expect(result.activeScenarioId).toBe('a');
  });

  it('활성 시나리오의 내용이 최상위 portfolio/investmentSettings로 승격된다', () => {
    const result = normalizePersistedAppState({
      portfolio: EMPTY_PORTFOLIO_STATE,
      investmentSettings: EMPTY_INVESTMENT_SETTINGS,
      scenarios: [
        { id: 'a', name: 'A', portfolio: EMPTY_PORTFOLIO_STATE, investmentSettings: { ...EMPTY_INVESTMENT_SETTINGS, durationYears: 3 } },
        {
          id: 'b',
          name: 'B',
          portfolio: {
            tickerProfiles: [validProfile],
            includedTickerIds: ['ticker-1'],
            weightByTickerId: {},
            fixedByTickerId: {},
            selectedTickerId: null
          },
          investmentSettings: { ...EMPTY_INVESTMENT_SETTINGS, durationYears: 9 }
        }
      ],
      activeScenarioId: 'b'
    });

    expect(result.activeScenarioId).toBe('b');
    expect(result.portfolio.tickerProfiles).toEqual([validProfile]);
    expect(result.investmentSettings.durationYears).toBe(9);
  });

  it('깨진 시나리오(이름 없음)는 버리고 남은 것만 유지한다', () => {
    const result = normalizePersistedAppState({
      scenarios: [
        { id: 'a', name: '', portfolio: EMPTY_PORTFOLIO_STATE, investmentSettings: EMPTY_INVESTMENT_SETTINGS },
        { id: 'b', name: 'B', portfolio: EMPTY_PORTFOLIO_STATE, investmentSettings: EMPTY_INVESTMENT_SETTINGS }
      ],
      activeScenarioId: 'a'
    });

    expect(result.scenarios.map((scenario) => scenario.id)).toEqual(['b']);
    expect(result.activeScenarioId).toBe('b');
  });

  it('시나리오 안의 깨진 페이로드(유령 id, 음수 가격, 잘못된 frequency)를 정규화한다', () => {
    const result = normalizePersistedAppState({
      scenarios: [
        {
          id: 'a',
          name: 'A',
          portfolio: {
            tickerProfiles: [
              validProfile,
              { ...validProfile, id: 'bad-price', initialPrice: -1 },
              { ...validProfile, id: 'bad-frequency', frequency: 'weekly' }
            ],
            includedTickerIds: ['ticker-1', 'bad-price', 'ghost'],
            weightByTickerId: { 'ticker-1': 100, ghost: 10 },
            fixedByTickerId: { ghost: true },
            selectedTickerId: 'bad-frequency'
          },
          investmentSettings: { ...EMPTY_INVESTMENT_SETTINGS, taxRate: 500 }
        }
      ],
      activeScenarioId: 'a'
    });

    const scenario = result.scenarios[0];
    expect(scenario.portfolio.tickerProfiles.map((profile) => profile.id)).toEqual(['ticker-1']);
    expect(scenario.portfolio.includedTickerIds).toEqual(['ticker-1']);
    expect(scenario.portfolio.weightByTickerId).toEqual({ 'ticker-1': 100 });
    expect(scenario.portfolio.fixedByTickerId).toEqual({});
    expect(scenario.portfolio.selectedTickerId).toBeNull();
    expect(scenario.investmentSettings.taxRate).toBe(100);
  });

  it('savedName은 trim 되고 공백뿐이면 undefined', () => {
    expect(normalizePersistedAppState({ savedName: '  내 저장  ' }).savedName).toBe('내 저장');
    expect(normalizePersistedAppState({ savedName: '   ' }).savedName).toBeUndefined();
  });
});

describe('parsePersistedAppStateJson', () => {
  it('정상 JSON은 정규화된 payload로 만든다', () => {
    const json = JSON.stringify({
      scenarios: [{ id: 'a', name: 'A', portfolio: EMPTY_PORTFOLIO_STATE, investmentSettings: EMPTY_INVESTMENT_SETTINGS }],
      activeScenarioId: 'a',
      savedName: '내 저장'
    });

    const result = parsePersistedAppStateJson(json);
    expect(result.activeScenarioId).toBe('a');
    expect(result.savedName).toBe('내 저장');
  });

  it('JSON이 깨졌으면 throw 한다', () => {
    expect(() => parsePersistedAppStateJson('{not json')).toThrow();
  });

  it('JSON이 null이면 기본 탭으로 정규화된다', () => {
    const result = parsePersistedAppStateJson('null');
    expect(result.scenarios).toHaveLength(1);
    expect(result.scenarios[0].id).toBe(DEFAULT_SCENARIO_TAB_ID);
  });
});
