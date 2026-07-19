import { z } from 'zod';
import type { SimulationOutput, SimulationResult, YieldFormValues } from '@/shared/types';
import { defaultYieldFormValues, tickerInputSchema, validateFormValues } from './SnowballForm';
import { runSimulation } from './SnowballSimulation';
import { findTargetYear } from './SnowballSummary';

/**
 * 커뮤니티 게시용 시뮬 요약(`scenarios.sim_summary` jsonb) — **순수 함수**.
 *
 * 게시 시점에 시나리오 payload(`{ portfolio, investmentSettings }` — 공유/영속 스키마와 같은 계열)로부터
 * 카드/리스트/첨부 미리보기가 쓸 핵심 숫자를 1회 계산한다. 게시 후에는 재계산하지 않는다
 * (엔진 로직이 바뀌어도 저장값 보존 — 카드와 상세가 다른 숫자를 보이면 신뢰가 죽는다).
 *
 * 계산은 앱과 **완전히 같은 경로**를 쓴다: 티커별 `runSimulation` → 합산 → `findTargetYear`.
 * 여기서 새로 만든 것은 "payload 해석 + 합산 + 요약 추출"뿐이며, 수식은 하나도 재구현하지 않았다.
 *
 * 필드 계약: 디자이너 스펙 §H (write-page-spec v1.1). 전 필드 필수, 금액은 **KRW 정수**(반올림).
 * 배수(투입 대비) 같은 파생값은 **저장하지 않는다** — 표시 시점에 UI가 계산한다.
 */

export const SCENARIO_SIM_SUMMARY_VERSION = 1;

/**
 * `sim_summary` jsonb의 스키마 (DB 왕복 검증 겸용).
 *
 * 금액 필드에 `.int()`를 거는 이유: §H가 "KRW 정수"를 계약으로 못박았고,
 * `Number.isInteger`는 NaN/Infinity 도 함께 걸러 주므로 별도 `.finite()`가 필요 없다.
 */
export const scenarioSimSummarySchema = z.object({
  /** 스키마 버전. 이후 필드 추가/의미 변경 대비 — 모르는 버전은 파싱 단계에서 거른다. */
  version: z.literal(SCENARIO_SIM_SUMMARY_VERSION),
  /** 시뮬 기간(년). */
  durationYears: z.number().int().min(1),
  /** 시뮬레이션에 포함된 티커 수. */
  tickerCount: z.number().int().min(1),
  /** 초기 투자금 (KRW). */
  initialInvestment: z.number().int().min(0),
  /** 월 적립금 (KRW). */
  monthlyContribution: z.number().int().min(0),
  /** 투입 원금 누계 = 초기 + 월 적립 × 개월 수 (KRW). 재투자된 배당은 포함하지 않는다. */
  totalContribution: z.number().int().min(0),
  /** 기간 종료 시점 자산 평가액 (KRW) — 앱의 `summary.finalAssetValue`와 동일 정의. */
  finalAssetValue: z.number().int().min(0),
  /** 마지막 해의 세후 월평균 배당(연/12, KRW) — 앱의 `summary.finalMonthlyAverageDividend`와 동일 정의. */
  finalMonthlyDividend: z.number().int().min(0),
  /** 목표 월배당 (KRW). */
  targetMonthlyDividend: z.number().int().min(0),
  /** 목표 월배당을 처음 달성한 n년차(1-based). 기간 내 미달성이면 null. */
  targetReachedInYears: z.number().int().min(1).nullable()
});

export type ScenarioSimSummary = z.infer<typeof scenarioSimSummarySchema>;

/**
 * DB에서 읽은 jsonb(unknown) → 검증된 요약. 형태가 다르거나 모르는 버전이면 null.
 * UI는 null이면 프리뷰 블록을 그리지 않는다 (구버전 글 폴백 — 스펙 §E/§J).
 */
export const parseScenarioSimSummary = (value: unknown): ScenarioSimSummary | null => {
  const parsed = scenarioSimSummarySchema.safeParse(value);
  return parsed.success ? parsed.data : null;
};

/* ── payload 해석 ─────────────────────────────────────────────────────────── */

/** 티커 프로필 = 엔진 입력 계약(tickerInputSchema) + 포함/가중치 매칭용 id. */
const scenarioTickerProfileSchema = tickerInputSchema.extend({ id: z.string() });

type ScenarioTickerProfile = z.infer<typeof scenarioTickerProfileSchema>;

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
 * 게시 payload 중 계산에 필요한 부분만 구조 검증한다.
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

/* ── 앱과 동일한 배분/합산 규칙 ───────────────────────────────────────────── */

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

/* ── 본체 ────────────────────────────────────────────────────────────────── */

/**
 * 게시 payload → 시뮬 요약. 미완성/계산 불가 payload는 **null** (절대 던지지 않는다).
 *
 * null이 되는 경우: payload 구조가 다름 / 포함된 티커 0개 / 포함된 티커가 엔진 입력 계약 위반 /
 * 투자 설정이 폼 검증 실패(무효 날짜·비유한 숫자·범위 밖) / 계산 결과가 비유한(극단 입력 방어).
 *
 * 입력을 `unknown`으로 받는 이유: 서버 jsonb는 신뢰할 수 없고, 클라이언트의
 * `PostPayload`/`PersistedScenarioState`는 구조적으로 모두 이 파서를 통과한다
 * (여분 필드는 무시된다). 엔진 계층이 supabase 타입에 의존하지 않게 되는 부수 효과도 있다.
 */
export const buildScenarioSimSummary = (payload: unknown): ScenarioSimSummary | null => {
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
  // 반쪽짜리 숫자를 만들지 않고 요약 전체를 포기한다.
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

  const yearly = aggregateYearly(outputs);
  const finalYear = yearly[yearly.length - 1];
  if (!finalYear) return null;

  // findTargetYear는 연도 **라벨**(시작 연도 + 경과 연)을 준다. §H 계약은 1-based **연차**이므로
  // 첫 행 라벨(= 시작 연도)을 빼서 변환한다.
  const reachedYearLabel = findTargetYear(yearly, values.targetMonthlyDividend);
  const targetReachedInYears = reachedYearLabel === undefined ? null : reachedYearLabel - yearly[0].year + 1;

  // 최종 스키마 통과로 마무리한다: 금액 반올림 후에도 남는 비유한 값(NaN/Infinity 전파 등
  // 극단 입력의 잔재)은 여기서 걸러져 null이 된다 — 절반만 맞는 요약을 저장하지 않는다.
  return parseScenarioSimSummary({
    version: SCENARIO_SIM_SUMMARY_VERSION,
    durationYears: values.durationYears,
    tickerCount: profiles.length,
    initialInvestment: Math.round(values.initialInvestment),
    monthlyContribution: Math.round(values.monthlyContribution),
    totalContribution: Math.round(finalYear.totalContribution),
    finalAssetValue: Math.round(finalYear.assetValue),
    finalMonthlyDividend: Math.round(finalYear.monthlyDividend),
    targetMonthlyDividend: Math.round(values.targetMonthlyDividend),
    targetReachedInYears
  });
};
