import { EMPTY_INVESTMENT_SETTINGS, type PersistedInvestmentSettings } from '@/jotai';
import type { TickerProfile } from '@/shared/types/snowball';

/**
 * `runScenarioPayload` 추출 리팩터링의 **회귀 방어용 payload 행렬**.
 *
 * `buildScenarioSimSummary`(커뮤니티 sim_summary)는 게시 시점에 값이 굳는다 — 계산 경로가
 * 바뀌어 숫자가 달라지면 이미 게시된 글과 새 글이 어긋난다. 그래서 리팩터링 전(HEAD) 구현으로
 * 뽑아 둔 골든(`scenarioSummaryLegacy.golden.json`)과 현재 구현을 이 행렬 전체에서 대조한다.
 *
 * 케이스 축: 재투자 on/off·부분 / 목표 0·양수·미달성 / 종목 1개·다수 / 주기 혼합 /
 * 기간 1년·장기 / 가중치 합 0·미지정·음수 / 세율 0·최대 / 재투자 타이밍 / DPS 성장 모드 / 시작월.
 */

const profile = (
  id: string,
  ticker: string,
  dividendYield: number,
  dividendGrowth: number,
  frequency: TickerProfile['frequency'] = 'quarterly',
  initialPrice = 100
): TickerProfile => ({
  id,
  ticker,
  name: '',
  initialPrice,
  dividendYield,
  dividendGrowth,
  expectedTotalReturn: dividendYield + dividendGrowth,
  frequency
});

export const MATRIX_SCHD = profile('t1', 'SCHD', 3.5, 5, 'quarterly');
export const MATRIX_JEPI = profile('t2', 'JEPI', 7.2, 0, 'monthly', 57);
export const MATRIX_VIG = profile('t3', 'VIG', 1.9, 7.6, 'annual', 180);
export const MATRIX_SEMI = profile('t4', 'SEMI', 4.4, 2.2, 'semiannual', 30);

