import { defaultYieldFormValues, validateFormValues } from '@/shared/lib/snowball';
import type { YieldFormValues } from '@/shared/types';
import type { PersistedInvestmentSettings, PersistedScenarioState } from '@/jotai';
import { buildNormalizedAllocation, getIncludedProfiles, type NormalizedAllocationItem } from './portfolio';
import { buildSimulationBundle } from './simulation';

/**
 * 동적 OG 이미지(`/api/og`)가 그릴 값들.
 *
 * 이 모듈은 **순수 함수만** 담는다. 렌더러(api/og.tsx)는 여기서 나온 숫자를 그리기만 하고,
 * 계산은 앱과 **완전히 같은 경로**(decodeSharedScenario → buildSimulationBundle)로 한다.
 * 숫자를 따로 다시 구현하면 카드와 앱 화면이 어긋나기 때문에, 새로 만든 건 "요약/축약" 로직뿐이다.
 */

export type OgCardHolding = {
  ticker: string;
  /** 정수 퍼센트(반올림). 카드는 한 줄짜리 요약이라 소수점을 쓰지 않는다. */
  percent: number;
};

export type OgCardModel = {
  /** 비중 큰 순서로 최대 OG_CARD_MAX_HOLDINGS 개. */
  holdings: OgCardHolding[];
  /** holdings 에 못 들어간 나머지 종목 수 ("외 M개"). */
  hiddenHoldingCount: number;
  durationYears: number;
  initialInvestment: number;
  monthlyContribution: number;
  /**
   * 목표 월 배당(사용자 입력). **0 이하 = 목표 미설정**.
   * ⚠ `targetReachedYear` 만으로는 목표 유무를 못 가린다 — `findTargetYear(rows, 0)` 은 monthlyDividend>=0 인
   *   첫 행을 즉시 "달성"으로 잡아, 목표 미설정 카드에도 `targetReachedYear` 가 (오해를 부르는) 값으로 채워진다
   *   (커뮤니티 SimSummaryStats 함정과 동일). 그래서 문구 분기는 반드시 이 값(>0)으로 가드한다.
   */
  targetMonthlyDividend: number;
  /** 마지막 해의 월평균 배당(세후) — 앱의 `finalMonthlyAverageDividend` 와 같은 값. */
  finalMonthlyDividend: number;
  /** 마지막 해의 자산 평가액 — 앱의 `finalAssetValue` 와 같은 값. */
  finalAssetValue: number;
  /** 목표 월 배당 도달 연차. 미도달이면 null. (목표 미설정 시엔 무의미 — targetMonthlyDividend 로 먼저 가드) */
  targetReachedYear: number | null;
};

/** 1200px 카드 한 줄에 안정적으로 들어가는 최대 종목 수. 넘으면 "외 M개"로 접는다. */
export const OG_CARD_MAX_HOLDINGS = 4;

/**
 * 비중 순으로 상위 N개를 고르고 나머지는 개수만 남긴다.
 * 동률이면 원래(포트폴리오) 순서를 유지한다 — 카드가 렌더링마다 바뀌면 안 되므로 정렬은 안정적이어야 한다.
 */
export const toOgCardHoldings = (
  normalizedAllocation: NormalizedAllocationItem[],
  maxItems: number = OG_CARD_MAX_HOLDINGS
): Pick<OgCardModel, 'holdings' | 'hiddenHoldingCount'> => {
  const limit = Math.max(0, Math.floor(maxItems));
  const ranked = normalizedAllocation
    .map((item, index) => ({ item, index }))
    .sort((left, right) => right.item.weight - left.item.weight || left.index - right.index)
    .map(({ item }) => item);

  const holdings = ranked.slice(0, limit).map((item) => ({
    ticker: item.profile.ticker,
    percent: Math.round(item.weight * 100)
  }));

  return {
    holdings,
    hiddenHoldingCount: Math.max(0, ranked.length - holdings.length)
  };
};

