import { normalizePersistedAppState, sanitizeTickerProfile, type PersistedScenarioState } from '@/jotai';
import {
  decodeCompactPortfolio,
  decodeSharedScenario,
  encodeSharedScenario
} from '@/pages/Main/hooks/persistence';
import { DIVIDEND_UNIVERSE } from '@/shared/constants/presets';
import { isPayoutMonth, paymentsPerYearMap, runSimulation, toSimulationInput } from '@/shared/lib/snowball';
import type { Frequency, YieldFormValues } from '@/shared/types';
import type { TickerProfile } from '@/shared/types/snowball';

/**
 * 무배당 종목(`frequency: 'none'`)의 계약을 잠그는 스위트.
 *
 * 두 가지를 지킨다.
 *  1. **계산은 한 톨도 바뀌지 않는다** — 배당률 0 인 종목의 결과는 주기가 `'quarterly'` 든
 *     `'none'` 이든 완전히 같다(둘 다 배당 0). `'none'` 도입이 남의 저장 결과를 바꾸면 실패다.
 *  2. **저장·공유 왕복** — 옛 모양(`'quarterly'`)이 담긴 페이로드가 계속 열리고,
 *     새 값(`'none'`)도 왕복한다.
 */

const buildValues = (overrides: Partial<YieldFormValues> = {}): YieldFormValues => ({
  ticker: 'ANET',
  initialPrice: 290,
  dividendYield: 0,
  // 정합 모델에서 dividendGrowth 는 **주가 성장률**이다 — 무배당 종목이라도 0 이 아니다.
  dividendGrowth: 14,
  expectedTotalReturn: 14,
  frequency: 'none',
  initialInvestment: 10_000_000,
  monthlyContribution: 1_000_000,
  targetMonthlyDividend: 2_000_000,
  investmentStartDate: '2024-01-01',
  durationYears: 20,
  reinvestDividends: true,
  reinvestDividendPercent: 100,
  taxRate: 15.4,
  reinvestTiming: 'sameMonth',
  dpsGrowthMode: 'monthlySmooth',
  ...overrides
});

describe('무배당 종목 — 계산 회귀 (결과가 바뀌면 안 된다)', () => {
  it("주기를 'quarterly' 에서 'none' 으로 바꿔도 월별 결과가 완전히 같다", () => {
    const before = runSimulation(toSimulationInput(buildValues({ frequency: 'quarterly' })));
    const after = runSimulation(toSimulationInput(buildValues({ frequency: 'none' })));

    // 이 단정이 하위 호환의 본체다: 이미 저장된 ANET 항목(구 'quarterly')과 프리셋에서 새로
    // 담기는 항목('none')이 **같은 그림**을 그려야 한다.
    expect(after.monthly).toEqual(before.monthly);
    expect(after.yearly).toEqual(before.yearly);
    expect(after.summary).toEqual(before.summary);
  });

  it('배당 현금흐름은 전 구간 0 이고 세금도 0 이다', () => {
    const result = runSimulation(toSimulationInput(buildValues()));

    expect(result.monthly.every((row) => row.dividendPaid === 0)).toBe(true);
    expect(result.monthly.every((row) => row.taxPaid === 0)).toBe(true);
    expect(result.monthly.every((row) => row.cumulativeDividend === 0)).toBe(true);
    expect(result.summary.totalNetDividend).toBe(0);
  });

  it('자산 가치는 유한하고 주가 성장률만큼 자란다 (0 으로 나눠 NaN 이 새지 않는다)', () => {
    const result = runSimulation(toSimulationInput(buildValues({ monthlyContribution: 0, durationYears: 10 })));
    const last = result.monthly.at(-1)!;

    expect(Number.isFinite(last.portfolioValue)).toBe(true);
    expect(Number.isNaN(last.portfolioValue)).toBe(false);
    // 초기 1,000만원이 연 14% 로 10년 → 약 3.7배. 배당이 없으니 재투자분도 없다.
    expect(last.portfolioValue).toBeCloseTo(10_000_000 * 1.14 ** 10, 0);
  });

  it("'none' 은 지급월이 하나도 없고 연 지급 횟수가 0 이다", () => {
    for (let month = 1; month <= 12; month += 1) {
      expect(isPayoutMonth('none', month)).toBe(false);
    }
    expect(paymentsPerYearMap.none).toBe(0);
  });
});

