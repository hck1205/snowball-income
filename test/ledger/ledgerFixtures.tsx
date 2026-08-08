import { vi } from 'vitest';
import { buildLedgerViewTabs } from '@/pages/Ledger/utils';
import { render } from '@testing-library/react';
import LedgerPageView from '@/pages/Ledger/LedgerPage/LedgerPage.view';
import type { LedgerViewModel, LedgerViewProps } from '@/pages/Ledger';
import type { LedgerMonthSummary, LedgerRowModel } from '@/pages/Ledger/types';

/**
 * `/ledger` 화면 계층 테스트의 공용 픽스처.
 *
 * 🔴 뷰를 **직접 렌더**한다 — 이 레포의 테스트 환경에는 구글 자격증명이 없어 `isGoogleSheetsEnabled`
 * 가 false 이고, 그래서 `/ledger` 라우트가 배열에 아예 없다(`test/router/ledgerRouteGate.test.tsx`).
 * 라우터를 거치면 `connected` 이후 상태를 영원히 검증할 수 없다.
 *
 * ⚠ 기대값에 소스의 상수를 그대로 쓰지 않는다 — 카피는 각 테스트가 **리터럴**로 적는다.
 * 여기 있는 값은 "화면에 들어가는 입력"일 뿐 기대값이 아니다.
 */

export const ledgerRow = (overrides: Partial<LedgerRowModel> = {}): LedgerRowModel => ({
  id: 'snap-1:2',
  dateISO: '2026-08-03',
  dateText: '8월 3일 (월)',
  kind: 'expense',
  category: '식비',
  amount: 12000,
  amountText: '₩12,000',
  memo: '점심',
  failure: null,
  ...overrides
});

export const ZERO_SUMMARY: LedgerMonthSummary = {
  incomeText: '₩0',
  expenseText: '₩0',
  netText: '₩0',
  incomeCount: 0,
  expenseCount: 0
};

export const SUMMARY_WITH_ROWS: LedgerMonthSummary = {
  incomeText: '₩3,200,000',
  expenseText: '₩12,000',
  netText: '₩3,188,000',
  incomeCount: 1,
  expenseCount: 1
};

export const TWO_ROWS: LedgerRowModel[] = [
  ledgerRow(),
  ledgerRow({
    id: 'snap-1:3',
    dateISO: '2026-08-05',
    dateText: '8월 5일 (수)',
    kind: 'income',
    category: '급여',
    amount: 3200000,
    amountText: '₩3,200,000',
    memo: ''
  })
];

