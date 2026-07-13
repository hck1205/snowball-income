import { compressToEncodedURIComponent } from 'lz-string';
import { EMPTY_INVESTMENT_SETTINGS, type PersistedInvestmentSettings, type PersistedScenarioState } from '@/jotai';
import {
  decodeCompactInvestmentSettingsV2,
  decodeCompactInvestmentSettingsV3,
  decodeCompactPortfolio,
  decodeFrequency,
  decodeSharedScenario,
  decodeVisibleYearlySeriesMask,
  encodeFrequency,
  encodeSharedScenario,
  encodeVisibleYearlySeriesMask,
  SHARED_SCENARIO_DECODED_NAME,
  SHARED_SCENARIO_ID
} from '@/pages/Main/hooks/persistence';
import type { Frequency } from '@/shared/types';
import type { TickerProfile } from '@/shared/types/snowball';

const schd: TickerProfile = {
  id: 'ticker-1',
  ticker: 'SCHD',
  name: '슈드',
  initialPrice: 27.5,
  dividendYield: 3.5,
  dividendGrowth: 6,
  expectedTotalReturn: 8.5,
  frequency: 'quarterly'
};

const jepi: TickerProfile = {
  id: 'ticker-2',
  ticker: 'JEPI',
  name: '',
  initialPrice: 55,
  dividendYield: 7.2,
  dividendGrowth: 0,
  expectedTotalReturn: 7.2,
  frequency: 'monthly'
};

const buildSettings = (overrides: Partial<PersistedInvestmentSettings> = {}): PersistedInvestmentSettings => ({
  ...EMPTY_INVESTMENT_SETTINGS,
  initialInvestment: 10_000_000,
  monthlyContribution: 1_500_000,
  targetMonthlyDividend: 3_000_000,
  investmentStartDate: '2024-01-01',
  durationYears: 25,
  reinvestDividends: true,
  reinvestDividendPercent: 80,
  taxRate: 15.4,
  reinvestTiming: 'nextMonth',
  dpsGrowthMode: 'annualStep',
  showQuickEstimate: true,
  showSplitGraphs: true,
  isResultCompact: true,
  isYearlyAreaFillOn: false,
  showPortfolioDividendCenter: false,
  visibleYearlySeries: {
    totalContribution: false,
    assetValue: true,
    annualDividend: true,
    monthlyDividend: false,
    cumulativeDividend: true
  },
  ...overrides
});

const buildScenario = (overrides: Partial<PersistedScenarioState> = {}): PersistedScenarioState => ({
  id: 'my-tab',
  name: '내 탭',
  portfolio: {
    tickerProfiles: [schd, jepi],
    includedTickerIds: ['ticker-1', 'ticker-2'],
    weightByTickerId: { 'ticker-1': 60, 'ticker-2': 40 },
    fixedByTickerId: { 'ticker-1': true, 'ticker-2': false },
    selectedTickerId: 'ticker-2'
  },
  investmentSettings: buildSettings(),
  ...overrides
});

describe('encodeFrequency / decodeFrequency', () => {
  it('4가지 지급 주기가 왕복한다', () => {
    const frequencies: Frequency[] = ['monthly', 'quarterly', 'semiannual', 'annual'];
    frequencies.forEach((frequency) => {
      expect(decodeFrequency(encodeFrequency(frequency))).toBe(frequency);
    });
  });

  it('알 수 없는 코드는 annual로 폴백한다', () => {
    expect(decodeFrequency(99)).toBe('annual');
    expect(decodeFrequency(undefined)).toBe('annual');
  });
});

describe('encodeVisibleYearlySeriesMask / decodeVisibleYearlySeriesMask', () => {
  it('32가지 조합이 모두 왕복한다', () => {
    for (let mask = 0; mask < 32; mask += 1) {
      const decoded = decodeVisibleYearlySeriesMask(mask);
      expect(encodeVisibleYearlySeriesMask(decoded)).toBe(mask);
    }
  });

  it('비트 위치가 시리즈 키에 고정되어 있다', () => {
    expect(
      encodeVisibleYearlySeriesMask({
        totalContribution: true,
        assetValue: false,
        annualDividend: false,
        monthlyDividend: false,
        cumulativeDividend: false
      })
    ).toBe(1);
    expect(
      encodeVisibleYearlySeriesMask({
        totalContribution: false,
        assetValue: false,
        annualDividend: false,
        monthlyDividend: false,
        cumulativeDividend: true
      })
    ).toBe(16);
  });
});

