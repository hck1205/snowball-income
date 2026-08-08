import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import {
  appendLedgerEntries,
  deleteLedgerEntry,
  ledgerError,
  updateLedgerEntry
} from '@/shared/lib/googleSheets';
import type { LedgerEntry, LedgerSnapshot, SheetLink } from '@/shared/lib/googleSheets';
import { useLedgerWrite } from '@/pages/Ledger/hooks';
import type { LedgerConnection } from '@/pages/Ledger/hooks';
import { toRowModel } from '@/pages/Ledger/utils';
import type { RetryCountdown } from '@/pages/Ledger/hooks';

/**
 * `/ledger` **쓰기 훅**의 계약 — 뷰로는 볼 수 없는 것들.
 *
 * 🔴 목킹 규율: 불리언·`{ok}` 로 실패를 알리는 API 를 `vi.fn()` 기본값(=`undefined`)으로 두면
 * "실패를 정상이라고 단정"하게 된다. 그래서 매 테스트 전에 세 API 를 **던지는 구현**으로 리셋하고,
 * 각 테스트가 성공/실패를 **명시적으로** 주입한다. 목을 깜빡한 경로는 통과하지 않고 터진다.
 */

vi.mock('@/shared/lib/googleSheets', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/lib/googleSheets')>();
  return {
    ...actual,
    appendLedgerEntries: vi.fn(),
    updateLedgerEntry: vi.fn(),
    deleteLedgerEntry: vi.fn()
  };
});

const LINK: SheetLink = {
  spreadsheetId: 'sheet-1',
  sheetId: 0,
  sheetTitle: '가계부',
  mapping: { date: 0, kind: 1, amount: 2, category: 3, memo: 4 },
  // 사용자가 고른 기존 시트 — `상태` 열이 없어 삭제는 **물리 삭제**다.
  createdByApp: false
};

const ENTRY: LedgerEntry = {
  ref: { snapshotId: 'snap-1', rowNumber: 2 },
  date: '2026-08-03',
  kind: 'expense',
  amount: 12000,
  category: '식비',
  fixity: 'variable',
  memo: '점심',
  seen: { date: '2026-08-03', kind: '지출', amount: '12000', category: '식비', memo: '점심' }
};

const ROW_ID = 'snap-1:2';

const SNAPSHOT: LedgerSnapshot = {
  snapshotId: 'snap-1',
  spreadsheetId: 'sheet-1',
  sheetTitle: '가계부',
  lastDataRow: 2,
  entries: [ENTRY],
  unreadableRows: []
};

const countdown = (): RetryCountdown => ({
  seconds: new Map(),
  start: vi.fn(),
  clear: vi.fn(),
  clearAll: vi.fn()
});

const makeConnection = (overrides: Partial<LedgerConnection> = {}): LedgerConnection => ({
  /* 기본값은 **규칙 없음** — 사다리 1단이 빠진 상태가 기존 테스트의 전제다. */
  classifyRules: [],
  state: 'connected',
  phase: 'idle',
  showCheckingSkeleton: false,
  link: LINK,
  tabs: [{ sheetId: 0, title: '가계부' }],
  isTabSwitching: false,
  snapshot: SNAPSHOT,
  readAt: new Date('2026-08-03T09:30:00+09:00'),
  isFirstLoad: false,
  isRefetching: false,
  isExpired: false,
  isReconnecting: false,
  isConflict: false,
  isPopupBlocked: false,
  showCreatedNotice: false,
  connectError: null,
  mapping: null,
  readContext: () => ({ accessToken: 'token-1' }),
  applyError: vi.fn(),
  // 🔴 명시적 성공. `vi.fn()` 기본값(undefined)은 "재조회 실패"와 구분되지 않는다.
  refresh: vi.fn(async () => true),
  markPopupBlocked: vi.fn(),
  pickExistingSheet: vi.fn(),
  createSheet: vi.fn(),
  switchTab: vi.fn(),
  changeMapping: vi.fn(),
  confirmMapping: vi.fn(),
  reconnect: vi.fn(),
  dismissCreatedNotice: vi.fn(),
  ...overrides
});

const renderWrite = (connection: LedgerConnection) => {
  const rows = [toRowModel(ENTRY)];
  return renderHook(
    (props: { connection: LedgerConnection }) =>
      useLedgerWrite({
        connection: props.connection,
        entryById: new Map([[ROW_ID, ENTRY]]),
        categoryOptions: ['식비'],
        subcategoryOptions: [],
        payerOptions: [],
        methodOptions: [],
        carryOverCandidates: [],
        rows,
        countdown: countdown(),
        now: new Date('2026-08-03T09:30:00+09:00')
      }),
    { initialProps: { connection } }
  );
};

