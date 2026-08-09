import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import {
  LEDGER_LINK_STORAGE_KEY,
  connectSpreadsheet,
  getCachedAccessToken,
  ledgerError,
  openSpreadsheetPicker,
  readLedgerSnapshot,
  requestAccessToken
} from '@/shared/lib/googleSheets';
import type { ColumnMapping, LedgerSnapshot } from '@/shared/lib/googleSheets';
import { useLedgerConnection } from '@/pages/Ledger/hooks';

/**
 * **지난 시트로 이어서** — 새로고침 뒤 한 번의 클릭으로 돌아간다.
 *
 * ## 🔴 무음 되살리기를 넣었다가 되돌렸다 (2026-08-09)
 *
 * 마운트에서 `prompt: ''` 로 조용히 토큰을 받으려 했다. `prompt: ''` 는 **동의**를 건너뛸 뿐이고,
 * 구글 계정이 여럿 로그인돼 있으면 GIS 는 어느 계정인지 물어야 해서 **계정 선택 창을 연다** —
 * 그건 `prompt` 로 못 막는다. 사용자가 아무것도 안 눌렀는데 그 창이 뜨는 것은 팝업이 막히는 것보다
 * 나쁘다.
 *
 * 그래서 이 파일이 잠그는 것은 둘이다:
 *  ① **마운트에서 아무것도 부르지 않는다**(그 회귀가 다시 들어오지 않게)
 *  ② 사용자가 누르면 **피커를 거치지 않고** 지난 시트로 곧장 간다
 *
 * ⚠ 목킹 규율은 형제 `ledgerTabSwitch.test.tsx` 와 같다 — 네트워크 어댑터만 목이고
 *   로컬 보관은 진짜를 쓴다.
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
const TABS = [{ sheetId: 0, title: '내장부' }];

const LINK = {
  spreadsheetId: 'sheet-1',
  sheetId: 0,
  sheetTitle: '내장부',
  mapping: MAPPING,
  createdByApp: true
};

const SNAPSHOT: LedgerSnapshot = {
  snapshotId: 'snap-1',
  spreadsheetId: 'sheet-1',
  sheetTitle: '내장부',
  lastDataRow: 1,
  entries: [],
  unreadableRows: []
};

/** 지난번에 연결해 둔 것이 로컬에 남아 있는 상태. */
const storeLink = () => {
  window.localStorage.setItem(
    LEDGER_LINK_STORAGE_KEY,
    JSON.stringify([{ spreadsheetId: 'sheet-1', sheetId: 0, mapping: MAPPING, createdByApp: true }])
  );
};

beforeEach(() => {
  vi.clearAllMocks();
  window.localStorage.clear();

  vi.mocked(getCachedAccessToken).mockReturnValue({ value: 'token', expiresAt: null });
  vi.mocked(requestAccessToken).mockResolvedValue({ ok: true, value: { value: 'token', expiresAt: null } });
  vi.mocked(readLedgerSnapshot).mockResolvedValue({ ok: true, value: SNAPSHOT });
});

describe('🔴 마운트에서는 아무것도 부르지 않는다', () => {
  it('⭐ 저장된 연결이 있어도 구글 창을 띄우려 하지 않는다 — 계정 선택 창이 뜨던 회귀의 가드', async () => {
    storeLink();

    const hook = renderHook(() => useLedgerConnection());

    await waitFor(() => expect(hook.result.current.state).toBe('disconnected'));
    expect(requestAccessToken).not.toHaveBeenCalled();
    expect(connectSpreadsheet).not.toHaveBeenCalled();
  });

  it('배너도 뜨지 않는다 — 사용자는 아무것도 안 눌렀다', async () => {
    storeLink();

    const hook = renderHook(() => useLedgerConnection());

    await waitFor(() => expect(hook.result.current.state).toBe('disconnected'));
    expect(hook.result.current.connectError).toBeNull();
    expect(hook.result.current.isPopupBlocked).toBe(false);
    expect(hook.result.current.isExpired).toBe(false);
  });
});

describe('⭐ 지난 시트로 이어서 — 피커를 거치지 않는다', () => {
  it('저장된 연결이 있으면 화면이 그 버튼을 그릴 수 있다', async () => {
    storeLink();

    const hook = renderHook(() => useLedgerConnection());

    await waitFor(() => expect(hook.result.current.state).toBe('disconnected'));
    expect(hook.result.current.hasStoredLink).toBe(true);
  });

  it('🔴 없으면 그리지 않는다 — 누를 수 없는 선택지는 화면의 거짓말이다', async () => {
    const hook = renderHook(() => useLedgerConnection());

    await waitFor(() => expect(hook.result.current.state).toBe('disconnected'));
    expect(hook.result.current.hasStoredLink).toBe(false);
  });

  it('⭐ 누르면 곧바로 연결된다 — 파일을 다시 고르지 않는다', async () => {
    storeLink();
    vi.mocked(connectSpreadsheet).mockResolvedValue({
      ok: true,
      value: { status: 'linked', link: LINK, tabs: TABS }
    });

    const hook = renderHook(() => useLedgerConnection());
    await waitFor(() => expect(hook.result.current.state).toBe('disconnected'));

    await act(async () => {
      hook.result.current.restoreLastSheet();
    });

    await waitFor(() => expect(hook.result.current.state).toBe('connected'));
    /* 🔴 피커가 열리지 않았다 — 이미 고른 파일을 또 고르게 하지 않는 것이 이 기능의 전부다. */
    expect(openSpreadsheetPicker).not.toHaveBeenCalled();
    expect(hook.result.current.link?.spreadsheetId).toBe('sheet-1');
  });

  it('⭐ 저장된 매핑을 그대로 넘긴다 — 안 넘기면 열 지정 화면으로 떨어진다', async () => {
    storeLink();
    vi.mocked(connectSpreadsheet).mockResolvedValue({
      ok: true,
      value: { status: 'linked', link: LINK, tabs: TABS }
    });

    const hook = renderHook(() => useLedgerConnection());
    await waitFor(() => expect(hook.result.current.state).toBe('disconnected'));
    await act(async () => {
      hook.result.current.restoreLastSheet();
    });

    await waitFor(() => expect(connectSpreadsheet).toHaveBeenCalled());
    expect(vi.mocked(connectSpreadsheet).mock.calls[0][1]).toMatchObject({
      spreadsheetId: 'sheet-1',
      sheetId: 0,
      mapping: MAPPING
    });
  });

  it('실패하면 사유를 말한다 — 이번엔 사용자가 눌렀으므로 조용하면 안 된다', async () => {
    storeLink();
    vi.mocked(connectSpreadsheet).mockResolvedValue({ ok: false, error: ledgerError('permission-denied') });

    const hook = renderHook(() => useLedgerConnection());
    await waitFor(() => expect(hook.result.current.state).toBe('disconnected'));
    await act(async () => {
      hook.result.current.restoreLastSheet();
    });

    await waitFor(() => expect(hook.result.current.connectError).not.toBeNull());
  });

  it('저장된 연결이 없으면 아무것도 하지 않는다', async () => {
    const hook = renderHook(() => useLedgerConnection());
    await waitFor(() => expect(hook.result.current.state).toBe('disconnected'));

    await act(async () => {
      hook.result.current.restoreLastSheet();
    });

    expect(requestAccessToken).not.toHaveBeenCalled();
  });
});