export const baseViewModel = (overrides: Partial<LedgerViewModel> = {}): LedgerViewModel => ({
  /**
   * 기본값은 **앱 로그인을 마친 사용자**다 — 기존 화면 상태 테스트가 전부 그 전제 위에 서 있다.
   * 🔴 로그인 게이트 자체를 검증하는 테스트는 `ledgerAppSignIn.test.tsx` 가 이 값을 덮어 쓴다.
   */
  appAuth: { isReady: true, isLoggedIn: true },

  /*
   * 기본값은 **앱이 만든 시트**(네 탭 다 열림) + `가계부` 탭을 보고 있는 상태다 —
   * 기존 화면 테스트가 전부 기록 목록을 전제로 서 있다.
   */
  viewTabs: buildLedgerViewTabs(true),
  selectedViewTab: 'entries',
  sideTab: null,
  sideForm: null,
  /* 기본값은 **혼자 쓰는 장부** — 주체 컨트롤이 없던 시절의 화면을 그대로 본다. */
  payers: [],
  payerScope: null,
  offerPayerScope: false,

  state: 'connected',
  phase: 'idle',
  showCheckingSkeleton: false,
  sheetUrl: 'https://docs.google.com/spreadsheets/d/abc/edit',
  sheetName: '우리집 가계부',
  /* 기본값은 **탭 1개** — 기존 화면 테스트는 탭 선택이 없던 시절의 화면을 그대로 본다. */
  tabPicker: {
    options: [{ sheetId: 0, title: '우리집 가계부' }],
    currentSheetId: 0,
    currentTitle: '우리집 가계부',
    blockedReason: null,
    isSwitching: false
  },

  monthLabel: '2026년 8월',
  prevMonthLabel: '2026년 7월',
  nextMonthLabel: '2026년 9월',
  thisMonthLabel: '2026년 8월',
  isCurrentMonth: true,
  latestMonthLabel: null,

  /* B-2 기본값 = 한 번 읽었고, 다시 읽는 중이 아니며, 429 대기도 변경 안내도 없는 화면. */
  freshness: { readAtText: '09:30 기준', isRefreshing: false, retrySeconds: null, hasUpdate: false },

  /* B-4 기본값 = **꺼짐**(확정 결정). 기존 화면 테스트는 배당 카드가 없던 시절의 화면을 그대로 본다. */
  dividend: { isOn: false, body: null },

  /*
   * P4·P5 분석 카드 기본값 = **빈 모델**. 기존 화면 테스트는 분석 카드가 없던 시절의 화면을 그대로
   * 보아야 하고, 빈 모델이면 카드가 한 문장으로 접혀 다른 단정에 끼어들지 않는다.
   * 분석 카드 자체의 테스트는 모델을 직접 넘겨 본다(ledgerAnalysisCard.test.tsx).
   */
  analysis: { fixity: null, payer: null, topBars: [], trend: [], isEmpty: true },

  /* 이어갈 고정비 없음 = 자리 자체가 없다. 기존 화면 테스트가 보던 화면 그대로다. */
  carryOver: null,

  summary: SUMMARY_WITH_ROWS,
  rows: TWO_ROWS,
  isRefetching: false,
  isFirstLoad: false,

  isExpired: false,
  isReconnecting: false,
  isConflict: false,
  isDenied: false,
  isPopupBlocked: false,
  showCreatedNotice: false,
  connectError: null,

  mapping: null,
  partialFailure: null,
  form: null,

  removeTarget: null,
  isRemoving: false,
  removeError: null,

  liveMessage: '',
  ...overrides
});

export type LedgerHandlers = {
  [K in keyof LedgerViewProps as LedgerViewProps[K] extends (...args: never[]) => unknown ? K : never]: ReturnType<
    typeof vi.fn
  >;
};

export const renderLedgerView = (
  viewModel: LedgerViewModel,
  overrides: Partial<LedgerViewProps> = {}
): { handlers: LedgerHandlers } & ReturnType<typeof render> => {
  const handlers = {
    onFocusAfterRemoveHandled: vi.fn(),
    onSignIn: vi.fn(),
    onPickExistingSheet: vi.fn(),
    onCreateSheet: vi.fn(),
    onMappingChange: vi.fn(),
    onConfirmMapping: vi.fn(),
    onSelectTab: vi.fn(),
    onToggleDividendOverlay: vi.fn(),
    onPrevMonth: vi.fn(),
    onNextMonth: vi.fn(),
    onThisMonth: vi.fn(),
    onGoLatestMonth: vi.fn(),
    onOpenCreateForm: vi.fn(),
    onOpenEditForm: vi.fn(),
    onFormChange: vi.fn(),
    onSubmitForm: vi.fn(),
    onCloseForm: vi.fn(),
    onRequestRemove: vi.fn(),
    onConfirmRemove: vi.fn(),
    onCloseRemove: vi.fn(),
    onRetryRow: vi.fn(),
    onRetryAll: vi.fn(),
  onOpenCarryOver: vi.fn(),
  onConfirmCarryOver: vi.fn(),
  onCloseCarryOver: vi.fn(),
    onReconnect: vi.fn(),
    onRefresh: vi.fn(),
    onOpenSheet: vi.fn(),
    onDismissCreatedNotice: vi.fn(),
    onSelectViewTab: vi.fn(),
    onSelectPayerScope: vi.fn(),
    onRetrySideTab: vi.fn(),
    onAddSideEntry: vi.fn(),
    onSideFormChange: vi.fn(),
    onSideFormSubmit: vi.fn(),
    onSideFormClose: vi.fn()
  } satisfies LedgerHandlers;

  const utils = render(
    <LedgerPageView
      viewModel={viewModel}
      retryCountdowns={new Map()}
      focusAfterRemoveId={null}
      {...handlers}
      {...overrides}
    />
  );

  return { ...utils, handlers };
};