const DRAFT = {
  date: '2026-08-04',
  kind: 'expense' as const,
  amount: '9000',
  category: '교통',
  /* v2 축 넷 — 폼에서 비워 두는 것이 기본이고, 그 기본이 draft 에도 그대로 실린다. */
  subcategory: '',
  payer: '',
  method: '',
  isFixed: false,
  memo: '버스'
};

beforeEach(() => {
  // 🔴 호출 이력은 테스트마다 0에서 시작한다 — 누적되면 "부르지 않았다" 단정이 옆 테스트에 오염된다.
  vi.clearAllMocks();
  const unset = (name: string) => () => {
    throw new Error(`${name} 목이 설정되지 않았다 — 성공/실패를 명시로 주입하라`);
  };
  vi.mocked(appendLedgerEntries).mockImplementation(unset('appendLedgerEntries'));
  vi.mocked(updateLedgerEntry).mockImplementation(unset('updateLedgerEntry'));
  vi.mocked(deleteLedgerEntry).mockImplementation(unset('deleteLedgerEntry'));
});

describe('삭제 — 🔴 물리 삭제 뒤에는 반드시 목록을 재조회한다', () => {
  it('성공하면 재조회하고, 확인 토큰을 실은 물리 삭제로 나간다', async () => {
    vi.mocked(deleteLedgerEntry).mockResolvedValue({
      ok: true,
      value: { rowNumber: 2, mode: 'hard', snapshotRetired: true }
    });

    const connection = makeConnection();
    const { result } = renderWrite(connection);

    act(() => result.current.requestRemove(ROW_ID));
    expect(result.current.removeTarget?.id).toBe(ROW_ID);

    await act(async () => {
      result.current.confirmRemove();
    });

    const call = vi.mocked(deleteLedgerEntry).mock.calls[0][1];
    expect(call.mode).toBe('hard');
    expect(call.confirmation).toBeDefined();

    // 🔴 스냅샷이 폐기됐다 — 재조회 없이 다음 쓰기를 하면 `stale-snapshot` 으로 전부 거부된다.
    expect(connection.refresh).toHaveBeenCalledTimes(1);
    expect(result.current.removeTarget).toBeNull();
    expect(result.current.liveMessage).toBe('기록을 삭제했습니다.');
  });

  it('실패하면 다이얼로그를 닫지 않고 사유를 남기며 재조회하지 않는다', async () => {
    vi.mocked(deleteLedgerEntry).mockResolvedValue({ ok: false, error: ledgerError('permission-denied') });

    const connection = makeConnection();
    const { result } = renderWrite(connection);

    act(() => result.current.requestRemove(ROW_ID));
    await act(async () => {
      result.current.confirmRemove();
    });

    expect(result.current.removeTarget?.id).toBe(ROW_ID);
    expect(result.current.removeError).toEqual({
      title: '저장하지 못했습니다',
      body: '이 시트에 쓸 권한이 없습니다. 구글 시트에서 편집 권한을 확인해 주세요.',
      reason: 'permission'
    });
    expect(connection.refresh).not.toHaveBeenCalled();
  });

  it('실패한 채 닫으면 그 행에 실패가 잔류한다 (재시도 경로를 화면에서 잃지 않는다)', async () => {
    vi.mocked(deleteLedgerEntry).mockResolvedValue({ ok: false, error: ledgerError('network-error') });

    const { result } = renderWrite(makeConnection());

    act(() => result.current.requestRemove(ROW_ID));
    await act(async () => {
      result.current.confirmRemove();
    });
    act(() => result.current.closeRemove());

    expect(result.current.removeTarget).toBeNull();
    expect(result.current.rowFailures.get(ROW_ID)).toEqual({
      reason: 'network',
      body: '네트워크 문제로 시트에 저장하지 못했습니다. 연결을 확인한 뒤 다시 시도해 주세요.',
      retryAfterSec: null
    });
  });
});