describe('무배당 종목 — 저장 왕복 (하위 호환)', () => {
  const anet = (frequency: Frequency): TickerProfile => ({
    id: 'ticker-1',
    ticker: 'ANET',
    name: '아리스타 네트웍스',
    initialPrice: 290,
    dividendYield: 0,
    dividendGrowth: 14,
    expectedTotalReturn: 14,
    frequency
  });

  it.each<Frequency>(['quarterly', 'none'])(
    "저장된 프로필(frequency: '%s')이 그대로 복원된다",
    (frequency) => {
      expect(sanitizeTickerProfile(anet(frequency))).toEqual(anet(frequency));
    }
  );

  /**
   * 🔴 회귀 방지: 알 수 없는 주기를 만나면 sanitizer 가 프로필을 통째로 버린다(= 보유 종목 소실).
   * `'none'` 을 허용 목록에 넣지 않으면 이 케이스가 조용히 데이터를 지운다.
   */
  it("'none' 을 담은 저장 페이로드가 종목을 잃지 않고 열린다", () => {
    const payload = {
      portfolio: {
        tickerProfiles: [anet('none'), { ...anet('quarterly'), id: 'ticker-2', ticker: 'SCHD', dividendYield: 3.5 }],
        includedTickerIds: ['ticker-1', 'ticker-2'],
        weightByTickerId: { 'ticker-1': 50, 'ticker-2': 50 },
        fixedByTickerId: {},
        selectedTickerId: 'ticker-1'
      }
    };

    const restored = normalizePersistedAppState(payload);
    const active = restored.scenarios.find((scenario) => scenario.id === restored.activeScenarioId)!;

    expect(active.portfolio.tickerProfiles.map((profile) => profile.ticker)).toEqual(['ANET', 'SCHD']);
    expect(active.portfolio.tickerProfiles[0].frequency).toBe('none');
  });

  it('알 수 없는 주기는 여전히 막는다 (허용 목록이 느슨해지지 않았다)', () => {
    expect(sanitizeTickerProfile({ ...anet('quarterly'), frequency: 'weekly' })).toBeNull();
  });
});

describe('무배당 종목 — 공유 링크 왕복 (하위 호환)', () => {
  const scenarioWith = (frequency: Frequency): PersistedScenarioState =>
    normalizePersistedAppState({
      portfolio: {
        tickerProfiles: [
          {
            id: 'ticker-1',
            ticker: 'ANET',
            name: '아리스타 네트웍스',
            initialPrice: 290,
            dividendYield: 0,
            dividendGrowth: 14,
            expectedTotalReturn: 14,
            frequency
          }
        ],
        includedTickerIds: ['ticker-1'],
        weightByTickerId: { 'ticker-1': 100 },
        fixedByTickerId: {},
        selectedTickerId: 'ticker-1'
      }
    }).scenarios[0];

  it.each<Frequency>(['quarterly', 'none'])("공유 링크가 frequency '%s' 를 그대로 복원한다", (frequency) => {
    const decoded = decodeSharedScenario(encodeSharedScenario(scenarioWith(frequency)));

    expect(decoded?.portfolio.tickerProfiles[0].frequency).toBe(frequency);
    expect(decoded?.portfolio.tickerProfiles[0].dividendYield).toBe(0);
  });

  /**
   * 이미 세상에 나가 있는 링크의 모양: 튜플 6번째가 주기 코드 `1`(quarterly)인 ANET.
   * `'none'` 을 코드 **4** 로 뒤에 붙였으므로 0~3 의 의미는 그대로다.
   */
  it('옛 공유 링크의 주기 코드(0~3)는 의미가 바뀌지 않는다', () => {
    const portfolio = decodeCompactPortfolio({ t: [['ANET', 290, 0, 14, 14, 1, '아리스타 네트웍스']] });

    expect(portfolio.tickerProfiles[0]).toMatchObject({
      ticker: 'ANET',
      dividendYield: 0,
      dividendGrowth: 14,
      frequency: 'quarterly'
    });
  });

  it('무배당 종목은 옛 링크(quarterly)로 열어도 결과가 같다', () => {
    const legacy = decodeCompactPortfolio({ t: [['ANET', 290, 0, 14, 14, 1]] }).tickerProfiles[0];
    const current = decodeCompactPortfolio({ t: [['ANET', 290, 0, 14, 14, 4]] }).tickerProfiles[0];

    const run = (profile: TickerProfile) =>
      runSimulation(toSimulationInput(buildValues({ ...profile, frequency: profile.frequency })));

    expect(run(current).summary).toEqual(run(legacy).summary);
  });
});

describe('무배당 종목 — 유니버스 파생', () => {
  it('배당률 0 인 종목은 유니버스에서 주기가 none 이다', () => {
    const zeroYield = Object.values(DIVIDEND_UNIVERSE).filter((preset) => preset.dividendYield === 0);

    // 지금은 ANET 하나뿐이지만, 리터럴 대신 조건으로 잠근다 — 스냅샷 갱신으로 늘어도 규칙은 같다.
    expect(zeroYield.length).toBeGreaterThan(0);
    for (const preset of zeroYield) {
      expect(preset.frequency, `${preset.ticker} 는 배당률 0 인데 주기가 남아 있다`).toBe('none');
    }
  });

  it('배당을 지급하는 종목의 주기는 none 이 아니다', () => {
    for (const preset of Object.values(DIVIDEND_UNIVERSE)) {
      if (preset.dividendYield === 0) continue;
      expect(preset.frequency, `${preset.ticker}`).not.toBe('none');
    }
  });
});
