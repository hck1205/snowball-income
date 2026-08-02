import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import {
  LEDGER_LINK_STORAGE_KEY,
  connectSpreadsheet,
  getCachedAccessToken,
  openSpreadsheetPicker,
  readLedgerSnapshot,
  requestAccessToken
} from '@/shared/lib/googleSheets';
import type { ColumnMapping, LedgerSnapshot } from '@/shared/lib/googleSheets';
import { useLedgerConnection, useLedgerMonth } from '@/pages/Ledger/hooks';

/**
 * B-1 탭 전환의 **훅 계약** — 화면으로는 볼 수 없는 것들(AC1-2 · AC1-3 · AC1-4 · AC1-7 · AC1-8).
 *
 * 🔴 목킹 규율: 네트워크 어댑터만 목으로 바꾸고 **로컬 보관(`loadSheetLinks`/`saveSheetLink`)은
 * 진짜를 쓴다.** 하위 호환 왕복(AC1-8)은 실제 직렬화를 통과해야 의미가 있다 — 저장까지 목으로
 * 바꾸면 "저장했다고 가정한 것"을 검증하게 된다.
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

/** 🔴 탭 제목은 준PII 다. 저장 페이로드에 섞였는지 보려고 **다른 값과 겹치지 않는** 이름을 쓴다. */
const TAB_NOW = { sheetId: 0, title: '올해장부' };
const TAB_LAST = { sheetId: 7, title: '작년장부' };
const TABS = [TAB_NOW, TAB_LAST];

/** 기능 도입 **전** 형식의 저장 페이로드(탭 1개 시절). 이것이 그대로 살아남아야 한다(AC1-8). */
const LEGACY_STORED = [{ spreadsheetId: 'sheet-1', sheetId: 0, mapping: MAPPING, createdByApp: false }];

const snapshotOf = (id: string, sheetTitle: string): LedgerSnapshot => ({
  snapshotId: id,
  spreadsheetId: 'sheet-1',
  sheetTitle,
  lastDataRow: 1,
  entries: [],
  unreadableRows: []
});

const linked = (tab: { sheetId: number; title: string }) =>
  ({
    ok: true as const,
    value: {
      status: 'linked' as const,
      link: {
        spreadsheetId: 'sheet-1',
        sheetId: tab.sheetId,
        sheetTitle: tab.title,
        mapping: MAPPING,
        createdByApp: false
      },
      tabs: TABS
    }
  });

const needsMapping = (tab: { sheetId: number; title: string }) =>
  ({
    ok: true as const,
    value: {
      status: 'needs-mapping' as const,
      spreadsheetId: 'sheet-1',
      sheetId: tab.sheetId,
      sheetTitle: tab.title,
      headers: ['날짜', '구분', '금액', '분류', '메모'],
      tabs: TABS
    }
  });

const storedLinks = (): { spreadsheetId: string; sheetId: number }[] =>
  JSON.parse(window.localStorage.getItem(LEDGER_LINK_STORAGE_KEY) ?? '[]');

const mockedConnect = vi.mocked(connectSpreadsheet);
const mockedRead = vi.mocked(readLedgerSnapshot);

beforeEach(() => {
  vi.clearAllMocks();
  window.localStorage.clear();
  window.localStorage.setItem(LEDGER_LINK_STORAGE_KEY, JSON.stringify(LEGACY_STORED));

  vi.mocked(getCachedAccessToken).mockReturnValue({ value: 'token-1', expiresAt: null });
  vi.mocked(requestAccessToken).mockResolvedValue({ ok: true, value: { value: 'token-1', expiresAt: null } });
  vi.mocked(openSpreadsheetPicker).mockResolvedValue({ ok: true, value: { spreadsheetId: 'sheet-1' } });
  mockedRead.mockResolvedValue({ ok: true, value: snapshotOf('snap-1', TAB_NOW.title) });
});

/** 저장된 매핑으로 첫 탭에 연결된 상태까지 데려간다. */
const connectFirstTab = async () => {
  mockedConnect.mockResolvedValueOnce(linked(TAB_NOW));
  const hook = renderHook(() => useLedgerConnection());
  await act(async () => {
    hook.result.current.pickExistingSheet();
  });
  await waitFor(() => expect(hook.result.current.state).toBe('connected'));
  return hook;
};

describe('탭 목록은 메모리에만 산다', () => {
  it('연결하면 그 파일의 탭 목록을 쥐고 있다 (메타를 따로 다시 읽지 않는다)', async () => {
    const hook = await connectFirstTab();

    expect(hook.result.current.tabs).toEqual(TABS);
    expect(hook.result.current.link?.sheetId).toBe(0);
  });

  it('🔴 AC1-7 — 탭 제목이 localStorage 에 저장되지 않는다', async () => {
    await connectFirstTab();

    const raw = window.localStorage.getItem(LEDGER_LINK_STORAGE_KEY) ?? '';
    expect(raw).not.toContain(TAB_NOW.title);
    expect(raw).not.toContain(TAB_LAST.title);
  });
});