describe('decodeCompactPortfolio', () => {
  it('인덱스 참조를 shared-N id로 되돌린다', () => {
    const portfolio = decodeCompactPortfolio({
      t: [
        ['SCHD', 27.5, 3.5, 6, 8.5, 1, '슈드'],
        ['JEPI', 55, 7.2, 0, 7.2, 0]
      ],
      i: [1, 0],
      w: [
        [0, 60],
        [1, 40]
      ],
      f: [0],
      s: 1
    });

    expect(portfolio.tickerProfiles.map((profile) => profile.id)).toEqual(['shared-0', 'shared-1']);
    expect(portfolio.includedTickerIds).toEqual(['shared-1', 'shared-0']);
    expect(portfolio.weightByTickerId).toEqual({ 'shared-0': 60, 'shared-1': 40 });
    expect(portfolio.fixedByTickerId).toEqual({ 'shared-0': true });
    expect(portfolio.selectedTickerId).toBe('shared-1');
  });

  it('i가 없으면 모든 티커가 포함된 것으로 본다', () => {
    const portfolio = decodeCompactPortfolio({ t: [['SCHD', 27.5, 3.5, 6, 8.5, 1]] });
    expect(portfolio.includedTickerIds).toEqual(['shared-0']);
    expect(portfolio.selectedTickerId).toBeNull();
  });

  it('범위를 벗어난 인덱스와 깨진 티커 튜플은 버린다', () => {
    const portfolio = decodeCompactPortfolio({
      t: [
        ['SCHD', 27.5, 3.5, 6, 8.5, 1],
        ['BAD', -1, 3.5, 6, 8.5, 1]
      ],
      i: [0, 5],
      w: [[9, 100]],
      f: [7],
      s: 42
    });

    expect(portfolio.tickerProfiles).toHaveLength(1);
    expect(portfolio.includedTickerIds).toEqual(['shared-0']);
    expect(portfolio.weightByTickerId).toEqual({});
    expect(portfolio.fixedByTickerId).toEqual({});
    expect(portfolio.selectedTickerId).toBeNull();
  });

  it('빈 포트폴리오도 처리한다', () => {
    const portfolio = decodeCompactPortfolio({ t: [] });
    expect(portfolio.tickerProfiles).toEqual([]);
    expect(portfolio.includedTickerIds).toEqual([]);
  });
});

describe('decodeCompactInvestmentSettingsV2', () => {
  it('없는 필드는 기본값을 유지한다', () => {
    const settings = decodeCompactInvestmentSettingsV2({});
    expect(settings.durationYears).toBe(EMPTY_INVESTMENT_SETTINGS.durationYears);
    expect(settings.reinvestDividends).toBe(EMPTY_INVESTMENT_SETTINGS.reinvestDividends);
    expect(settings.isYearlyAreaFillOn).toBe(true);
  });

  it('n === 0 일 때만 isYearlyAreaFillOn을 끈다', () => {
    expect(decodeCompactInvestmentSettingsV2({ n: 0 }).isYearlyAreaFillOn).toBe(false);
    expect(decodeCompactInvestmentSettingsV2({ n: 1 }).isYearlyAreaFillOn).toBe(true);
  });

  it('압축 필드를 되돌린다', () => {
    const settings = decodeCompactInvestmentSettingsV2({
      a: 100,
      b: 200,
      c: 300,
      d: '2020-05-05',
      e: 12,
      f: 1,
      g: 50,
      h: 22,
      i: 1,
      j: 1,
      k: 1,
      l: 1,
      m: 1,
      o: 1,
      p: 31
    });

    expect(settings.initialInvestment).toBe(100);
    expect(settings.monthlyContribution).toBe(200);
    expect(settings.targetMonthlyDividend).toBe(300);
    expect(settings.investmentStartDate).toBe('2020-05-05');
    expect(settings.durationYears).toBe(12);
    expect(settings.reinvestDividends).toBe(true);
    expect(settings.reinvestDividendPercent).toBe(50);
    expect(settings.taxRate).toBe(22);
    expect(settings.reinvestTiming).toBe('nextMonth');
    expect(settings.dpsGrowthMode).toBe('annualStep');
    expect(settings.visibleYearlySeries).toEqual({
      totalContribution: true,
      assetValue: true,
      annualDividend: true,
      monthlyDividend: true,
      cumulativeDividend: true
    });
  });

  it('객체가 아니면 기본값 그대로', () => {
    expect(decodeCompactInvestmentSettingsV2(undefined).durationYears).toBe(EMPTY_INVESTMENT_SETTINGS.durationYears);
  });
});

describe('decodeCompactInvestmentSettingsV3', () => {
  it('h === null 이면 taxRate가 undefined가 된다 (정규화 전 단계)', () => {
    const settings = decodeCompactInvestmentSettingsV3({
      a: 0,
      b: 0,
      c: 0,
      d: '2024-01-01',
      e: 10,
      f: 0,
      g: 100,
      h: null,
      i: 0,
      j: 0,
      k: 0,
      l: 0,
      m: 0,
      n: 1,
      o: 1,
      p: 3
    });

    expect(settings.taxRate).toBeUndefined();
  });
});