/** `SCHD 30% · VIG 20% · PG 15% 외 2개` */
export const formatOgHoldingsLine = (holdings: OgCardHolding[], hiddenHoldingCount: number): string => {
  const head = holdings.map((holding) => `${holding.ticker} ${holding.percent}%`).join(' · ');
  if (hiddenHoldingCount <= 0) return head;
  if (!head) return `${hiddenHoldingCount}개 종목`;
  return `${head} 외 ${hiddenHoldingCount}개`;
};

/**
 * 카드용 금액 축약. 앱의 `formatApproxKRW` 와 같은 구간/반올림 규칙을 쓰되 "약 " 접두사만 뺐다
 * (카드에는 "예상"이라는 라벨이 따로 있어서 중복이다).
 */
export const formatOgAmount = (value: number): string => {
  const sign = value < 0 ? '-' : '';
  const absValue = Math.abs(value);

  if (absValue >= 100_000_000) {
    const inEok = Math.round((absValue / 100_000_000) * 10) / 10;
    return `${sign}${Number.isInteger(inEok) ? inEok.toFixed(0) : inEok.toFixed(1)}억`;
  }

  if (absValue >= 10_000) {
    return `${sign}${Math.round(absValue / 10_000).toLocaleString('ko-KR')}만`;
  }

  return `${sign}${Math.round(absValue).toLocaleString('ko-KR')}원`;
};

/** 영속 설정 → 시뮬레이션 폼 값. 앱의 `applyScenario` 와 같은 필드만 덮어쓴다(티커 필드는 엔진이 쓰지 않는다). */
const toYieldFormValues = (investmentSettings: PersistedInvestmentSettings): YieldFormValues => ({
  ...defaultYieldFormValues,
  initialInvestment: investmentSettings.initialInvestment,
  monthlyContribution: investmentSettings.monthlyContribution,
  targetMonthlyDividend: investmentSettings.targetMonthlyDividend,
  investmentStartDate: investmentSettings.investmentStartDate,
  durationYears: investmentSettings.durationYears,
  reinvestDividends: investmentSettings.reinvestDividends,
  reinvestDividendPercent: investmentSettings.reinvestDividendPercent,
  taxRate: investmentSettings.taxRate,
  reinvestTiming: investmentSettings.reinvestTiming,
  dpsGrowthMode: investmentSettings.dpsGrowthMode
});

/** 시나리오 → 카드 모델. 시뮬레이션이 성립하지 않으면 null (호출자는 기본 카드로 폴백한다). */
export const buildOgCardModel = (scenario: PersistedScenarioState): OgCardModel | null => {
  const includedProfiles = getIncludedProfiles(scenario.portfolio.tickerProfiles, scenario.portfolio.includedTickerIds);
  if (includedProfiles.length === 0) return null;

  const values = toYieldFormValues(scenario.investmentSettings);
  if (!validateFormValues(values).isValid) return null;

  const normalizedAllocation = buildNormalizedAllocation(includedProfiles, scenario.portfolio.weightByTickerId);
  const { simulation } = buildSimulationBundle({
    isValid: true,
    includedProfiles,
    normalizedAllocation,
    values
  });
  if (!simulation) return null;

  return {
    ...toOgCardHoldings(normalizedAllocation),
    durationYears: values.durationYears,
    initialInvestment: values.initialInvestment,
    monthlyContribution: values.monthlyContribution,
    targetMonthlyDividend: values.targetMonthlyDividend,
    finalMonthlyDividend: simulation.summary.finalMonthlyAverageDividend,
    finalAssetValue: simulation.summary.finalAssetValue,
    targetReachedYear: simulation.summary.targetMonthDividendReachedYear ?? null
  };
};

/** 카드에 "목표 달성/미도달" 문구를 붙일지. 목표 미설정(<=0)이면 붙이지 않는다(위 targetMonthlyDividend 주석). */
export const hasDividendTarget = (model: OgCardModel): boolean => model.targetMonthlyDividend > 0;

/** OG/트위터 메타 텍스트(제목·설명·이미지 alt). */
export type OgShareText = {
  title: string;
  description: string;
  imageAlt: string;
};

