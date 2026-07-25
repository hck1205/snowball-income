import type { PayoutScheduleRow } from '../../MonthlyCashflow.utils';

export type PayoutScheduleStripProps = {
  /** utils `buildPayoutScheduleRows` 결과. 빈 배열이면 호출부가 스트립 자체를 렌더하지 않는다. */
  rows: PayoutScheduleRow[];
};
