import { vi } from 'vitest';
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
  state: 'connected',
  phase: 'idle',
  showCheckingSkeleton: false,
  sheetMetaLine: '연결한 시트 우리집 가계부 · 09:30에 읽었습니다',
  sheetUrl: 'https://docs.google.com/spreadsheets/d/abc/edit',
  sheetName: '우리집 가계부',

  monthLabel: '2026년 8월',
  prevMonthLabel: '2026년 7월',
  nextMonthLabel: '2026년 9월',
  thisMonthLabel: '2026년 8월',
  isCurrentMonth: true,
  latestMonthLabel: null,

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
    onPickExistingSheet: vi.fn(),
    onCreateSheet: vi.fn(),
    onMappingChange: vi.fn(),
    onConfirmMapping: vi.fn(),
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
    onReconnect: vi.fn(),
    onRefresh: vi.fn(),
    onOpenSheet: vi.fn(),
    onDismissCreatedNotice: vi.fn()
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
