import { z } from 'zod';
import { runScenarioPayload } from './SnowballScenarioRun';
import { findTargetYear } from './SnowballSummary';

/**
 * 커뮤니티 게시용 시뮬 요약(`scenarios.sim_summary` jsonb) — **순수 함수**.
 *
 * 게시 시점에 시나리오 payload(`{ portfolio, investmentSettings }` — 공유/영속 스키마와 같은 계열)로부터
 * 카드/리스트/첨부 미리보기가 쓸 핵심 숫자를 1회 계산한다. 게시 후에는 재계산하지 않는다
 * (엔진 로직이 바뀌어도 저장값 보존 — 카드와 상세가 다른 숫자를 보이면 신뢰가 죽는다).
 *
 * 계산은 앱과 **완전히 같은 경로**를 쓴다: `runScenarioPayload`(payload 해석 + 티커별 `runSimulation` +
 * 연간 합산) → `findTargetYear`. 이 파일에 남은 것은 "요약 필드 추출"뿐이며, 수식은 하나도 재구현하지 않았다.
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

/**
 * 게시 payload → 시뮬 요약. 미완성/계산 불가 payload는 **null** (절대 던지지 않는다).
 *
 * null이 되는 경우: `runScenarioPayload`가 null(구조/티커/설정 검증 실패) 또는
 * 계산 결과가 비유한(극단 입력 방어).
 */
export const buildScenarioSimSummary = (payload: unknown): ScenarioSimSummary | null => {
  const run = runScenarioPayload(payload);
  if (!run) return null;

  const { profiles, values, yearly } = run;
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
