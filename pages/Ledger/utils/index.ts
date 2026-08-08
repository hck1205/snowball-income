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

/* 고정비 이어가기 — 지난달 고정비를 이번 달 초안으로. 🔴 제안만 만들고 쓰기는 호출부가 한다. */
export { collectCarryOverCandidates } from './ledgerCarryOver';
export type { CarryOverCandidate } from './ledgerCarryOver';

/* ── 화면 탭 · 주체 범위 (2026-08-08) ─────────────────────────────────────────
 * 시트의 네 입력 탭을 앱에서도 탭으로 보여 준다. 🔴 `LedgerTabPicker`(사용자 워크시트 고르기)와
 * 다른 것이다 — 개수가 넷으로 닫혀 있어 가로 탭바가 허용되는 자리다(근거는 ledgerViewTabs 머리말).
 * ⚠ 위 "블렌딩 제거" 주석과 어긋나지 않는다: 탭을 **전환**할 뿐, 탭을 넘어 합계를 내지 않는다. */
export {
  DEFAULT_LEDGER_VIEW_TAB,
  LEDGER_VIEW_TAB_IDS,
  LEDGER_VIEW_TAB_SHEET_TITLE,
  buildLedgerViewTabs,
  resolveLedgerViewTab,
  selectableLedgerTabs
} from './ledgerViewTabs';
export type { LedgerViewTab, LedgerViewTabId } from './ledgerViewTabs';

/* 주체 범위 — 부부·연인이 한 장부를 나눠 볼 때. 🔴 겹치지 않게 나눈다(합이 맞아야 한다). */
export {
  LEDGER_PAYER_SCOPE_ALL,
  collectPayers,
  filterByPayerScope,
  resolvePayerScope,
  shouldOfferPayerScope
} from './ledgerPayerScope';
export type { LedgerPayerScope } from './ledgerPayerScope';

/* 옆탭 뷰 모델 — 자산·투자·분류 규칙. 표시 규칙은 여기가 진다(컴포넌트가 계산하지 않는다). */
export {
  NET_WORTH_TREND_LIMIT,
  buildHoldingsModel,
  buildInvestmentsModel,
  buildRulesModel
} from './ledgerSideTabModel';
export type {
  HoldingRow,
  HoldingsModel,
  InvestmentRow,
  InvestmentsModel,
  NetWorthPoint,
  RuleRow,
  RulesModel
} from './ledgerSideTabModel';

/* 자산·투자 직접 입력 폼 — 🔴 검증 규칙이 여기 **한 곳**에 있다(화면·저장이 같은 함수를 쓴다). */
export {
  LEDGER_SIDE_FIELDS,
  LEDGER_SIDE_HEADERS,
  emptySideDraft,
  sideFormRow,
  validateSideDraft
} from './ledgerSideForm';
export type {
  LedgerSideDraft,
  LedgerSideField,
  LedgerSideFieldKind,
  LedgerSideFormKind
} from './ledgerSideForm';