/**
 * 카드 모델 → OG 메타 텍스트. api/share-html 이 이 텍스트를 `og:title`/`og:description`/`*:image:alt` 에 넣고,
 * api/og 는 같은 모델·포맷터로 이미지를 그린다 → **텍스트와 카드 이미지가 어긋나지 않는다**.
 *
 * og:title 3분기(목표 달성 / 목표 미도달 / 목표 없음)는 반드시 `hasDividendTarget` 로 가드한다
 * (목표 0 인데 "목표 달성" 이 붙는 오해 방지 — targetMonthlyDividend 주석 참고).
 */
export const buildOgShareText = (model: OgCardModel): OgShareText => {
  const monthly = formatOgAmount(model.finalMonthlyDividend);
  const holdingsLine = formatOgHoldingsLine(model.holdings, model.hiddenHoldingCount);

  let title: string;
  if (!hasDividendTarget(model)) {
    title = `${model.durationYears}년 후 월 배당 ${monthly} 시뮬레이션 — Snowball Income`;
  } else if (model.targetReachedYear !== null) {
    title = `${model.durationYears}년 후 월 배당 ${monthly} · ${model.targetReachedYear}년 목표 달성 — Snowball Income`;
  } else {
    title = `${model.durationYears}년 후 월 배당 ${monthly} · 목표 미도달 — Snowball Income`;
  }

  const description =
    `${holdingsLine} 포트폴리오, ${model.durationYears}년 후 예상 최종 자산 ${formatOgAmount(model.finalAssetValue)}. ` +
    '입력한 가정을 그대로 계산한 시뮬레이션이며 투자 자문이 아닙니다.';

  const imageAlt = `${holdingsLine} · ${model.durationYears}년 후 월 배당 ${monthly} — Snowball Income 시뮬레이션 카드`;

  return { title, description, imageAlt };
};

/** `decodeSharedScenario` 의 시그니처. 아래 주석 참고 — 여기서 직접 import 하지 않고 주입받는다. */
export type ShareScenarioDecoder = (shareCode: string) => PersistedScenarioState | null;

/**
 * 공유 코드 → 카드 모델. 잘못된 코드/디코드 실패/계산 불가 → **null** (예외를 던지지 않는다).
 * 크롤러가 미리보기를 포기하지 않도록 `/api/og` 는 절대 5xx 를 내면 안 되고, 그 계약이 여기서 시작된다.
 *
 * 디코더를 **주입받는 이유**: `decodeSharedScenario` 를 이 파일에서 import 하면 배럴
 * (`@/pages/Main/hooks/persistence`)을 통해 `usePortfolioPersistence` → `@/shared/lib/analytics` 가 딸려온다.
 * analytics 는 **모듈 스코프**에서 `import.meta.env.VITE_GA_MEASUREMENT_ID` 를 읽는데, Vite 밖(Vercel Node
 * 런타임)에서는 `import.meta.env` 가 undefined 라 **import 되는 순간 TypeError 로 함수가 죽는다**
 * (핸들러의 try/catch 로도 못 막는다 — 모듈 평가 단계라서).
 * 주입으로 바꾸면 이 모듈은 서버에서 안전하고, 테스트는 진짜 디코더를 넣어 그대로 검증한다.
 */
export const summarizeShareCodeForOg = (
  shareCode: string | null | undefined,
  decode: ShareScenarioDecoder
): OgCardModel | null => {
  if (!shareCode) return null;

  try {
    const scenario = decode(shareCode);
    if (!scenario) return null;
    return buildOgCardModel(scenario);
  } catch {
    return null;
  }
};

/**
 * DB 공유 스냅샷(트랙 E) 경로: `get_shared_snapshot` 이 돌려준 envelope.scenario → 카드 모델.
 * lz-string `?share=` 는 디코더 주입이 필요하지만, DB payload 는 이미 `PersistedScenarioState` 라
 * 디코드 없이 `buildOgCardModel` 을 바로 태운다. scenario 는 다른 클라이언트가 쓴 신뢰불가 값이라
 * 계산 불가/깨진 payload 는 **예외 대신 null**(api/og·api/share-html 이 절대 5xx 를 내지 않도록).
 */
export const summarizeSharedScenarioForOg = (
  scenario: PersistedScenarioState | null | undefined
): OgCardModel | null => {
  if (!scenario) return null;
  try {
    return buildOgCardModel(scenario);
  } catch {
    return null;
  }
};
