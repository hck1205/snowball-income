import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  connectSpreadsheet,
  getCachedAccessToken,
  ledgerError,
  openSpreadsheetPicker,
  readLedgerSnapshot,
  requestAccessToken
} from '@/shared/lib/googleSheets';
import type { ColumnMapping, LedgerEntry, LedgerSnapshot } from '@/shared/lib/googleSheets';
import {
  shouldAutoRefresh,
  snapshotSignature,
  useLedgerConnection,
  useLedgerFreshness,
  useLedgerMonth,
  useRetryCountdown
} from '@/pages/Ledger/hooks';
import { baseViewModel, renderLedgerView } from './ledgerFixtures';

/**
 * B-2 **외부 수정 확인 / 신선도**(AC2-1 ~ AC2-7).
 *
 * 🔴 목킹 규율은 `ledgerTabSwitch.test.tsx` 와 같다 — **네트워크 어댑터만** 목으로 바꾼다.
 * 🔴 자동 확인의 판정은 **`readLedgerSnapshot` 호출 횟수**로 한다. "안 읽었다"는 상태가 아니라
 *    요청의 부재이고, 상태로 단정하면 요청을 한 번 더 보내고도 통과하는 테스트가 된다.
 * ⚠ 시각은 `Date` 만 가짜로 만든다(`toFake: ['Date']`) — `setTimeout` 까지 가짜로 만들면
 *    `waitFor`/`user-event` 가 멈춘다.
 */

vi.mock('@/shared/lib/googleSheets', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/lib/googleSheets')>();
  return {
    ...actual,
    requestAccessToken: vi.fn(),
    getCachedAccessToken: vi.fn(),
    openSpreadsheetPicker: vi.fn(),
    connectSpreadsheet: vi.fn(),
    readLedgerSnapshot: vi.fn()
  };
});

const MAPPING: ColumnMapping = { date: 0, kind: 1, amount: 2, category: 3, memo: 4 };
const TAB = { sheetId: 0, title: '가계부' };

const CONNECTED_AT = new Date('2026-08-03T09:30:00+09:00');
const MINUTE = 60 * 1000;

const entryOf = (snapshotId: string, rowNumber: number, amount: number): LedgerEntry => ({
  ref: { snapshotId, rowNumber },
  date: '2026-08-03',
  kind: 'expense',
  amount,
  fixity: 'variable' as const,
  category: '식비',
  memo: '점심',
  // 🔴 `seen` = 읽을 때 본 원본 셀. 요약 비교의 유일한 재료다.
  seen: { date: '2026-08-03', kind: '지출', amount: String(amount), category: '식비', memo: '점심' }
});

const snapshotOf = (snapshotId: string, amount: number): LedgerSnapshot => ({
  snapshotId,
  spreadsheetId: 'sheet-1',
  sheetTitle: TAB.title,
  lastDataRow: 2,
  entries: [entryOf(snapshotId, 2, amount)],
  unreadableRows: []
});

const linked = {
  ok: true as const,
  value: {
    status: 'linked' as const,
    link: { spreadsheetId: 'sheet-1', sheetId: 0, sheetTitle: TAB.title, mapping: MAPPING, createdByApp: false },
    tabs: [TAB]
  }
};

const mockedRead = vi.mocked(readLedgerSnapshot);

beforeEach(() => {
  vi.clearAllMocks();
  window.localStorage.clear();
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(CONNECTED_AT);

  vi.mocked(getCachedAccessToken).mockReturnValue({ value: 'token-1', expiresAt: null });
  vi.mocked(requestAccessToken).mockResolvedValue({ ok: true, value: { value: 'token-1', expiresAt: null } });
  vi.mocked(openSpreadsheetPicker).mockResolvedValue({ ok: true, value: { spreadsheetId: 'sheet-1' } });
  vi.mocked(connectSpreadsheet).mockResolvedValue(linked);
  mockedRead.mockResolvedValue({ ok: true, value: snapshotOf('snap-1', 12000) });
});

afterEach(() => {
  vi.useRealTimers();
});