const settings = (overrides: Partial<PersistedInvestmentSettings> = {}): PersistedInvestmentSettings => ({
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

export const buildMatrixPayload = (
  profiles: TickerProfile[],
  weightByTickerId: Record<string, number> = {},
  overrides: Partial<PersistedInvestmentSettings> = {}
) => ({
  portfolio: {
    tickerProfiles: profiles,
    includedTickerIds: profiles.map((item) => item.id),
    weightByTickerId,
    fixedByTickerId: {},
    selectedTickerId: null
  },
  investmentSettings: settings(overrides)
});

export type ScenarioMatrixCase = {
  name: string;
  payload: ReturnType<typeof buildMatrixPayload>;
};

export const SCENARIO_PAYLOAD_MATRIX: ScenarioMatrixCase[] = [
  {
    name: '단일 종목 · 분기 · 기본',
    payload: buildMatrixPayload([MATRIX_SCHD], { t1: 100 })
  },
  {
    name: '단일 종목 · 월배당',
    payload: buildMatrixPayload([MATRIX_JEPI], { t2: 100 })
  },
  {
    name: '단일 종목 · 연배당 · 12월 시작(1년차 무배당)',
    payload: buildMatrixPayload([MATRIX_VIG], { t3: 100 }, { investmentStartDate: '2024-12-01' })
  },
  {
    name: '4종목 · 주기 혼합 · 가중',
    payload: buildMatrixPayload([MATRIX_SCHD, MATRIX_JEPI, MATRIX_VIG, MATRIX_SEMI], {
      t1: 40,
      t2: 30,
      t3: 20,
      t4: 10
    })
  },
  {
    name: '가중치 미지정(전 종목 기본 1 → 균등)',
    payload: buildMatrixPayload([MATRIX_SCHD, MATRIX_JEPI, MATRIX_VIG])
  },
  {
    name: '가중치 합 0 → 균등 분배',
    payload: buildMatrixPayload([MATRIX_SCHD, MATRIX_JEPI], { t1: 0, t2: 0 })
  },
  {
    name: '가중치 음수 → 0으로 클램프',
    payload: buildMatrixPayload([MATRIX_SCHD, MATRIX_JEPI], { t1: -50, t2: 25 })
  },
  {
    name: '재투자 OFF',
    payload: buildMatrixPayload([MATRIX_SCHD, MATRIX_JEPI], { t1: 60, t2: 40 }, { reinvestDividends: false })
  },
  {
    name: '재투자 부분(40%) · nextMonth',
    payload: buildMatrixPayload(
      [MATRIX_SCHD, MATRIX_JEPI],
      { t1: 60, t2: 40 },
      { reinvestDividendPercent: 40, reinvestTiming: 'nextMonth' }
    )
  },
  {
    name: 'DPS 성장 monthlySmooth',
    payload: buildMatrixPayload([MATRIX_SCHD], { t1: 100 }, { dpsGrowthMode: 'monthlySmooth' })
  },
  {
    name: '목표 0 (미설정)',
    payload: buildMatrixPayload([MATRIX_SCHD, MATRIX_JEPI], { t1: 50, t2: 50 }, { targetMonthlyDividend: 0 })
  },
  {
    name: '목표 미달성(초대형 목표 · 5년)',
    payload: buildMatrixPayload(
      [MATRIX_SCHD],
      { t1: 100 },
      { targetMonthlyDividend: 999_999_999, durationYears: 5 }
    )
  },
  {
    name: '기간 1년',
    payload: buildMatrixPayload([MATRIX_SCHD, MATRIX_JEPI], { t1: 50, t2: 50 }, { durationYears: 1 })
  },
  {
    name: '기간 40년(장기)',
    payload: buildMatrixPayload([MATRIX_SCHD, MATRIX_JEPI], { t1: 50, t2: 50 }, { durationYears: 40 })
  },
  {
    name: '세율 0%',
    payload: buildMatrixPayload([MATRIX_SCHD, MATRIX_JEPI], { t1: 50, t2: 50 }, { taxRate: 0 })
  },
  {
    name: '세율 미입력(undefined)',
    payload: buildMatrixPayload([MATRIX_SCHD], { t1: 100 }, { taxRate: undefined })
  },
  {
    name: '세율 상한 100%',
    payload: buildMatrixPayload([MATRIX_SCHD, MATRIX_JEPI], { t1: 50, t2: 50 }, { taxRate: 100 })
  },
  {
    name: '초기 투자금 0 · 월 적립만',
    payload: buildMatrixPayload([MATRIX_SCHD], { t1: 100 }, { initialInvestment: 0 })
  },
  {
    name: '월 적립 0 · 초기금만',
    payload: buildMatrixPayload([MATRIX_SCHD], { t1: 100 }, { monthlyContribution: 0 })
  },
  {
    name: '투입금 전부 0',
    payload: buildMatrixPayload([MATRIX_SCHD], { t1: 100 }, { initialInvestment: 0, monthlyContribution: 0 })
  },
  {
    name: '7월 시작(비-1월) · 주기 혼합',
    payload: buildMatrixPayload(
      [MATRIX_SCHD, MATRIX_VIG, MATRIX_SEMI],
      { t1: 50, t3: 30, t4: 20 },
      { investmentStartDate: '2024-07-01', durationYears: 10 }
    )
  },
  {
    name: '일부만 포함(includedTickerIds 부분집합)',
    payload: (() => {
      const built = buildMatrixPayload([MATRIX_SCHD, MATRIX_JEPI, MATRIX_VIG], { t1: 50, t2: 30, t3: 20 });
      return { ...built, portfolio: { ...built.portfolio, includedTickerIds: ['t2', 't3'] } };
    })()
  },
  {
    name: '배당 0% 종목 포함',
    payload: buildMatrixPayload([profile('t5', 'ZERO', 0, 8, 'quarterly'), MATRIX_JEPI], { t5: 50, t2: 50 })
  },
  {
    name: '배당 성장 음수(감액)',
    payload: buildMatrixPayload([profile('t6', 'CUT', 6, -3, 'quarterly')], { t6: 100 })
  }
];