describe('AC1-2 저장된 매핑이 있는 탭 — 매핑 화면 없이 바로 열린다', () => {
  it('탭 id 를 실어 다시 연결하고, 그 탭의 스냅샷을 읽는다', async () => {
    // 두 탭 모두 매핑이 저장돼 있는 브라우저.
    window.localStorage.setItem(
      LEDGER_LINK_STORAGE_KEY,
      JSON.stringify([...LEGACY_STORED, { spreadsheetId: 'sheet-1', sheetId: 7, mapping: MAPPING, createdByApp: false }])
    );
    const hook = await connectFirstTab();

    mockedConnect.mockResolvedValueOnce(linked(TAB_LAST));
    mockedRead.mockResolvedValue({ ok: true, value: snapshotOf('snap-2', TAB_LAST.title) });

    await act(async () => {
      hook.result.current.switchTab(7);
    });
    await waitFor(() => expect(hook.result.current.link?.sheetId).toBe(7));

    // 🔴 이 단정이 이 트랙의 심장이다 — sheetId 를 안 넘기면 데이터 계층이 **첫 탭**을 연다.
    expect(mockedConnect).toHaveBeenLastCalledWith(
      { accessToken: 'token-1' },
      { spreadsheetId: 'sheet-1', sheetId: 7, mapping: MAPPING }
    );
    expect(hook.result.current.state).toBe('connected');
    expect(hook.result.current.snapshot?.snapshotId).toBe('snap-2');
  });

  it('같은 탭을 다시 고르면 아무 요청도 하지 않는다 (429 예산)', async () => {
    const hook = await connectFirstTab();
    mockedConnect.mockClear();

    await act(async () => {
      hook.result.current.switchTab(0);
    });

    expect(mockedConnect).not.toHaveBeenCalled();
  });
});

describe('AC1-3 · AC1-8 저장된 매핑이 없는 탭 — 매핑을 거쳐 항목이 늘어난다', () => {
  it('매핑 화면을 거쳐 연결되고, 기존 탭의 저장 항목은 그대로 남는다', async () => {
    const hook = await connectFirstTab();

    // 매핑이 없는 탭 → 기존 매핑 세션을 그대로 재사용한다.
    mockedConnect.mockResolvedValueOnce(needsMapping(TAB_LAST));
    await act(async () => {
      hook.result.current.switchTab(7);
    });
    await waitFor(() => expect(hook.result.current.state).toBe('mapping'));
    expect(mockedConnect).toHaveBeenLastCalledWith(
      { accessToken: 'token-1' },
      { spreadsheetId: 'sheet-1', sheetId: 7, mapping: undefined }
    );
    expect(hook.result.current.mapping?.sheetName).toBe(TAB_LAST.title);

    // 확정 → 그 탭이 연결되고 저장 항목이 **추가**된다.
    mockedConnect.mockResolvedValueOnce(linked(TAB_LAST));
    mockedRead.mockResolvedValue({ ok: true, value: snapshotOf('snap-2', TAB_LAST.title) });
    await act(async () => {
      hook.result.current.confirmMapping();
    });
    await waitFor(() => expect(hook.result.current.state).toBe('connected'));

    expect(storedLinks()).toEqual([
      // 🔴 AC1-8 — 기능 도입 전 형식의 항목이 유실·변형 없이 그대로 남는다.
      { spreadsheetId: 'sheet-1', sheetId: 0, mapping: MAPPING, createdByApp: false },
      { spreadsheetId: 'sheet-1', sheetId: 7, mapping: MAPPING, createdByApp: false }
    ]);
  });

  it('🔴 AC1-7 — 탭을 오간 뒤에도 저장 페이로드에 탭 제목이 없다', async () => {
    const hook = await connectFirstTab();
    mockedConnect.mockResolvedValueOnce(linked(TAB_LAST));
    mockedRead.mockResolvedValue({ ok: true, value: snapshotOf('snap-2', TAB_LAST.title) });

    await act(async () => {
      hook.result.current.switchTab(7);
    });
    await waitFor(() => expect(hook.result.current.link?.sheetId).toBe(7));

    const raw = window.localStorage.getItem(LEDGER_LINK_STORAGE_KEY) ?? '';
    expect(raw).not.toContain(TAB_LAST.title);
    expect(JSON.parse(raw).flatMap((item: Record<string, unknown>) => Object.keys(item))).toEqual([
      'spreadsheetId',
      'sheetId',
      'mapping',
      'createdByApp',
      'spreadsheetId',
      'sheetId',
      'mapping',
      'createdByApp'
    ]);
  });
});

describe('AC1-4 탭을 바꿔도 보고 있던 달은 그대로다', () => {
  it('스냅샷이 통째로 바뀌어도 월 커서를 유지한다 (두 탭에서 같은 달을 비교한다)', () => {
    const now = new Date('2026-08-03T09:30:00+09:00');
    const hook = renderHook(({ snapshot }: { snapshot: LedgerSnapshot }) => useLedgerMonth(snapshot, now), {
      initialProps: { snapshot: snapshotOf('snap-1', TAB_NOW.title) }
    });

    act(() => {
      hook.result.current.goPrev();
    });
    expect(hook.result.current.monthLabel).toBe('2026년 7월');

    // 탭 전환 = 새 스냅샷. 커서는 사용자가 정한 것이라 여기서 되돌리지 않는다.
    hook.rerender({ snapshot: snapshotOf('snap-2', TAB_LAST.title) });

    expect(hook.result.current.monthLabel).toBe('2026년 7월');
  });
});

describe('전환 중 상태', () => {
  it('전환이 끝날 때까지 isTabSwitching 이 켜져 있다 (그동안 선택은 비활성이다)', async () => {
    const hook = await connectFirstTab();

    let release: (() => void) | null = null;
    mockedConnect.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          release = () => resolve(linked(TAB_LAST));
        })
    );

    act(() => {
      hook.result.current.switchTab(7);
    });
    await waitFor(() => expect(hook.result.current.isTabSwitching).toBe(true));

    await act(async () => {
      release?.();
    });
    await waitFor(() => expect(hook.result.current.isTabSwitching).toBe(false));
  });
});