/** 연결까지 끝난 화면(연결 훅 + 월 커서 + 신선도 훅)을 세운다. */
const renderConnected = async (initial: { isOverlayOpen: boolean } = { isOverlayOpen: false }) => {
  const hook = renderHook(
    (props: { isOverlayOpen: boolean }) => {
      const connection = useLedgerConnection();
      const month = useLedgerMonth(connection.snapshot, CONNECTED_AT);
      const countdown = useRetryCountdown();
      const freshness = useLedgerFreshness({
        connection,
        countdown,
        isOverlayOpen: props.isOverlayOpen,
        hasUnsavedWork: false
      });
      return { connection, month, freshness };
    },
    { initialProps: initial }
  );

  await act(async () => {
    hook.result.current.connection.pickExistingSheet();
  });
  await waitFor(() => expect(hook.result.current.connection.state).toBe('connected'));
  expect(mockedRead).toHaveBeenCalledTimes(1);
  return hook;
};

/** 창으로 돌아왔다. 🔴 이 이벤트 하나가 자동 확인의 **유일한** 트리거다(인터벌 없음). */
const returnToWindow = async () => {
  await act(async () => {
    window.dispatchEvent(new Event('focus'));
  });
};

describe('AC2-1 · AC2-2 마지막으로 읽은 시각과 수동 새로고침', () => {
  it('연결하면 읽은 시각이 표시되고, 새로고침이 성공하면 그 시각으로 갱신된다', async () => {
    const hook = await renderConnected();
    expect(hook.result.current.freshness.model.readAtText).toBe('09:30 기준');

    vi.setSystemTime(new Date('2026-08-03T10:45:00+09:00'));
    await act(async () => {
      hook.result.current.freshness.refresh();
    });

    await waitFor(() => expect(hook.result.current.freshness.model.readAtText).toBe('10:45 기준'));
  });

  it('AC2-2 — 새로고침하면 시트에서 바뀐 금액이 목록에 반영된다', async () => {
    const hook = await renderConnected();
    expect(hook.result.current.month.rows[0]?.amountText).toBe('₩12,000');

    // 사용자가 폰에서 금액을 고쳤다.
    mockedRead.mockResolvedValue({ ok: true, value: snapshotOf('snap-2', 30000) });
    await act(async () => {
      hook.result.current.freshness.refresh();
    });

    await waitFor(() => expect(hook.result.current.month.rows[0]?.amountText).toBe('₩30,000'));
    expect(mockedRead).toHaveBeenCalledTimes(2);
  });
});

describe('AC2-3 창 포커스 복귀 — 5분 스로틀', () => {
  it('🔴 5분이 지나지 않았으면 요청이 한 번도 나가지 않는다', async () => {
    await renderConnected();

    vi.setSystemTime(new Date(CONNECTED_AT.getTime() + 4 * MINUTE));
    await returnToWindow();

    expect(mockedRead).toHaveBeenCalledTimes(1);
  });

  it('5분이 지났으면 한 번 다시 읽는다', async () => {
    const hook = await renderConnected();

    vi.setSystemTime(new Date(CONNECTED_AT.getTime() + 6 * MINUTE));
    await returnToWindow();

    await waitFor(() => expect(mockedRead).toHaveBeenCalledTimes(2));
    // 다시 읽은 직후에는 스로틀이 처음부터 다시 흐른다 — 돌아올 때마다 때리지 않는다.
    await returnToWindow();
    expect(mockedRead).toHaveBeenCalledTimes(2);
    expect(hook.result.current.connection.state).toBe('connected');
  });

  it('🔴 폴링하지 않는다 — 포커스 없이 시간만 흘러서는 아무 요청도 나가지 않는다', async () => {
    await renderConnected();

    vi.setSystemTime(new Date(CONNECTED_AT.getTime() + 30 * MINUTE));
    await act(async () => {
      await Promise.resolve();
    });

    expect(mockedRead).toHaveBeenCalledTimes(1);
  });
});

describe('AC2-4 입력 중에는 화면을 사용자 밑에서 바꾸지 않는다', () => {
  it('🔴 폼 모달·삭제 다이얼로그가 열려 있으면 5분이 지나도 자동 재조회가 없다', async () => {
    const hook = await renderConnected({ isOverlayOpen: true });

    vi.setSystemTime(new Date(CONNECTED_AT.getTime() + 6 * MINUTE));
    await returnToWindow();

    expect(mockedRead).toHaveBeenCalledTimes(1);

    // 닫으면 그때부터는 확인한다(막는 것이 아니라 미루는 것이다).
    hook.rerender({ isOverlayOpen: false });
    await returnToWindow();
    await waitFor(() => expect(mockedRead).toHaveBeenCalledTimes(2));
  });
});

