import { z } from 'zod';
import type { SimulationOutput, SimulationResult, YieldFormValues } from '@/shared/types';
import { defaultYieldFormValues, tickerInputSchema, validateFormValues } from './SnowballForm';
import { runSimulation } from './SnowballSimulation';

/**
 * 시나리오 payload(`{ portfolio, investmentSettings }`) → 시뮬레이션 실행 — **순수 함수**.
 *
 * 커뮤니티 요약(`buildScenarioSimSummary`)과 PDF 리포트(`buildSnowballReport`)가 **같은 입력 해석·
 * 같은 배분·같은 합산**을 쓰도록 여기 한 곳에 모아 둔 공통 단계다. 수식은 하나도 새로 만들지 않았고,
 * 앱 화면(`buildSimulationBundle`)과 동일한 경로를 그대로 따른다:
 * 티커별 `runSimulation` → 연간 행 단순 합산.
 *
 * 이 모듈이 생기기 전에는 이 해석 로직이 `SnowballScenarioSummary.ts` 안에만 있었다.
 * 새 소비처가 복붙하면 두 표면이 조용히 어긋나므로 반드시 이 함수를 통해서만 payload를 실행한다.
 */

/** 티커 프로필 = 엔진 입력 계약(tickerInputSchema) + 포함/가중치 매칭용 id. */
const scenarioTickerProfileSchema = tickerInputSchema.extend({ id: z.string() });

export type ScenarioTickerProfile = z.infer<typeof scenarioTickerProfileSchema>;

/** 프로필 배열에서 id만 먼저 뽑기 위한 최소 스키마 (포함 여부 판정 전에 전체 검증을 강요하지 않는다). */
const tickerIdSchema = z.object({ id: z.string() });

/**
 * `reinvestTiming`/`dpsGrowthMode`는 여기서 enum 검증하지 않고 문자열로만 받는다.
 * 진짜 검증은 `validateFormValues`(엔진의 폼 스키마)가 한다 — enum 목록을 이 모듈에
 * 중복해 두면 새 모드가 추가될 때 조용히 어긋난다.
 */
const scenarioSettingsSchema = z.object({
  initialInvestment: z.number(),
  monthlyContribution: z.number(),
  targetMonthlyDividend: z.number(),
  investmentStartDate: z.string(),
  durationYears: z.number(),
  reinvestDividends: z.boolean(),
  reinvestDividendPercent: z.number(),
  taxRate: z.number().optional(),
  reinvestTiming: z.string(),
  dpsGrowthMode: z.string()
});

/**
 * payload 중 계산에 필요한 부분만 구조 검증한다.
 * `tickerProfiles`는 일부러 `unknown[]`로 받는다 — **포함되지 않은** 티커가 손상돼 있어도
 * 계산에는 지장이 없으므로, 엄격 검증은 포함된 티커에만 건다.
 */
const scenarioPayloadSchema = z.object({
  portfolio: z.object({
    tickerProfiles: z.array(z.unknown()),
    includedTickerIds: z.array(z.string()),
    weightByTickerId: z.record(z.string(), z.number())
  }),
  investmentSettings: scenarioSettingsSchema
});

/**
 * 가중치 정규화 — `pages/Main/utils/portfolio.ts`의 `buildNormalizedAllocation`과 **같은 규칙**이다
 * (음수 → 0 클램프, 합 0이면 균등 분배). shared/lib은 pages를 import할 수 없어 규칙만 옮겼고,
 * 두 구현의 일치는 test/snowball/scenarioSummary.test.ts가 앱 경로와의 숫자 대조로 고정한다.
 */
const normalizeWeights = (profiles: ScenarioTickerProfile[], weightByTickerId: Record<string, number>): number[] => {
  const rawWeights = profiles.map((profile) => Math.max(0, weightByTickerId[profile.id] ?? 1));
  const rawWeightSum = rawWeights.reduce((sum, value) => sum + value, 0);

  return rawWeightSum === 0
    ? profiles.map(() => 1 / profiles.length)
    : rawWeights.map((weight) => weight / rawWeightSum);
};

const sumBy = <T>(items: T[], getValue: (item: T) => number): number =>
  items.reduce((sum, item) => sum + getValue(item), 0);

/**
 * 종목별 연간 행을 포트폴리오 한 줄로 합산한다 — `aggregatePortfolioSimulation`(pages/Main/utils/simulation.ts)의
 * yearly 합산과 같은 순서·같은 수식(단순 합 + `annualDividend / 12`)이라 부동소수까지 동일하다.
 * 단일 종목이면 합산이 항등이 되어 `runSimulation` 결과 그대로다.
 */
const aggregateYearly = (outputs: SimulationOutput[]): SimulationResult[] =>
  outputs[0].yearly.map((baseRow, index) => {
    const merged = outputs.map((output) => output.yearly[index]);
    const annualDividend = sumBy(merged, (row) => row.annualDividend);

    return {
      year: baseRow.year,
      totalContribution: sumBy(merged, (row) => row.totalContribution),
      assetValue: sumBy(merged, (row) => row.assetValue),
      annualDividend,
      cumulativeDividend: sumBy(merged, (row) => row.cumulativeDividend),
      monthlyDividend: annualDividend / 12
    };
  });

