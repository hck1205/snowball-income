// @vitest-environment node — DOM 을 쓰지 않는 순수 테스트 (기준: vitest.config.ts)
import { EMPTY_INVESTMENT_SETTINGS, type PersistedInvestmentSettings, type PersistedScenarioState } from '@/jotai';
import { decodeSharedScenario, encodeSharedScenario } from '@/pages/Main/hooks/persistence';
import {
  buildOgCardModel,
  buildNormalizedAllocation,
  buildSimulationBundle,
  formatOgAmount,
  formatOgHeadline,
  formatOgHoldingsLine,
  getIncludedProfiles,
  OG_CARD_HEADLINE_MAX,
  OG_CARD_MAX_HOLDINGS,
  summarizePostSimSummaryForOg,
  summarizeShareCodeForOg,
  toOgCardHoldings
} from '@/pages/Main/utils';
import { defaultYieldFormValues } from '@/shared/lib/snowball';
import type { TickerProfile } from '@/shared/types/snowball';

/** 정합 프로필: dividendYield + dividendGrowth === expectedTotalReturn. */
const profile = (id: string, ticker: string, dividendYield: number, dividendGrowth: number): TickerProfile => ({
  id,
  ticker,
  name: '',
  initialPrice: 100,
  dividendYield,
  dividendGrowth,
  expectedTotalReturn: dividendYield + dividendGrowth,
  frequency: 'quarterly'
});

const schd = profile('t1', 'SCHD', 3.5, 5);
const jepi = profile('t2', 'JEPI', 7.2, 0);
const vig = profile('t3', 'VIG', 1.9, 7.6);
const pg = profile('t4', 'PG', 2.4, 5.6);
const ko = profile('t5', 'KO', 3.1, 4.4);
const o = profile('t6', 'O', 5.5, 2.5);

const buildSettings = (overrides: Partial<PersistedInvestmentSettings> = {}): PersistedInvestmentSettings => ({
  ...EMPTY_INVESTMENT_SETTINGS,
  initialInvestment: 10_000_000,
  monthlyContribution: 1_000_000,
  targetMonthlyDividend: 2_000_000,
  investmentStartDate: '2024-01-01',
  durationYears: 20,
  reinvestDividends: true,
  reinvestDividendPercent: 100,
  taxRate: 15.4,
  ...overrides
});

const buildScenario = (
  profiles: TickerProfile[],
  weightByTickerId: Record<string, number> = {},
  settings: Partial<PersistedInvestmentSettings> = {}
): PersistedScenarioState => ({
  id: 'shared-tab',
  name: '공유 탭',
  portfolio: {
    tickerProfiles: profiles,
    includedTickerIds: profiles.map((item) => item.id),
    weightByTickerId,
    fixedByTickerId: {},
    selectedTickerId: null
  },
  investmentSettings: buildSettings(settings)
});

const allocationOf = (profiles: TickerProfile[], weightByTickerId: Record<string, number>) =>
  buildNormalizedAllocation(profiles, weightByTickerId);

describe('toOgCardHoldings', () => {
  it('비중이 큰 순서로 정렬한다', () => {
    const { holdings } = toOgCardHoldings(allocationOf([schd, jepi, vig], { t1: 20, t2: 50, t3: 30 }));

    expect(holdings.map((item) => item.ticker)).toEqual(['JEPI', 'VIG', 'SCHD']);
    expect(holdings.map((item) => item.percent)).toEqual([50, 30, 20]);
  });

  it('상위 N개만 남기고 나머지는 개수로 접는다', () => {
    const profiles = [schd, jepi, vig, pg, ko, o];
    const { holdings, hiddenHoldingCount } = toOgCardHoldings(
      allocationOf(profiles, { t1: 60, t2: 50, t3: 40, t4: 30, t5: 20, t6: 10 })
    );

    expect(holdings).toHaveLength(OG_CARD_MAX_HOLDINGS);
    expect(holdings.map((item) => item.ticker)).toEqual(['SCHD', 'JEPI', 'VIG', 'PG']);
    expect(hiddenHoldingCount).toBe(2);
  });

  it('종목 수가 한도 이하면 접지 않는다', () => {
    const { holdings, hiddenHoldingCount } = toOgCardHoldings(allocationOf([schd, jepi], { t1: 50, t2: 50 }));

    expect(holdings).toHaveLength(2);
    expect(hiddenHoldingCount).toBe(0);
  });

  it('동률이면 포트폴리오 순서를 유지한다 (카드가 렌더링마다 흔들리면 안 된다)', () => {
    const { holdings } = toOgCardHoldings(allocationOf([schd, jepi, vig], { t1: 1, t2: 1, t3: 1 }));

    expect(holdings.map((item) => item.ticker)).toEqual(['SCHD', 'JEPI', 'VIG']);
  });

  it('빈 포트폴리오도 터지지 않는다', () => {
    expect(toOgCardHoldings([])).toEqual({ holdings: [], hiddenHoldingCount: 0 });
  });
});