describe('저장 — 실패해도 입력값을 버리지 않는다', () => {
  it('추가 실패 시 폼이 열린 채 입력값과 사유가 함께 남는다', async () => {
    vi.mocked(appendLedgerEntries).mockResolvedValue({
      status: 'failure',
      items: [{ ok: false, index: 0, error: ledgerError('network-error') }],
      successCount: 0,
      failureCount: 1
    });

    const connection = makeConnection();
    const { result } = renderWrite(connection);

    act(() => result.current.openCreateForm());
    act(() => result.current.changeForm(DRAFT));
    await act(async () => {
      result.current.submitForm();
    });

    expect(result.current.form).not.toBeNull();
    expect(result.current.form?.draft).toEqual(DRAFT);
    expect(result.current.form?.writeError?.title).toBe('저장하지 못했습니다');
    expect(connection.refresh).not.toHaveBeenCalled();
  });

  it('성공하면 폼을 닫고 라이브 리전으로 알린 뒤 목록을 재조회한다', async () => {
    vi.mocked(appendLedgerEntries).mockResolvedValue({
      status: 'success',
      items: [{ ok: true, index: 0, value: 3 }],
      successCount: 1,
      failureCount: 0
    });

    const connection = makeConnection();
    const { result } = renderWrite(connection);

    act(() => result.current.openCreateForm());
    act(() => result.current.changeForm(DRAFT));
    await act(async () => {
      result.current.submitForm();
    });

    expect(result.current.form).toBeNull();
    expect(result.current.liveMessage).toBe('기록을 저장했습니다.');
    expect(connection.refresh).toHaveBeenCalledTimes(1);
  });

  it('검증 오류는 네트워크를 쓰기 전에 필드 오류로 말한다', () => {
    const { result } = renderWrite(makeConnection());

    act(() => result.current.openCreateForm());
    act(() => result.current.changeForm({ amount: '', category: '' }));
    act(() => result.current.submitForm());

    expect(result.current.form?.errors).toEqual({
      amount: '금액을 입력해 주세요.',
      category: '항목을 비우실 거라면 내용을 적어 주세요. 내용을 보고 항목을 채워 드립니다.'
    });
    expect(appendLedgerEntries).not.toHaveBeenCalled();
  });

  it('추가 실패 뒤 폼을 닫으면 그 건이 "저장하지 못한 기록"으로 옮겨 간다', async () => {
    vi.mocked(appendLedgerEntries).mockResolvedValue({
      status: 'failure',
      items: [{ ok: false, index: 0, error: ledgerError('network-error') }],
      successCount: 0,
      failureCount: 1
    });

    const { result } = renderWrite(makeConnection());

    act(() => result.current.openCreateForm());
    act(() => result.current.changeForm(DRAFT));
    await act(async () => {
      result.current.submitForm();
    });
    act(() => result.current.closeForm());

    expect(result.current.form).toBeNull();
    expect(result.current.partialFailure?.rows.length).toBe(1);
    expect(result.current.partialFailure?.rows[0].category).toBe('교통');
    // 한 건짜리에는 "1건 중 0건" 배너를 내지 않는다(숫자가 소음이 된다).
    expect(result.current.partialFailure?.hasBatchReport).toBe(false);
  });
});

describe('부분 실패 — 🔴 숫자가 보존된다', () => {
  const queueTwo = async (result: { current: ReturnType<typeof useLedgerWrite> }) => {
    vi.mocked(appendLedgerEntries).mockResolvedValue({
      status: 'failure',
      items: [{ ok: false, index: 0, error: ledgerError('network-error') }],
      successCount: 0,
      failureCount: 1
    });

    for (const draft of [DRAFT, { ...DRAFT, category: '통신', amount: '55000' }]) {
      act(() => result.current.openCreateForm());
      act(() => result.current.changeForm(draft));
      // eslint-disable-next-line no-await-in-loop
      await act(async () => {
        result.current.submitForm();
      });
      act(() => result.current.closeForm());
    }
  };

  it('일괄 재시도 결과가 "N건 중 M건"으로 남고 실패 건만 목록에 잔류한다', async () => {
    const connection = makeConnection();
    const { result } = renderWrite(connection);
    await queueTwo(result);
    expect(result.current.partialFailure?.rows.length).toBe(2);

    vi.mocked(appendLedgerEntries).mockResolvedValue({
      status: 'partial',
      items: [
        { ok: true, index: 0, value: 3 },
        { ok: false, index: 1, error: ledgerError('permission-denied') }
      ],
      successCount: 1,
      failureCount: 1
    });

    await act(async () => {
      result.current.retryAll();
    });

    expect(result.current.partialFailure).toMatchObject({
      successCount: 1,
      totalCount: 2,
      hasBatchReport: true
    });
    expect(result.current.partialFailure?.rows.length).toBe(1);
    expect(result.current.partialFailure?.rows[0].category).toBe('통신');
    expect(result.current.partialFailure?.rows[0].failure?.reason).toBe('permission');
  });

  it('429 가 섞이면 "모두 다시 시도"가 막힌다', async () => {
    const { result } = renderWrite(makeConnection());
    await queueTwo(result);

    vi.mocked(appendLedgerEntries).mockResolvedValue({
      status: 'partial',
      items: [
        { ok: true, index: 0, value: 3 },
        { ok: false, index: 1, error: ledgerError('rate-limited') }
      ],
      successCount: 1,
      failureCount: 1
    });

    await act(async () => {
      result.current.retryAll();
    });

    expect(result.current.partialFailure?.isRetryAllBlocked).toBe(true);
  });
});

