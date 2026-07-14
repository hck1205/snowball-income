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
  /** 마지막 해의 월평균 배당(세후) — 앱의 `finalMonthlyAverageDividend` 와 같은 값. */
  finalMonthlyDividend: number;
  /** 마지막 해의 자산 평가액 — 앱의 `finalAssetValue` 와 같은 값. */
  finalAssetValue: number;
  /** 목표 월 배당 도달 연차. 미도달이면 null. */
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
    finalMonthlyDividend: simulation.summary.finalMonthlyAverageDividend,
    finalAssetValue: simulation.summary.finalAssetValue,
    targetReachedYear: simulation.summary.targetMonthDividendReachedYear ?? null
  };
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