describe('formatOgHoldingsLine', () => {
  it('가운뎃점으로 잇는다', () => {
    expect(
      formatOgHoldingsLine(
        [
          { ticker: 'SCHD', percent: 30 },
          { ticker: 'VIG', percent: 20 }
        ],
        0
      )
    ).toBe('SCHD 30% · VIG 20%');
  });

  it('접힌 종목은 "외 M개"로 표시한다', () => {
    expect(formatOgHoldingsLine([{ ticker: 'SCHD', percent: 30 }], 2)).toBe('SCHD 30% 외 2개');
  });

  it('표시할 종목이 없으면 개수만 알린다', () => {
    expect(formatOgHoldingsLine([], 3)).toBe('3개 종목');
    expect(formatOgHoldingsLine([], 0)).toBe('');
  });
});

describe('formatOgAmount', () => {
  it('억 단위는 소수 한 자리까지 줄인다', () => {
    expect(formatOgAmount(1_240_000_000)).toBe('12.4억');
    expect(formatOgAmount(300_000_000)).toBe('3억');
    expect(formatOgAmount(100_000_000)).toBe('1억');
  });

  it('만 단위는 반올림한 정수로 쓴다', () => {
    expect(formatOgAmount(32_000_000)).toBe('3,200만');
    expect(formatOgAmount(10_000)).toBe('1만');
  });

  it('만원 미만은 원으로 쓴다', () => {
    expect(formatOgAmount(9_999)).toBe('9,999원');
    expect(formatOgAmount(0)).toBe('0원');
  });

  it('음수도 부호를 유지한다', () => {
    expect(formatOgAmount(-1_240_000_000)).toBe('-12.4억');
  });
});

describe('buildOgCardModel', () => {
  it('앱이 화면에 쓰는 요약값과 정확히 같은 숫자를 낸다', () => {
    const weights = { t1: 60, t2: 40 };
    const scenario = buildScenario([schd, jepi], weights);

    const model = buildOgCardModel(scenario);
    expect(model).not.toBeNull();

    // 카드가 앱과 다른 숫자를 보여주면 그건 버그다. 같은 엔진을 같은 입력으로 돌려서 대조한다.
    const includedProfiles = getIncludedProfiles(scenario.portfolio.tickerProfiles, scenario.portfolio.includedTickerIds);
    const { simulation } = buildSimulationBundle({
      isValid: true,
      includedProfiles,
      normalizedAllocation: buildNormalizedAllocation(includedProfiles, weights),
      values: { ...defaultYieldFormValues, ...scenario.investmentSettings }
    });

    expect(model?.finalAssetValue).toBe(simulation?.summary.finalAssetValue);
    expect(model?.finalMonthlyDividend).toBe(simulation?.summary.finalMonthlyAverageDividend);
    expect(model?.finalAssetValue).toBeGreaterThan(0);
    expect(model?.finalMonthlyDividend).toBeGreaterThan(0);
  });

  it('투자 조건을 그대로 싣는다', () => {
    const model = buildOgCardModel(buildScenario([schd], { t1: 100 }, { durationYears: 15, monthlyContribution: 700_000 }));

    expect(model?.durationYears).toBe(15);
    expect(model?.monthlyContribution).toBe(700_000);
    expect(model?.holdings).toEqual([{ ticker: 'SCHD', percent: 100 }]);
  });

  it('포함된 종목이 없으면 null (기본 카드로 폴백한다)', () => {
    const scenario = buildScenario([schd], { t1: 100 });
    scenario.portfolio.includedTickerIds = [];

    expect(buildOgCardModel(scenario)).toBeNull();
  });

  it('목표에 도달하지 못하면 targetReachedYear 가 null 이다', () => {
    const model = buildOgCardModel(
      buildScenario([schd], { t1: 100 }, { targetMonthlyDividend: 999_999_999, durationYears: 5 })
    );

    expect(model?.targetReachedYear).toBeNull();
  });
});

