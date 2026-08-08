export {
  addMonths,
  buildSheetUrl,
  collectCategories,
  collectFieldValues,
  formatEntryDate,
  formatReadAt,
  isExpiredCode,
  isSameMonth,
  kindLabel,
  isVisibleEntry,
  latestMonthOf,
  monthCursorOfISO,
  monthLabelOf,
  nextRetryDelaySec,
  summarizeMonth,
  toColumnOptions,
  toErrorModel,
  toFailureReason,
  toISODate,
  toMonthCursor,
  toRowModel
} from './ledgerFormat';
export type { LedgerMonthCursor } from './ledgerFormat';

export {
  LEDGER_DIVIDEND_OVERLAY_KEY,
  buildLedgerDividendModel,
  coveredExpenseCategories,
  expenseCoverageRatio,
  foldExpenseByCategory,
  formatCoveragePercent,
  parseLedgerDividendOverlay,
  readLedgerDividendOverlay,
  sumMonthExpense,
  writeLedgerDividendOverlay
} from './ledgerDividend';
export type { LedgerDividendInput, LedgerExpenseCategoryTotal } from './ledgerDividend';

/*
 * 🔴 가계부 블렌딩(두 시트/탭을 앱이 합쳐 보여주기)은 **2026-08-02 사용자 결정으로 제거**했다.
 * 되살리지 마라 — 사용자가 시트 안에서 탭으로 이미 할 수 있는 일이었다. 여러 장부를 탭으로 나누고
 * 또 다른 탭에서 합계를 내는 것이 스프레드시트의 본래 강점이고, 앱이 그걸 다시 구현하면
 * "어느 쪽이 진짜 합계인가"가 둘로 갈린다. 앱은 **파일 하나만 호출**하고 탭 전환만 제공한다.
 * 탭 목록·전환은 그대로 남아 있다(LedgerTabPicker · useLedgerConnection.switchTab).
 */

export {
  LEDGER_AMOUNT_MAX,
  LEDGER_CATEGORY_MAX_LENGTH,
  LEDGER_MEMO_MAX_LENGTH,
  firstInvalidField,
  ledgerFormSchema,
  parseLedgerAmount,
  validateLedgerForm
} from './ledgerFormSchema';

/* ── P4·P5 분석 집계 (2026-08-08) ────────────────────────────────────────────
 * 순수 함수만 있다. 화면(차트·표)은 이 값을 그리기만 하고 계산하지 않는다 —
 * 계산이 컴포넌트로 흩어지면 표와 그래프가 다른 숫자를 말하기 시작한다. */
export {
  FIXITY_LABEL,
  UNCLASSIFIED_LABEL,
  buildCategoryPivot,
  hasMultiplePayers,
  monthKeyOf,
  monthlyCashFlow,
  splitByFixity,
  topSpending,
  totalsByMethod,
  totalsByPayer
} from './ledgerAnalysis';
export type {
  CategoryPivot,
  FixitySplit,
  MethodTotal,
  MonthKey,
  MonthlyCashFlow,
  PayerTotal,
  PivotCell,
  PivotRow,
  TopSpending
} from './ledgerAnalysis';

/* 분석 카드 뷰 모델 — 집계를 화면이 그릴 문자열로 접는다(표시 규칙은 여기가 진다). */
export { TOP_SPENDING_LIMIT, TREND_MONTH_LIMIT, buildLedgerAnalysisModel } from './ledgerAnalysisModel';
export type {
  AnalysisBar,
  FixitySection,
  LedgerAnalysisModel,
  PayerSection,
  TrendPoint
} from './ledgerAnalysisModel';
