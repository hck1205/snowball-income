/**
 * 큐레이션 12 종 × 목표 금액 → **화면이 그대로 그리는 모델** (2026-11-01).
 *
 * ## 🔴 숫자마다 출처를 달고 다닌다
 * `pages/Ticker/utils/tickerCompare.ts` 가 세운 규약을 그대로 쓴다 — 표는 숫자를 나란히 놓는
 * 순간 전부 같은 무게의 사실처럼 읽히는데, 이 앱의 티커 숫자는 출처가 셋으로 갈린다:
 *
 *  - **실측(observed)** — 스냅샷이 덮는 셋뿐: `initialPrice` · `dividendYield` · `frequency`.
 *  - **참고(reference)** — `observedDividendCagr`. 지급 이력에서 관측했지만 **엔진에 넣지 않는** 값이다.
 *  - **가정(assumed)** — 물가상승률. 사용자가 고른다(`shared/constants/inflation`).
 *
 * 세율은 넷째 갈래다 — **법령에서 오는 상수**라 관측도 가정도 아니다. 그래서 `basis` 를 붙이지 않고
 * 화면이 근거(상장지)를 직접 말한다.
 *
 * ## 🔴 "무엇이 더 좋은가"를 말하지 않는다
 * 정렬 키도, 추천 플래그도, `betterDirection` 도 두지 않는다. 필요 원금이 적은 것이 좋은 것이 아니고
 * (배당률이 높은 쪽은 분배금과 주가가 따로 움직인다), 배당 인상률이 높은 것도 그 자체로 좋은 것이
 * 아니다(지금 받는 돈은 적다). 화면은 네 묶음을 **고정 순서**로 놓고 사실만 적는다.
 *
 * ## 🔴 자료 없음을 0 으로 접지 않는다
 * `observedDividendCagr` 가 없는 종목(상장이 짧아 이력이 모자란 쪽)은 `dividendCagrPercent: null` 로
 * 남고 물가 비교가 `unknown` 이 된다. 0 으로 채우면 "배당이 전혀 늘지 않았다"는 **없는 사실**이 생기고,
 * 물가 비교에서 자동으로 `trails` 가 되어 그 종목에 불리한 거짓이 된다.
 */
import { MARKET_DATA, MARKET_DATA_AS_OF } from '@/shared/constants/marketData';
import { DIVIDEND_UNIVERSE, PRESET_TICKER_KOREAN_NAME_BY_TICKER } from '@/shared/constants/presets';
import { TICKER_PAGE_INDEX } from '@/shared/constants/tickerPages';
import { paymentsPerYearMap } from '@/shared/lib/snowball';
import type { Frequency } from '@/shared/types';
import {
  compareDividendGrowthToInflation,
  computeDividendRequirement,
  taxRateForTicker,
  type DividendRequirement,
  type InflationComparison
} from './dividendRequirement';
import {
  DIVIDEND_TARGET_CATEGORIES,
  type DividendTargetCategory,
  type DividendTargetCategoryId
} from './dividendTargetTickers';

/** 배당률의 출처. 스냅샷에 있으면 실측, 유니버스 큐레이션 값뿐이면 그렇다고 말한다. */
export type YieldFreshness = 'snapshot' | 'preset';

export type TickerRequirement = {
  readonly ticker: string;
  /** 한국어 이름이 있으면 그것, 없으면 큐레이션 영문명. */
  readonly name: string;
  readonly categoryId: DividendTargetCategoryId;
  /** 묶음 이름(배지). 화면이 큐레이션을 다시 뒤지지 않게 모델이 들고 다닌다. */
  readonly categoryLabel: string;
  /** 연 배당률(%) — 실측. */
  readonly dividendYieldPercent: number;
  readonly yieldFreshness: YieldFreshness;
  readonly frequency: Frequency;
  /** 세금·원금 분해. 배당률이 0 이하인 종목은 `null`(그런 종목은 큐레이션에 없지만 방어한다). */
  readonly requirement: DividendRequirement | null;
  /**
   * 한 번 지급될 때 받는 세후 금액(원). 세후 연 배당 ÷ 연 지급 횟수.
   * 무배당이거나 분해가 성립하지 않으면 `null` — 0 으로 나누지 않는다.
   * 지급 횟수는 엔진의 `paymentsPerYearMap` 이 정본이다(사본을 만들지 않는다).
   */
  readonly perPayoutAfterTax: number | null;
  /** 관측된 배당 인상률(%) — **참고치**. 자료가 없으면 `null`. */
  readonly dividendCagrPercent: number | null;
  readonly inflation: InflationComparison;
  /** `/ticker/<slug>` 소개 페이지 경로. 큐레이션 규칙상 항상 있지만 타입으로 강제하지 않는다. */
  readonly tickerPagePath: string | null;
};

export type RequirementCategory = {
  readonly category: DividendTargetCategory;
  readonly tickers: readonly TickerRequirement[];
};