describe('summarizeShareCodeForOg', () => {
  it('실제 공유 코드를 왕복해서 카드 모델을 만든다', () => {
    const scenario = buildScenario([schd, jepi, vig], { t1: 50, t2: 30, t3: 20 });
    const shareCode = encodeSharedScenario(scenario);

    const model = summarizeShareCodeForOg(shareCode, decodeSharedScenario);

    expect(model).not.toBeNull();
    expect(model?.holdings.map((item) => item.ticker)).toEqual(['SCHD', 'JEPI', 'VIG']);
    expect(model?.holdings.map((item) => item.percent)).toEqual([50, 30, 20]);
    expect(model?.durationYears).toBe(20);
    expect(model?.finalMonthlyDividend).toBeGreaterThan(0);
  });

  it('쓰레기 코드/빈 값에는 예외 대신 null 을 준다 (/api/og 는 절대 5xx 를 내면 안 된다)', () => {
    expect(summarizeShareCodeForOg(null, decodeSharedScenario)).toBeNull();
    expect(summarizeShareCodeForOg(undefined, decodeSharedScenario)).toBeNull();
    expect(summarizeShareCodeForOg('', decodeSharedScenario)).toBeNull();
    expect(summarizeShareCodeForOg('not-a-real-share-code', decodeSharedScenario)).toBeNull();
    expect(summarizeShareCodeForOg('%%%%%', decodeSharedScenario)).toBeNull();
  });

  it('디코더가 던져도 삼킨다 (모든 실패는 기본 카드로 폴백해야 한다)', () => {
    const throwingDecoder = () => {
      throw new Error('boom');
    };

    expect(summarizeShareCodeForOg('anything', throwingDecoder)).toBeNull();
  });
});

/**
 * post 카드(`/api/og?post=<id>`)는 sim_summary 만 읽어 **종목별 비중이 없다**.
 * 그대로 두면 헤드라인이 "5개 종목" 같은 무정보 문구가 되므로 글 제목을 헤드라인으로 쓴다.
 */
describe('summarizePostSimSummaryForOg — post 카드 헤드라인', () => {
  const summary = {
    version: 1,
    durationYears: 20,
    tickerCount: 5,
    initialInvestment: 10_000_000,
    monthlyContribution: 1_500_000,
    totalContribution: 370_000_000,
    finalAssetValue: 990_000_000,
    finalMonthlyDividend: 3_670_000,
    targetMonthlyDividend: 2_000_000,
    targetReachedInYears: 15
  };

  it('제목을 주면 헤드라인이 된다', () => {
    expect(summarizePostSimSummaryForOg(summary, '인컴×성장 바벨 포트폴리오')?.headline).toBe(
      '인컴×성장 바벨 포트폴리오'
    );
  });

  it('제목이 없거나 공백뿐이면 헤드라인을 세우지 않는다 (구성 요약으로 폴백)', () => {
    expect(summarizePostSimSummaryForOg(summary)?.headline).toBeUndefined();
    expect(summarizePostSimSummaryForOg(summary, '   ')?.headline).toBeUndefined();
    expect(summarizePostSimSummaryForOg(summary, null)?.headline).toBeUndefined();
  });

  it('제목이 없어도 카드 자체는 그린다 — 숫자만으로도 미리보기 값은 남는다', () => {
    const model = summarizePostSimSummaryForOg(summary);
    expect(model).not.toBeNull();
    expect(model?.finalMonthlyDividend).toBe(3_670_000);
  });

  it('깨진 sim_summary 에는 예외 대신 null (og 는 5xx 금지)', () => {
    expect(summarizePostSimSummaryForOg(null, '제목')).toBeNull();
    expect(summarizePostSimSummaryForOg({ version: 999 }, '제목')).toBeNull();
  });
});

describe('formatOgHeadline — 한 줄 정규화', () => {
  it('줄바꿈·연속 공백을 한 칸으로 접는다 (flex 한 줄 레이아웃이 깨지지 않게)', () => {
    expect(formatOgHeadline('배당  포트폴리오\n공개')).toBe('배당 포트폴리오 공개');
    expect(formatOgHeadline('  앞뒤 공백  ')).toBe('앞뒤 공백');
  });

  it('길면 말줄임한다 — 카드 밖으로 넘치는 쪽이 더 나쁘다', () => {
    const long = '가'.repeat(40);
    const result = formatOgHeadline(long);
    expect(result).toHaveLength(OG_CARD_HEADLINE_MAX);
    expect(result.endsWith('…')).toBe(true);
  });

  it('경계 길이는 자르지 않는다', () => {
    const exact = '나'.repeat(OG_CARD_HEADLINE_MAX);
    expect(formatOgHeadline(exact)).toBe(exact);
  });
});
