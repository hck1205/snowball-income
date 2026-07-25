export type CashflowViewMode = 'chart' | 'calendar';

export type CashflowControlsProps = {
  /** 선택 가능한 연도 목록(오름차순). */
  years: number[];
  selectedYear: number | null;
  onSelectYear: (year: number) => void;
  /** 원화에서 이미 합산된 값 — 표시 직전에 한 번만 환산한다. */
  totalDividend: number;
  formatAmount: (value: number) => string;
  viewMode: CashflowViewMode;
  onChangeViewMode: (mode: CashflowViewMode) => void;
};