export type DividendTargetModel = {
  /** 목표 월 배당(세후, 원). */
  readonly monthlyAfterTax: number;
  /** 고른 물가상승률(%) — **가정**. */
  readonly inflationRatePercent: number;
  readonly categories: readonly RequirementCategory[];
  /** 평탄한 12 종(묶음 순서 그대로). 상세 패널이 고른 티커를 여기서 찾는다. */
  readonly all: readonly TickerRequirement[];
  /** 실측값의 기준일. 없으면 `null`(있는 척하지 않는다). */
  readonly asOf: string | null;
  /**
   * 🔴 이 목표에서 **금융소득종합과세 기준을 넘는 종목이 하나라도 있는가.**
   * 세전 연 배당은 세율이 같으면 종목과 무관하게 같으므로 실제로는 "이 목표가 넘는가"다 —
   * 그래도 종목에서 끌어올리는 이유는 국내 상장 종목(15.4%)이 섞이면 경계가 미세하게 달라지기 때문이다.
   */
  readonly exceedsFinancialIncomeThreshold: boolean;
};

const SLUG_BY_SYMBOL = new Map<string, string>(TICKER_PAGE_INDEX.map((entry) => [entry.symbol, entry.slug]));

const KOREAN_NAME_BY_TICKER: Record<string, string | undefined> = PRESET_TICKER_KOREAN_NAME_BY_TICKER;

type UniverseEntry = { readonly name: string; readonly dividendYield: number; readonly frequency: Frequency };
const UNIVERSE_ENTRIES: Record<string, UniverseEntry | undefined> = DIVIDEND_UNIVERSE;

/**
 * 스냅샷의 관측 배당 인상률. **스키마 범위 안의 유한한 수만** 통과시킨다 —
 * 생성물에서 오는 값이라 방어한다(`marketData.schema.ts` 는 -50~50 으로 묶는다).
 */
const resolveDividendCagr = (ticker: string): number | null => {
  const observed = MARKET_DATA.entries[ticker]?.observedDividendCagr;
  return typeof observed === 'number' && Number.isFinite(observed) ? observed : null;
};

const buildTickerRequirement = (
  ticker: string,
  category: DividendTargetCategory,
  monthlyAfterTax: number,
  inflationRatePercent: number
): TickerRequirement | null => {
  const entry = UNIVERSE_ENTRIES[ticker];
  /*
   * 유니버스에 없는 티커는 **조용히 빠진다.** 큐레이션에서 오타가 나거나 종목이 유니버스에서
   * 제거되면 여기 걸리는데, 화면에 빈 칸을 그리는 것보다 빠지는 편이 낫다.
   * 🔴 그 사고를 화면이 아니라 테스트가 잡는다 — `dividendTargetModel.test.ts` 가 12 종 전부
   *    모델에 들어오는지 단정한다(조용한 누락이 조용히 배포되는 것을 막는다).
   */
  if (!entry) return null;

  const slug = SLUG_BY_SYMBOL.get(ticker) ?? null;
  const dividendCagrPercent = resolveDividendCagr(ticker);
  const requirement = computeDividendRequirement({
    monthlyAfterTax,
    dividendYieldPercent: entry.dividendYield,
    taxRatePercent: taxRateForTicker(ticker)
  });
  const payouts = paymentsPerYearMap[entry.frequency];

  return {
    ticker,
    name: KOREAN_NAME_BY_TICKER[ticker] ?? entry.name,
    categoryId: category.id,
    categoryLabel: category.label,
    dividendYieldPercent: entry.dividendYield,
    yieldFreshness: MARKET_DATA.entries[ticker] ? 'snapshot' : 'preset',
    frequency: entry.frequency,
    requirement,
    perPayoutAfterTax: requirement && payouts > 0 ? requirement.annualAfterTax / payouts : null,
    dividendCagrPercent,
    inflation: compareDividendGrowthToInflation(dividendCagrPercent, inflationRatePercent),
    tickerPagePath: slug ? `/ticker/${slug}` : null
  };
};

/**
 * 모델 조립. **순수 함수다** — 같은 입력에 같은 출력이고, 시계·네트워크·전역 상태를 읽지 않는다
 * (스냅샷은 빌드에 굽힌 상수라 입력과 같은 급이다). 그래서 정적 셸 생성에도 쓸 수 있다.
 *
 * @param monthlyAfterTax 목표 월 배당(세후, 원).
 * @param inflationRatePercent 물가상승률 가정(%).
 */
export const buildDividendTargetModel = (
  monthlyAfterTax: number,
  inflationRatePercent: number
): DividendTargetModel => {
  const categories = DIVIDEND_TARGET_CATEGORIES.map((category) => ({
    category,
    tickers: category.tickers
      .map((ticker) => buildTickerRequirement(ticker, category, monthlyAfterTax, inflationRatePercent))
      .filter((item): item is TickerRequirement => item !== null)
  }));

  const all = categories.flatMap((group) => group.tickers);

  return {
    monthlyAfterTax,
    inflationRatePercent,
    categories,
    all,
    asOf: MARKET_DATA_AS_OF,
    exceedsFinancialIncomeThreshold: all.some((item) => item.requirement?.exceedsFinancialIncomeThreshold === true)
  };
};

/** 평탄한 목록에서 한 종목을 찾는다. 없으면 `null`(첫 종목으로 몰래 대체하지 않는다). */
export const findTickerRequirement = (model: DividendTargetModel, ticker: string): TickerRequirement | null =>
  model.all.find((item) => item.ticker === ticker) ?? null;