describe('AC2-5 변경 감지는 "달라졌는가"까지만', () => {
  it('다시 읽은 내용이 직전과 다르면 안내가 켜진다', async () => {
    const hook = await renderConnected();

    mockedRead.mockResolvedValue({ ok: true, value: snapshotOf('snap-2', 30000) });
    await act(async () => {
      hook.result.current.freshness.refresh();
    });

    await waitFor(() => expect(hook.result.current.freshness.model.hasUpdate).toBe(true));
  });

  it('내용이 같으면 아무 말도 하지 않는다 (스냅샷 id 만 바뀐 것은 변경이 아니다)', async () => {
    const hook = await renderConnected();

    mockedRead.mockResolvedValue({ ok: true, value: snapshotOf('snap-2', 12000) });
    await act(async () => {
      hook.result.current.freshness.refresh();
    });

    await waitFor(() => expect(mockedRead).toHaveBeenCalledTimes(2));
    expect(hook.result.current.freshness.model.hasUpdate).toBe(false);
  });

  it('🔴 내가 저장한 뒤의 재조회는 "시트가 갱신되었습니다"가 아니다 (쓰기 훅이 건 재조회는 비교하지 않는다)', async () => {
    const hook = await renderConnected();

    mockedRead.mockResolvedValue({ ok: true, value: snapshotOf('snap-2', 30000) });
    await act(async () => {
      // 쓰기 성공 뒤 `useLedgerWrite` 가 부르는 바로 그 경로.
      await hook.result.current.connection.refresh();
    });

    await waitFor(() => expect(mockedRead).toHaveBeenCalledTimes(2));
    expect(hook.result.current.freshness.model.hasUpdate).toBe(false);
  });
});

describe('AC2-6 429 는 연타를 유도하지 않는다', () => {
  it('요청 제한으로 실패하면 새로고침이 잠기고, 잠긴 동안에는 요청이 나가지 않는다', async () => {
    const hook = await renderConnected();

    mockedRead.mockResolvedValue({ ok: false, error: ledgerError('rate-limited') });
    await act(async () => {
      hook.result.current.freshness.refresh();
    });

    await waitFor(() => expect(hook.result.current.freshness.model.retrySeconds).toBe(30));

    // 잠긴 동안에는 눌러도, 창으로 돌아와도 요청이 없다.
    await act(async () => {
      hook.result.current.freshness.refresh();
    });
    vi.setSystemTime(new Date(CONNECTED_AT.getTime() + 6 * MINUTE));
    await returnToWindow();

    expect(mockedRead).toHaveBeenCalledTimes(2);
  });
});

describe('AC2-7 자동 재조회는 보고 있던 달을 건드리지 않는다', () => {
  it('이전 달을 보다가 자동으로 다시 읽어도 커서가 그대로다', async () => {
    const hook = await renderConnected();
    act(() => {
      hook.result.current.month.goPrev();
    });
    expect(hook.result.current.month.monthLabel).toBe('2026년 7월');

    vi.setSystemTime(new Date(CONNECTED_AT.getTime() + 6 * MINUTE));
    await returnToWindow();
    await waitFor(() => expect(mockedRead).toHaveBeenCalledTimes(2));

    expect(hook.result.current.month.monthLabel).toBe('2026년 7월');
  });
});