describe('공유 링크 v3 왕복', () => {
  it('encode → decode 가 시나리오 내용을 보존한다 (id/name은 공유 탭 규약으로 치환)', () => {
    const scenario = buildScenario();
    const decoded = decodeSharedScenario(encodeSharedScenario(scenario));

    expect(decoded).not.toBeNull();
    expect(decoded?.id).toBe(SHARED_SCENARIO_ID);
    expect(decoded?.name).toBe(SHARED_SCENARIO_DECODED_NAME);

    expect(decoded?.portfolio.tickerProfiles).toEqual([
      { ...schd, id: 'shared-0' },
      { ...jepi, id: 'shared-1' }
    ]);
    expect(decoded?.portfolio.includedTickerIds).toEqual(['shared-0', 'shared-1']);
    expect(decoded?.portfolio.weightByTickerId).toEqual({ 'shared-0': 60, 'shared-1': 40 });
    expect(decoded?.portfolio.selectedTickerId).toBe('shared-1');
    expect(decoded?.investmentSettings).toEqual(buildSettings());
  });

  it('false인 fixed 항목은 인코딩되지 않아 왕복 후 사라진다 (현재 동작)', () => {
    const decoded = decodeSharedScenario(encodeSharedScenario(buildScenario()));
    expect(decoded?.portfolio.fixedByTickerId).toEqual({ 'shared-0': true });
  });

  it('포함 티커 순서/부분집합이 보존된다', () => {
    const scenario = buildScenario({
      portfolio: {
        tickerProfiles: [schd, jepi],
        includedTickerIds: ['ticker-2'],
        weightByTickerId: {},
        fixedByTickerId: {},
        selectedTickerId: null
      }
    });

    const decoded = decodeSharedScenario(encodeSharedScenario(scenario));
    expect(decoded?.portfolio.includedTickerIds).toEqual(['shared-1']);
    expect(decoded?.portfolio.selectedTickerId).toBeNull();
  });

  it('빈 포트폴리오도 왕복한다', () => {
    const scenario = buildScenario({
      portfolio: {
        tickerProfiles: [],
        includedTickerIds: [],
        weightByTickerId: {},
        fixedByTickerId: {},
        selectedTickerId: null
      }
    });

    const decoded = decodeSharedScenario(encodeSharedScenario(scenario));
    expect(decoded?.portfolio.tickerProfiles).toEqual([]);
    expect(decoded?.portfolio.includedTickerIds).toEqual([]);
  });

  it('비중 0도 보존한다', () => {
    const scenario = buildScenario({
      portfolio: {
        tickerProfiles: [schd, jepi],
        includedTickerIds: ['ticker-1', 'ticker-2'],
        weightByTickerId: { 'ticker-1': 0, 'ticker-2': 100 },
        fixedByTickerId: {},
        selectedTickerId: null
      }
    });

    const decoded = decodeSharedScenario(encodeSharedScenario(scenario));
    expect(decoded?.portfolio.weightByTickerId).toEqual({ 'shared-0': 0, 'shared-1': 100 });
  });

  // 현재 동작 고정(버그): 비과세(taxRate: undefined)로 공유하면 받는 쪽에서 기본 세율 15.4%로 되살아난다.
  it('taxRate: undefined는 왕복하지 못하고 기본 세율로 되돌아온다 (현재 동작)', () => {
    const scenario = buildScenario({ investmentSettings: buildSettings({ taxRate: undefined }) });
    const decoded = decodeSharedScenario(encodeSharedScenario(scenario));

    expect(decoded?.investmentSettings.taxRate).toBe(EMPTY_INVESTMENT_SETTINGS.taxRate);
  });

  it.todo('taxRate: undefined 시나리오를 공유하면 받는 쪽도 undefined여야 한다 (버그: 기본 세율로 덮어써짐)');
});