describe('만료 — 재연결 1클릭 뒤 하던 작업이 이어서 실행된다(§4.7-4 / 수용기준 5)', () => {
  it('만료 중 저장은 시도조차 하지 않고 폼과 입력값을 유지한다', () => {
    const { result } = renderWrite(makeConnection({ isExpired: true }));

    act(() => result.current.openCreateForm());
    act(() => result.current.changeForm(DRAFT));
    act(() => result.current.submitForm());

    expect(appendLedgerEntries).not.toHaveBeenCalled();
    expect(result.current.form?.draft).toEqual(DRAFT);
    expect(result.current.form?.writeError).toBeNull();
  });

  it('🔴 [red] 재연결이 성공하면 대기 중이던 저장이 **한 번의 클릭으로** 실행된다', async () => {
    vi.mocked(appendLedgerEntries).mockResolvedValue({
      status: 'success',
      items: [{ ok: true, index: 0, value: 3 }],
      successCount: 1,
      failureCount: 0
    });

    /* 재연결 콜백을 붙잡아 둔다 — 실제 훅은 토큰 재발급·재조회가 끝난 **뒤에** 이것을 부른다. */
    let resume: (() => void) | undefined;
    const reconnect = vi.fn((onRestored?: () => void) => {
      resume = onRestored;
    });

    const { result, rerender } = renderWrite(makeConnection({ isExpired: true, reconnect }));

    act(() => result.current.openCreateForm());
    act(() => result.current.changeForm(DRAFT));
    act(() => result.current.submitForm());

    act(() => result.current.resumePending());
    expect(reconnect).toHaveBeenCalledTimes(1);

    // 데이터 계층이 토큰을 되찾아 만료가 풀린 상태(실제 훅의 `setIsExpired(false)` 에 해당).
    rerender({ connection: makeConnection({ isExpired: false, reconnect }) });

    await act(async () => {
      resume?.();
    });

    /*
     * 🔴 현재 실패한다. `resumePending` 이 `connection.reconnect` 에 넘기는 콜백은 **클릭 시점의
     * `submitForm`** 을 붙잡고 있고, 그 클로저의 `connection.isExpired` 는 여전히 `true` 다
     * (`pages/Ledger/hooks/useLedgerWrite.ts:507-519` → `:280-286`). 그래서 재연결 뒤에도 저장이
     * 실행되지 않고 대기 작업만 다시 쌓인다 — 사용자는 "다시 연결하고 저장"을 **두 번** 눌러야 한다.
     */
    expect(appendLedgerEntries).toHaveBeenCalledTimes(1);
    expect(result.current.form).toBeNull();
  });

  it('만료 중 삭제는 재연결 뒤 그대로 이어서 실행된다', async () => {
    vi.mocked(deleteLedgerEntry).mockResolvedValue({
      ok: false,
      error: ledgerError('auth-expired')
    });

    let resume: (() => void) | undefined;
    const reconnect = vi.fn((onRestored?: () => void) => {
      resume = onRestored;
    });

    const connection = makeConnection({ reconnect });
    const { result } = renderWrite(connection);

    act(() => result.current.requestRemove(ROW_ID));
    await act(async () => {
      result.current.confirmRemove();
    });
    expect(connection.applyError).toHaveBeenCalledTimes(1);

    vi.mocked(deleteLedgerEntry).mockResolvedValue({
      ok: true,
      value: { rowNumber: 2, mode: 'hard', snapshotRetired: true }
    });

    act(() => result.current.resumePending());
    await act(async () => {
      resume?.();
    });

    expect(deleteLedgerEntry).toHaveBeenCalledTimes(2);
    expect(connection.refresh).toHaveBeenCalledTimes(1);
  });
});
