/**
 * "월 N 원을 받으려면 얼마가 필요한가" — `/dividend/how-much` 의 **계산 계층**(순수).
 *
 * 원금 식 자체는 `shared/lib/goalPlan` 이 소유한다(이 폴더는 그것을 부른다). 갈라 둔 이유:
 * goalPlan 은 랜딩의 목표 역산이 쓰는 **한 줄 산수**고, 여기는 그 위에 세금 분해·12 종 큐레이션·
 * 물가 비교를 얹은 **화면 모델**이다. 섞으면 랜딩이 티커 데이터를 통째로 끌어온다.
 */
export {
  compareDividendGrowthToInflation,
  computeDividendRequirement,
  taxRateForTicker,
  type DividendRequirement,
  type InflationComparison,
  type InflationVerdict
} from './dividendRequirement';

export {
  DEFAULT_DIVIDEND_TARGET_TICKER,
  DIVIDEND_TARGET_CATEGORIES,
  DIVIDEND_TARGET_TICKERS,
  type DividendTargetCategory,
  type DividendTargetCategoryId
} from './dividendTargetTickers';

export {
  buildDividendTargetModel,
  findTickerRequirement,
  type DividendTargetModel,
  type RequirementCategory,
  type TickerRequirement,
  type YieldFreshness
} from './dividendTargetModel';