describe('순수 함수 — 판정과 서명', () => {
  const base = {
    isConnected: true,
    readAtMs: 0,
    nowMs: 5 * MINUTE,
    isOverlayOpen: false,
    hasUnsavedWork: false,
    isBusy: false,
    isExpired: false,
    isRetryBlocked: false
  };

  it('정확히 5분이 지나면 확인하고, 1ms 모자라면 하지 않는다', () => {
    expect(shouldAutoRefresh(base)).toBe(true);
    expect(shouldAutoRefresh({ ...base, nowMs: 5 * MINUTE - 1 })).toBe(false);
  });

  it('연결 전·오버레이·저장 실패 잔류·진행 중·만료·429 는 전부 확인하지 않는다', () => {
    expect(shouldAutoRefresh({ ...base, isConnected: false })).toBe(false);
    expect(shouldAutoRefresh({ ...base, isOverlayOpen: true })).toBe(false);
    /* 🔴 재조회가 행 실패 표시와 재시도 경로를 지우는 것을 자동으로 하지 않는다. */
    expect(shouldAutoRefresh({ ...base, hasUnsavedWork: true })).toBe(false);
    expect(shouldAutoRefresh({ ...base, isBusy: true })).toBe(false);
    expect(shouldAutoRefresh({ ...base, isExpired: true })).toBe(false);
    expect(shouldAutoRefresh({ ...base, isRetryBlocked: true })).toBe(false);
    // 한 번도 읽지 못했으면 비교할 기준이 없다 — 자동으로 때리지 않는다.
    expect(shouldAutoRefresh({ ...base, readAtMs: null })).toBe(false);
  });

  it('서명은 값이 바뀌면 달라지고, 스냅샷 id 만 다르면 같다', () => {
    expect(snapshotSignature(snapshotOf('snap-1', 12000))).toBe(snapshotSignature(snapshotOf('snap-2', 12000)));
    expect(snapshotSignature(snapshotOf('snap-1', 12000))).not.toBe(snapshotSignature(snapshotOf('snap-1', 30000)));
    // 행이 줄어든 것도 변경이다.
    const empty: LedgerSnapshot = { ...snapshotOf('snap-3', 12000), entries: [] };
    expect(snapshotSignature(empty)).not.toBe(snapshotSignature(snapshotOf('snap-3', 12000)));
    expect(snapshotSignature(null)).toBeNull();
  });
});

describe('화면 — 목록 카드 헤더가 "언제 기준 · 다시 읽기"를 갖는다', () => {
  it('AC2-1 · AC2-2 읽은 시각과 새로고침이 목록 카드에 함께 선다', async () => {
    const user = userEvent.setup();
    const { handlers } = renderLedgerView(baseViewModel());

    expect(screen.getByText('09:30 기준')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '새로고침' }));

    expect(handlers.onRefresh).toHaveBeenCalledTimes(1);
  });

  it('아직 한 번도 읽지 못했으면 시각 자리를 비운다 (없는 값에 "—" 를 남기지 않는다)', () => {
    renderLedgerView(
      baseViewModel({ freshness: { readAtText: null, isRefreshing: false, retrySeconds: null, hasUpdate: false } })
    );

    expect(screen.queryByText(/기준$/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '새로고침' })).toBeInTheDocument();
  });

  it('AC2-5 변경 안내는 달라졌을 때만 나온다', () => {
    const { unmount } = renderLedgerView(baseViewModel());
    expect(screen.queryByText('시트 내용이 갱신되었습니다.')).not.toBeInTheDocument();
    unmount();

    renderLedgerView(
      baseViewModel({ freshness: { readAtText: '09:30 기준', isRefreshing: false, retrySeconds: null, hasUpdate: true } })
    );
    expect(screen.getByText('시트 내용이 갱신되었습니다.')).toBeInTheDocument();
  });

  it('AC2-6 429 대기 중에는 버튼이 잠기고 사유를 함께 말한다 (무음 비활성 금지)', () => {
    renderLedgerView(
      baseViewModel({ freshness: { readAtText: '09:30 기준', isRefreshing: false, retrySeconds: 27, hasUpdate: false } })
    );

    const button = screen.getByRole('button', { name: '새로고침' });
    expect(button).toBeDisabled();

    const hint = screen.getByText('27초 뒤에 다시 시도할 수 있습니다.');
    expect(button).toHaveAttribute('aria-describedby', hint.id);
  });

  it('🔴 연결이 만료되면 새로고침도 잠긴다 — 눌러도 아무 일이 없는 버튼을 남기지 않는다', () => {
    renderLedgerView(baseViewModel({ isExpired: true }));

    const button = screen.getByRole('button', { name: '새로고침' });
    expect(button).toBeDisabled();

    const hint = screen.getByText(
      '연결이 만료되어 지금은 기록을 추가하거나 고칠 수 없습니다. 다시 연결하면 하던 작업을 이어서 진행합니다.'
    );
    expect(button).toHaveAttribute('aria-describedby', hint.id);
  });

  it('🔴 히어로는 연결 요약을 말하지 않는다 — 같은 사실을 세 번 말하지 않는다', () => {
    renderLedgerView(baseViewModel());

    expect(screen.queryByText(/연결한 시트/)).not.toBeInTheDocument();
    // 대신 탭 줄이 "어느 장부"를 한 번만 말한다.
    expect(screen.getByText('우리집 가계부 탭을 보고 있습니다')).toBeInTheDocument();
  });
});
