import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import {
  LEDGER_LINK_STORAGE_KEY,
  connectSpreadsheet,
  ledgerError,
  getCachedAccessToken,
  readLedgerSnapshot,
  requestAccessToken
} from '@/shared/lib/googleSheets';
import type { ColumnMapping, LedgerSnapshot } from '@/shared/lib/googleSheets';
import { useLedgerConnection } from '@/pages/Ledger/hooks';

/**
 * **무음 되살리기**(2026-08-09) — 새로고침해도 클릭 없이 연결이 돌아온다.
 *
 * 시트 ID·탭·열 매핑은 이미 로컬에 있는데 **토큰만 메모리라 새로고침에서 사라진다.** 그래서
 * 새로고침할 때마다 사용자가 연결 버튼을 다시 눌러야 했다.
 *
 * 🔴 여기서 잠그는 것은 "되살아나는가"보다 **"실패했을 때 조용한가"** 다. 사용자가 아무것도
 *    안 눌렀는데 배너가 뜨면 그건 거짓 경보이고, 그 화면은 고장 난 것처럼 보인다.
 *
 * ⚠ 목킹 규율은 형제 `ledgerTabSwitch.test.tsx` 와 같다 — 네트워크 어댑터만 목이고
 *   로컬 보관은 진짜를 쓴다(저장까지 목이면 "저장했다고 가정한 것"을 검증하게 된다).
 */

vi.mock('@/shared/lib/googleSheets', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/lib/googleSheets')>();
  return {
    ...actual,
    requestAccessToken: vi.fn(),
    getCachedAccessToken: vi.fn(),
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
  window.localStorage.clear();
  vi.mocked(requestAccessToken).mockReset();
  vi.mocked(getCachedAccessToken).mockReset();
  vi.mocked(connectSpreadsheet).mockReset();
  vi.mocked(readLedgerSnapshot).mockReset();

  vi.mocked(getCachedAccessToken).mockReturnValue({ value: 'token', expiresAt: null });
  vi.mocked(readLedgerSnapshot).mockResolvedValue({ ok: true, value: SNAPSHOT });
});

describe('⭐ 저장된 연결이 있으면 클릭 없이 되살아난다', () => {
  it('무음으로 토큰을 받아 곧바로 연결된다', async () => {
    storeLink();
    vi.mocked(requestAccessToken).mockResolvedValue({ ok: true, value: { value: 'token', expiresAt: null } });
    vi.mocked(connectSpreadsheet).mockResolvedValue({
      ok: true,
      value: { status: 'linked', link: LINK, tabs: TABS }
    });

    const hook = renderHook(() => useLedgerConnection());

    await waitFor(() => expect(hook.result.current.state).toBe('connected'));
    expect(hook.result.current.link?.spreadsheetId).toBe('sheet-1');
  });

  it('🔴 무음 시도임을 알린다 — 실패를 어떻게 다룰지가 사용자 클릭과 다르다', async () => {
    storeLink();
    vi.mocked(requestAccessToken).mockResolvedValue({ ok: true, value: { value: 'token', expiresAt: null } });
    vi.mocked(connectSpreadsheet).mockResolvedValue({
      ok: true,
      value: { status: 'linked', link: LINK, tabs: TABS }
    });

    renderHook(() => useLedgerConnection());

    await waitFor(() => expect(requestAccessToken).toHaveBeenCalled());
    expect(vi.mocked(requestAccessToken).mock.calls[0][0]).toMatchObject({ silent: true });
  });

  it('🔴 동의를 새로 받지 않는다 — consent 를 쓰면 새로고침마다 동의 화면이 뜬다', async () => {
    storeLink();
    vi.mocked(requestAccessToken).mockResolvedValue({ ok: true, value: { value: 'token', expiresAt: null } });
    vi.mocked(connectSpreadsheet).mockResolvedValue({
      ok: true,
      value: { status: 'linked', link: LINK, tabs: TABS }
    });

    renderHook(() => useLedgerConnection());

    await waitFor(() => expect(requestAccessToken).toHaveBeenCalled());
    expect(vi.mocked(requestAccessToken).mock.calls[0][0]).not.toMatchObject({ prompt: 'consent' });
  });
});

describe('🔴 실패는 조용하다 — 사용자는 아무것도 안 눌렀다', () => {
  it('⭐ 토큰을 못 받으면 배너 없이 연결 화면으로 남는다', async () => {
    storeLink();
    vi.mocked(requestAccessToken).mockResolvedValue({ ok: false, error: ledgerError('not-authorized') });

    const hook = renderHook(() => useLedgerConnection());

    await waitFor(() => expect(hook.result.current.state).toBe('disconnected'));
    /* 🔴 이 셋 중 하나라도 켜지면 사용자가 누르지도 않은 일로 경고를 보게 된다. */
    expect(hook.result.current.connectError).toBeNull();
    expect(hook.result.current.isPopupBlocked).toBe(false);
    expect(hook.result.current.isExpired).toBe(false);
  });

  it('⭐ 시트가 사라졌어도 조용하다 — 그 사유는 사용자가 연결을 시도할 때 말하는 편이 낫다', async () => {
    storeLink();
    vi.mocked(requestAccessToken).mockResolvedValue({ ok: true, value: { value: 'token', expiresAt: null } });
    vi.mocked(connectSpreadsheet).mockResolvedValue({ ok: false, error: ledgerError('permission-denied') });

    const hook = renderHook(() => useLedgerConnection());

    await waitFor(() => expect(hook.result.current.state).toBe('disconnected'));
    expect(hook.result.current.connectError).toBeNull();
  });

  it('열 지정이 필요한 시트면 되살리지 않는다 — 화면에 들어오자마자 매핑을 요구하지 않는다', async () => {
    storeLink();
    vi.mocked(requestAccessToken).mockResolvedValue({ ok: true, value: { value: 'token', expiresAt: null } });
    vi.mocked(connectSpreadsheet).mockResolvedValue({
      ok: true,
      value: { status: 'needs-mapping', spreadsheetId: 'sheet-1', sheetId: 0, sheetTitle: '내장부', tabs: TABS, columns: [] }
    } as never);

    const hook = renderHook(() => useLedgerConnection());

    await waitFor(() => expect(hook.result.current.state).toBe('disconnected'));
  });
});

describe('🔴 저장된 연결이 없으면 아무것도 부르지 않는다', () => {
  it('⭐ 처음 온 사용자에게 구글 창을 띄우려 하지 않는다', async () => {
    vi.mocked(requestAccessToken).mockResolvedValue({ ok: true, value: { value: 'token', expiresAt: null } });

    const hook = renderHook(() => useLedgerConnection());

    await waitFor(() => expect(hook.result.current.state).toBe('disconnected'));
    expect(requestAccessToken).not.toHaveBeenCalled();
  });
});
