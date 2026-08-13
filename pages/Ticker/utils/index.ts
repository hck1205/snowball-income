/*
 * `pages/Ticker` 의 순수 유틸. 외부에서는 이 폴더 경로로만 import 한다(`.cursor/rules`).
 * 화면(`TickerComparePage`)은 여기서 만든 모델을 그리기만 하고 계산하지 않는다.
 */
export {
  COMPARE_PRESETS,
  MAX_COMPARE_TICKERS,
  MIN_COMPARE_TICKERS,
  UNKNOWN_TEXT,
  analyzePayoutCoverage,
  buildTickerCompareModel,
  formatMonthList,
  getCompareCandidates,
  monthLabel,
  normalizeCompareSelection
} from './tickerCompare';
export type {
  CompareBasis,
  CompareCandidate,
  CompareCell,
  CompareColumn,
  CompareMetricKey,
  ComparePreset,
  CompareRow,
  PayoutCoverage,
  TickerCompareModel
} from './tickerCompare';

/*
 * 유입 화면(의원거래·13F·국민연금·배당목록·검색)이 비교로 종목을 보내는 규칙.
 * 상한·유니버스·정규화를 위 `tickerCompare` 와 **같은 정본**에서 가져다 쓴다.
 */
export {
  addTickerWithEviction,
  buildCompareHref,
  canOpenCompare,
  isComparableTicker,
  removeTicker
} from './tickerSelection';
export type { CompareEntryPoint } from './tickerSelection';
