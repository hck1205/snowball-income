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
