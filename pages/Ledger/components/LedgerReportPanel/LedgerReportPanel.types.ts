import type { HoldingRecord, InvestmentRecord, LedgerEntry } from '@/shared/lib/googleSheets';

export type LedgerReportPanelProps = {
  /** 🔴 **전 기간** 기록이다 — 보고 있는 달로 자르지 않는다. */
  readonly entries: readonly LedgerEntry[];
  /** `자산` 탭. 아직 안 읽었으면 빈 배열이고, 그때는 자산 구획을 그리지 않는다. */
  readonly holdings: readonly HoldingRecord[];
  /** `투자` 탭. */
  readonly investments: readonly InvestmentRecord[];
  /** 자산·투자를 아직 읽는 중인가. 🔴 "없다"와 "아직 안 읽었다"는 다른 사실이다. */
  readonly isLoadingSideTabs: boolean;
};
