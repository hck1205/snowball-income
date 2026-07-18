import { EMPTY_INVESTMENT_SETTINGS, type PersistedInvestmentSettings, type PersistedScenarioState } from '@/jotai';
import {
  buildOgCardModel,
  buildOgShareText,
  hasDividendTarget,
  summarizeSharedScenarioForOg,
  type OgCardModel
} from '@/pages/Main/utils';
import type { TickerProfile } from '@/shared/types/snowball';

/**
 * OG 공유 텍스트(og:title/description/image:alt)와 DB 스냅샷 경로 요약 (트랙 F).
 * 카드 이미지(api/og)와 미리보기 텍스트(api/share-html)가 같은 모델·포맷터를 쓰는지, 그리고
 * "목표 미설정" 가드(findTargetYear(rows,0) 오해 방지)가 3분기 전부에서 지켜지는지 못박는다.
 */

const baseModel = (overrides: Partial<OgCardModel> = {}): OgCardModel => ({
  holdings: [
    { ticker: 'SCHD', percent: 60 },
    { ticker: 'JEPI', percent: 40 }
  ],
  hiddenHoldingCount: 0,
  durationYears: 20,
  initialInvestment: 10_000_000,
  monthlyContribution: 1_000_000,
  targetMonthlyDividend: 2_000_000,
  finalMonthlyDividend: 3_500_000,
  finalAssetValue: 1_240_000_000,
  targetReachedYear: 2038,
  ...overrides
});

describe('hasDividendTarget', () => {
  it('목표 월배당 > 0 이면 true', () => {
    expect(hasDividendTarget(baseModel({ targetMonthlyDividend: 1 }))).toBe(true);
  });

  it('목표 월배당 0/음수면 false (미설정)', () => {
    expect(hasDividendTarget(baseModel({ targetMonthlyDividend: 0 }))).toBe(false);
    expect(hasDividendTarget(baseModel({ targetMonthlyDividend: -1 }))).toBe(false);
  });
});

describe('buildOgShareText — og:title 3분기', () => {
  it('목표 있음 + 도달: 도달 연도 + "목표 달성"', () => {
    const { title } = buildOgShareText(baseModel({ targetMonthlyDividend: 2_000_000, targetReachedYear: 2038 }));
    expect(title).toBe('20년 후 월 배당 350만 · 2038년 목표 달성 — Snowball Income');
  });

  it('목표 있음 + 미도달: "목표 미도달"', () => {
    const { title } = buildOgShareText(baseModel({ targetMonthlyDividend: 2_000_000, targetReachedYear: null }));
    expect(title).toBe('20년 후 월 배당 350만 · 목표 미도달 — Snowball Income');
  });

  it('목표 없음(<=0): 달성/미도달 문구를 붙이지 않는다 — findTargetYear(rows,0) 오해 가드', () => {
    // ⚠ 목표 0 이어도 targetReachedYear 는 (1년차를 잡아) 값이 채워질 수 있다. 그래도 "목표" 문구는 금지.
    const { title } = buildOgShareText(baseModel({ targetMonthlyDividend: 0, targetReachedYear: 2025 }));
    expect(title).toBe('20년 후 월 배당 350만 시뮬레이션 — Snowball Income');
    expect(title).not.toContain('목표');
  });
});

describe('buildOgShareText — description / imageAlt', () => {
  it('설명은 포트폴리오·기간·최종 자산 + 면책 문구를 담는다(핵심이 앞)', () => {
    const { description } = buildOgShareText(baseModel());
    expect(description).toBe(
      'SCHD 60% · JEPI 40% 포트폴리오, 20년 후 예상 최종 자산 12.4억. ' +
        '입력한 가정을 그대로 계산한 시뮬레이션이며 투자 자문이 아닙니다.'
    );
  });

  it('image:alt 는 종목·기간·월 배당을 요약한다', () => {
    const { imageAlt } = buildOgShareText(baseModel());
    expect(imageAlt).toBe('SCHD 60% · JEPI 40% · 20년 후 월 배당 350만 — Snowball Income 시뮬레이션 카드');
  });

  it('접힌 종목은 "외 N개"로, 금액은 카드 포맷터와 동일 축약을 쓴다', () => {
    const { description, imageAlt } = buildOgShareText(
      baseModel({
        holdings: [{ ticker: 'SCHD', percent: 100 }],
        hiddenHoldingCount: 3,
        finalAssetValue: 32_000_000,
        finalMonthlyDividend: 10_000
      })
    );
    expect(description).toContain('SCHD 100% 외 3개 포트폴리오');
    expect(description).toContain('예상 최종 자산 3,200만');
    expect(imageAlt).toContain('월 배당 1만');
  });
});

/** 실 엔진으로 만든 시나리오(신뢰 경로) — 모델의 targetMonthlyDividend 필드와 DB 경로 요약. */
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

const buildScenario = (settings: Partial<PersistedInvestmentSettings> = {}): PersistedScenarioState => ({
  id: 'shared-tab',
  name: '공유 탭',
  portfolio: {
    tickerProfiles: [profile('t1', 'SCHD', 3.5, 5)],
    includedTickerIds: ['t1'],
    weightByTickerId: { t1: 100 },
    fixedByTickerId: {},
    selectedTickerId: null
  },
  investmentSettings: {
    ...EMPTY_INVESTMENT_SETTINGS,
    initialInvestment: 10_000_000,
    monthlyContribution: 1_000_000,
    targetMonthlyDividend: 2_000_000,
    investmentStartDate: '2024-01-01',
    durationYears: 20,
    reinvestDividends: true,
    reinvestDividendPercent: 100,
    taxRate: 15.4,
    ...settings
  }
});

describe('buildOgCardModel — targetMonthlyDividend 필드', () => {
  it('입력한 목표 월배당을 모델에 그대로 싣는다(가드가 읽는 값)', () => {
    expect(buildOgCardModel(buildScenario({ targetMonthlyDividend: 3_000_000 }))?.targetMonthlyDividend).toBe(3_000_000);
  });

  it('목표 0 도 그대로 0으로 싣는다(미설정 판별용)', () => {
    expect(buildOgCardModel(buildScenario({ targetMonthlyDividend: 0 }))?.targetMonthlyDividend).toBe(0);
  });
});

describe('summarizeSharedScenarioForOg', () => {
  it('정상 시나리오면 카드 모델을 만든다(디코드 불필요 — PersistedScenarioState 직접)', () => {
    const model = summarizeSharedScenarioForOg(buildScenario());
    expect(model).not.toBeNull();
    expect(model?.holdings).toEqual([{ ticker: 'SCHD', percent: 100 }]);
    expect(model?.finalMonthlyDividend).toBeGreaterThan(0);
  });

  it('null/undefined 는 예외 없이 null (api/og·share-html 은 5xx 금지)', () => {
    expect(summarizeSharedScenarioForOg(null)).toBeNull();
    expect(summarizeSharedScenarioForOg(undefined)).toBeNull();
  });

  it('깨진 payload(포트폴리오 없음)도 예외 대신 null', () => {
    const broken = { id: 'x', name: 'x' } as unknown as PersistedScenarioState;
    expect(summarizeSharedScenarioForOg(broken)).toBeNull();
  });
});