export type ScenarioRun = {
  /** 계산에 실제로 참여한(=포함된) 티커 프로필. payload 순서를 보존한다. */
  profiles: ScenarioTickerProfile[];
  /** `profiles`와 같은 순서의 정규화 비중(0..1, 합 1). */
  weights: number[];
  /** 폼 기본값 위에 payload 설정을 덮어쓴, 검증을 통과한 폼 값. */
  values: YieldFormValues;
  /** `profiles`와 같은 순서의 티커별 시뮬레이션 결과. */
  outputs: SimulationOutput[];
  /** 티커별 연간 행을 합산한 포트폴리오 연간 행. */
  yearly: SimulationResult[];
};

/**
 * 시나리오 payload를 실행한다. 미완성/계산 불가 payload는 **null** (절대 던지지 않는다).
 *
 * null이 되는 경우: payload 구조가 다름 / 포함된 티커 0개 / 포함된 티커가 엔진 입력 계약 위반 /
 * 투자 설정이 폼 검증 실패(무효 날짜·비유한 숫자·범위 밖).
 *
 * 입력을 `unknown`으로 받는 이유: 서버 jsonb는 신뢰할 수 없고, 클라이언트의
 * `PostPayload`/`PersistedScenarioState`는 구조적으로 모두 이 파서를 통과한다(여분 필드는 무시된다).
 */
export const runScenarioPayload = (payload: unknown): ScenarioRun | null => {
  const parsed = scenarioPayloadSchema.safeParse(payload);
  if (!parsed.success) return null;

  const { portfolio, investmentSettings } = parsed.data;

  // 포함된 프로필만 고른다 — getIncludedProfiles(pages/Main/utils/portfolio.ts)와 같은 규칙(원래 순서 보존).
  const includedIds = new Set(portfolio.includedTickerIds);
  const includedRaw = portfolio.tickerProfiles.filter((profile) => {
    const withId = tickerIdSchema.safeParse(profile);
    return withId.success && includedIds.has(withId.data.id);
  });
  if (includedRaw.length === 0) return null;

  // 계산에 참여하는 티커는 엔진 입력 계약(tickerInputSchema)을 전부 통과해야 한다. 하나라도 어기면
  // 반쪽짜리 숫자를 만들지 않고 전체를 포기한다.
  const profiles: ScenarioTickerProfile[] = [];
  for (const raw of includedRaw) {
    const profile = scenarioTickerProfileSchema.safeParse(raw);
    if (!profile.success) return null;
    profiles.push(profile.data);
  }

  // 영속 설정 → 폼 값. buildOgCardModel(pages/Main/utils/ogCard.ts)과 같은 덮어쓰기 — 티커 필드는
  // 기본값이 남지만 엔진은 profiles 쪽 값을 쓰므로 영향이 없다. 두 enum 캐스트는 바로 아래
  // validateFormValues의 zod enum 검사가 런타임에서 되돌린다(무효 문자열이면 invalid → null).
  const values: YieldFormValues = {
    ...defaultYieldFormValues,
    initialInvestment: investmentSettings.initialInvestment,
    monthlyContribution: investmentSettings.monthlyContribution,
    targetMonthlyDividend: investmentSettings.targetMonthlyDividend,
    investmentStartDate: investmentSettings.investmentStartDate,
    durationYears: investmentSettings.durationYears,
    reinvestDividends: investmentSettings.reinvestDividends,
    reinvestDividendPercent: investmentSettings.reinvestDividendPercent,
    taxRate: investmentSettings.taxRate,
    reinvestTiming: investmentSettings.reinvestTiming as YieldFormValues['reinvestTiming'],
    dpsGrowthMode: investmentSettings.dpsGrowthMode as YieldFormValues['dpsGrowthMode']
  };
  if (!validateFormValues(values).isValid) return null;

  // 티커별 시뮬레이션 — buildSimulationBundle과 같은 배분(초기/월 적립금을 정규화 가중치로 분할).
  const weights = normalizeWeights(profiles, portfolio.weightByTickerId);
  const outputs = profiles.map((profile, index) =>
    runSimulation({
      ticker: {
        ticker: profile.ticker,
        initialPrice: profile.initialPrice,
        dividendYield: profile.dividendYield,
        dividendGrowth: profile.dividendGrowth,
        expectedTotalReturn: profile.expectedTotalReturn,
        frequency: profile.frequency
      },
      settings: {
        initialInvestment: values.initialInvestment * weights[index],
        monthlyContribution: values.monthlyContribution * weights[index],
        targetMonthlyDividend: values.targetMonthlyDividend,
        investmentStartDate: values.investmentStartDate,
        durationYears: values.durationYears,
        reinvestDividends: values.reinvestDividends,
        reinvestDividendPercent: values.reinvestDividendPercent,
        taxRate: values.taxRate,
        reinvestTiming: values.reinvestTiming,
        dpsGrowthMode: values.dpsGrowthMode
      }
    })
  );

  return { profiles, weights, values, outputs, yearly: aggregateYearly(outputs) };
};
