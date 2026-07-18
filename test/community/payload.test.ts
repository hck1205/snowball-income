import { describe, expect, it } from 'vitest';
import {
  fromScenarioPayload,
  getScenarioPayloadByteSize,
  isScenarioPayloadPublishable,
  SCENARIO_PAYLOAD_MAX_BYTES,
  toScenarioPayload,
  validateScenarioPayload
} from '@/shared/lib/supabase';
import type { ScenarioPayload } from '@/shared/lib/supabase';
import type { PersistedScenarioState } from '@/jotai/snowball/types';
import type { TickerProfile } from '@/shared/types/snowball';

const ticker = (id: string): TickerProfile => ({
  id,
  ticker: `T${id}`,
  name: `티커 ${id}`,
  initialPrice: 100,
  dividendYield: 4,
  dividendGrowth: 3,
  expectedTotalReturn: 7,
  frequency: 'quarterly'
});

const buildScenario = (tickers: TickerProfile[] = []): PersistedScenarioState => ({
  id: 'local-tab-1',
  name: '내 시나리오',
  portfolio: {
    tickerProfiles: tickers,
    includedTickerIds: tickers.map((profile) => profile.id),
    weightByTickerId: {},
    fixedByTickerId: {},
    selectedTickerId: null
  },
  investmentSettings: {
    initialInvestment: 10_000_000,
    monthlyContribution: 500_000,
    targetMonthlyDividend: 2_000_000,
    investmentStartDate: '2026-01-01',
    durationYears: 20,
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
    }
  }
});

describe('toScenarioPayload', () => {
  it('로컬 탭 id/name을 버리고 portfolio/investmentSettings만 남긴다', () => {
    const payload = toScenarioPayload(buildScenario([ticker('a')]));

    expect(Object.keys(payload).sort()).toEqual(['investmentSettings', 'portfolio']);
    expect(payload.portfolio.tickerProfiles).toHaveLength(1);
  });
});

describe('fromScenarioPayload', () => {
  it('서버 페이로드에 로컬 id/name을 다시 붙여 앱 시나리오로 되돌린다', () => {
    const original = buildScenario([ticker('a')]);
    const payload = toScenarioPayload(original);

    const restored = fromScenarioPayload(payload, { id: 'new-tab', name: '가져온 시나리오' });

    expect(restored.id).toBe('new-tab');
    expect(restored.name).toBe('가져온 시나리오');
    expect(restored.portfolio).toEqual(original.portfolio);
    expect(restored.investmentSettings).toEqual(original.investmentSettings);
  });

  it('왕복(앱 → 서버 → 앱)이 계산에 쓰이는 값을 보존한다', () => {
    const original = buildScenario([ticker('a'), ticker('b')]);

    const restored = fromScenarioPayload(toScenarioPayload(original), { id: original.id, name: original.name });

    expect(restored).toEqual(original);
  });
});

describe('getScenarioPayloadByteSize', () => {
  it('문자 수가 아니라 UTF-8 바이트 수를 센다 (한글 1자 = 3바이트)', () => {
    const payload = { portfolio: { name: '한글' }, investmentSettings: {} } as unknown as ScenarioPayload;
    const json = JSON.stringify(payload);

    // JSON 문자열 길이보다 크다 = 멀티바이트를 제대로 반영했다는 뜻
    expect(getScenarioPayloadByteSize(payload)).toBeGreaterThan(json.length);
  });
});

describe('validateScenarioPayload', () => {
  it('정상 페이로드는 문제 없음', () => {
    expect(validateScenarioPayload(toScenarioPayload(buildScenario([ticker('a')])))).toEqual([]);
    expect(isScenarioPayloadPublishable(toScenarioPayload(buildScenario()))).toBe(true);
  });

  it('티커 50개 초과를 잡는다 (서버 CHECK와 동일 규칙)', () => {
    const tickers = Array.from({ length: 51 }, (_, index) => ticker(String(index)));

    expect(validateScenarioPayload(toScenarioPayload(buildScenario(tickers)))).toContain('too-many-tickers');
  });

  it('티커 50개는 통과한다 (경계값)', () => {
    const tickers = Array.from({ length: 50 }, (_, index) => ticker(String(index)));

    expect(validateScenarioPayload(toScenarioPayload(buildScenario(tickers)))).not.toContain('too-many-tickers');
  });

  it('64KB 초과 페이로드를 잡는다', () => {
    const payload = {
      portfolio: { tickerProfiles: [], padding: 'x'.repeat(SCENARIO_PAYLOAD_MAX_BYTES) },
      investmentSettings: {}
    } as unknown as ScenarioPayload;

    expect(validateScenarioPayload(payload)).toContain('payload-too-large');
    expect(isScenarioPayloadPublishable(payload)).toBe(false);
  });

  it('필수 키가 없으면 잡는다', () => {
    const payload = {} as unknown as ScenarioPayload;

    const issues = validateScenarioPayload(payload);

    expect(issues).toContain('missing-portfolio');
    expect(issues).toContain('missing-investment-settings');
  });
});