describe('공유 링크 하위호환 디코딩', () => {
  it('v1 봉투를 디코딩하고 원래 id/name과 티커 id를 유지한다', () => {
    const encoded = compressToEncodedURIComponent(
      JSON.stringify({
        v: 1,
        scenario: {
          id: 'legacy-tab',
          name: '레거시 탭',
          portfolio: {
            tickerProfiles: [schd],
            includedTickerIds: ['ticker-1'],
            weightByTickerId: { 'ticker-1': 100 },
            fixedByTickerId: {},
            selectedTickerId: 'ticker-1'
          },
          investmentSettings: buildSettings()
        }
      })
    );

    const decoded = decodeSharedScenario(encoded);
    expect(decoded?.id).toBe('legacy-tab');
    expect(decoded?.name).toBe('레거시 탭');
    expect(decoded?.portfolio.tickerProfiles[0].id).toBe('ticker-1');
    expect(decoded?.investmentSettings.durationYears).toBe(25);
  });

  it('v1에서 id/name이 비면 공유 탭 기본값을 쓴다', () => {
    const encoded = compressToEncodedURIComponent(
      JSON.stringify({
        v: 1,
        scenario: {
          portfolio: {
            tickerProfiles: [schd],
            includedTickerIds: ['ticker-1'],
            weightByTickerId: {},
            fixedByTickerId: {},
            selectedTickerId: null
          },
          investmentSettings: buildSettings()
        }
      })
    );

    const decoded = decodeSharedScenario(encoded);
    expect(decoded?.id).toBe(SHARED_SCENARIO_ID);
    expect(decoded?.name).toBe(SHARED_SCENARIO_DECODED_NAME);
  });

  it('v2 봉투를 디코딩한다', () => {
    const encoded = compressToEncodedURIComponent(
      JSON.stringify({
        v: 2,
        p: {
          t: [
            ['SCHD', 27.5, 3.5, 6, 8.5, 1, '슈드'],
            ['JEPI', 55, 7.2, 0, 7.2, 0]
          ],
          w: [
            [0, 70],
            [1, 30]
          ],
          f: [1],
          s: 0
        },
        i: { a: 5_000_000, e: 15, f: 1, h: 15.4, n: 0, p: 3 }
      })
    );

    const decoded = decodeSharedScenario(encoded);
    expect(decoded?.id).toBe(SHARED_SCENARIO_ID);
    expect(decoded?.portfolio.tickerProfiles.map((profile) => profile.ticker)).toEqual(['SCHD', 'JEPI']);
    expect(decoded?.portfolio.tickerProfiles[1].frequency).toBe('monthly');
    expect(decoded?.portfolio.weightByTickerId).toEqual({ 'shared-0': 70, 'shared-1': 30 });
    expect(decoded?.portfolio.fixedByTickerId).toEqual({ 'shared-1': true });
    expect(decoded?.portfolio.selectedTickerId).toBe('shared-0');
    expect(decoded?.investmentSettings.initialInvestment).toBe(5_000_000);
    expect(decoded?.investmentSettings.durationYears).toBe(15);
    expect(decoded?.investmentSettings.reinvestDividends).toBe(true);
    expect(decoded?.investmentSettings.isYearlyAreaFillOn).toBe(false);
    expect(decoded?.investmentSettings.visibleYearlySeries).toEqual({
      totalContribution: true,
      assetValue: true,
      annualDividend: false,
      monthlyDividend: false,
      cumulativeDividend: false
    });
  });

  it('v2에서 투자 설정(i)이 없으면 기본 설정으로 디코딩한다', () => {
    const encoded = compressToEncodedURIComponent(
      JSON.stringify({
        v: 2,
        p: { t: [['SCHD', 27.5, 3.5, 6, 8.5, 1]] }
      })
    );

    const decoded = decodeSharedScenario(encoded);
    expect(decoded?.investmentSettings.durationYears).toBe(EMPTY_INVESTMENT_SETTINGS.durationYears);
    expect(decoded?.portfolio.tickerProfiles).toHaveLength(1);
  });

  it('v3 봉투를 직접 만들어도 디코딩된다', () => {
    const encoded = compressToEncodedURIComponent(
      JSON.stringify({
        v: 3,
        p: { t: [['SCHD', 27.5, 3.5, 6, 8.5, 1]] },
        i: {
          a: 1,
          b: 2,
          c: 3,
          d: '2023-03-03',
          e: 11,
          f: 1,
          g: 90,
          h: 22,
          i: 1,
          j: 1,
          k: 1,
          l: 1,
          m: 1,
          n: 1,
          o: 1,
          p: 31
        }
      })
    );

    const decoded = decodeSharedScenario(encoded);
    expect(decoded?.investmentSettings.investmentStartDate).toBe('2023-03-03');
    expect(decoded?.investmentSettings.taxRate).toBe(22);
    expect(decoded?.investmentSettings.reinvestTiming).toBe('nextMonth');
    expect(decoded?.investmentSettings.dpsGrowthMode).toBe('annualStep');
  });
});

describe('decodeSharedScenario 방어', () => {
  it('빈 문자열/깨진 코드/알 수 없는 버전이면 null', () => {
    expect(decodeSharedScenario('')).toBeNull();
    expect(decodeSharedScenario('!!!not-lz-string!!!')).toBeNull();
    expect(decodeSharedScenario(compressToEncodedURIComponent('not json'))).toBeNull();
    expect(decodeSharedScenario(compressToEncodedURIComponent(JSON.stringify({ v: 99, p: { t: [] } })))).toBeNull();
    expect(decodeSharedScenario(compressToEncodedURIComponent(JSON.stringify({ v: 3, p: { t: [] } })))).toBeNull();
    expect(decodeSharedScenario(compressToEncodedURIComponent(JSON.stringify([1, 2, 3])))).toBeNull();
  });
});
