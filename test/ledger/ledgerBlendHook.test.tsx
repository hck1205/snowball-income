import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import {
  LEDGER_LINK_STORAGE_KEY,
  fetchSpreadsheetMeta,
  loadSheetLinks,
  readLedgerSnapshot
} from '@/shared/lib/googleSheets';
import type { ColumnMapping, LedgerEntry, LedgerSnapshot, StoredSheetLink } from '@/shared/lib/googleSheets';
import { tabSwitchBlockedReason } from '@/pages/Ledger/components';
import { useLedgerBlend } from '@/pages/Ledger/hooks';
import type { LedgerConnection } from '@/pages/Ledger/hooks';
import { LEDGER_BLEND_STORAGE_KEY, writeLedgerBlendConfig } from '@/pages/Ledger/utils';
import type { LedgerMonthCursor } from '@/pages/Ledger/utils';

/**
 * B-3 블렌딩의 **훅 계약** — 화면으로는 볼 수 없는 것들(AC3-1 · AC3-2 · AC3-7 · AC3-8 + 429 예산).
 *
 * 🔴 목킹 규율은 B-1 훅 테스트와 같다: **네트워크 어댑터만** 목으로 바꾸고 블렌딩 구성의 저장·복원은
 * 진짜 `localStorage` 를 통과시킨다. 왕복(AC3-8)은 실제 직렬화를 지나야 의미가 있다.
 */

vi.mock('@/shared/lib/googleSheets', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/lib/googleSheets')>();
  return { ...actual, loadSheetLinks: vi.fn(), readLedgerSnapshot: vi.fn(), fetchSpreadsheetMeta: vi.fn() };
});

const MAPPING: ColumnMapping = { date: 0, kind: 1, amount: 2, category: 3, memo: 4 };

const TAB_MINE = { sheetId: 0, title: '내탭' };
const TAB_PARTNER = { sheetId: 7, title: '배우자탭' };

const LINK_MINE: StoredSheetLink = {
  spreadsheetId: 'sheet-1',
  sheetId: 0,
  mapping: MAPPING,
  createdByApp: false
};
const LINK_PARTNER: StoredSheetLink = {
  spreadsheetId: 'sheet-1',
  sheetId: 7,
  mapping: MAPPING,
  createdByApp: false
};

const CURSOR: LedgerMonthCursor = { year: 2026, month: 8 };

const entry = (rowNumber: number, date: string, amount: number): LedgerEntry => ({
  ref: { snapshotId: `snap-${rowNumber}`, rowNumber },
  date,
  kind: 'expense',
  amount,
  category: '식비',
  seen: {}
});

const snapshotOf = (id: string, entries: readonly LedgerEntry[]): LedgerSnapshot => ({
  snapshotId: id,
  spreadsheetId: 'sheet-1',
  sheetTitle: '내탭',
  lastDataRow: entries.length + 1,
  entries,
  unreadableRows: []
});

const connectionOf = (overrides: Partial<LedgerConnection> = {}): LedgerConnection => ({
  state: 'connected',
  phase: 'idle',
  showCheckingSkeleton: false,
  link: { spreadsheetId: 'sheet-1', sheetId: 0, sheetTitle: '내탭', mapping: MAPPING, createdByApp: false },
  tabs: [TAB_MINE, TAB_PARTNER],
  isTabSwitching: false,
  snapshot: null,
  readAt: null,
  isFirstLoad: false,
  isRefetching: false,
  isExpired: false,
  isReconnecting: false,
  isConflict: false,
  isPopupBlocked: false,
  showCreatedNotice: false,
  connectError: null,
  mapping: null,
  readContext: () => ({ accessToken: 'token' }),
  applyError: vi.fn(),
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

const seedConfig = () =>
  writeLedgerBlendConfig({
    a: { spreadsheetId: 'sheet-1', sheetId: 0, label: '민수' },
    b: { spreadsheetId: 'sheet-1', sheetId: 7, label: '지연' }
  });

const renderBlend = (connection: LedgerConnection = connectionOf(), openBlockedReason: string | null = null) =>
  renderHook(
    ({ cursor }: { cursor: LedgerMonthCursor }) => useLedgerBlend({ connection, cursor, openBlockedReason }),
    { initialProps: { cursor: CURSOR } }
  );

beforeEach(() => {
  window.localStorage.clear();
  vi.mocked(loadSheetLinks).mockReturnValue([LINK_MINE, LINK_PARTNER]);
  vi.mocked(fetchSpreadsheetMeta).mockResolvedValue({
    ok: true,
    value: { spreadsheetId: 'sheet-1', tabs: [TAB_MINE, TAB_PARTNER] }
  });
  vi.mocked(readLedgerSnapshot).mockImplementation(async (_context, link) =>
    link.sheetId === 0
      ? { ok: true, value: snapshotOf('snap-a', [entry(2, '2026-08-03', 12000)]) }
      : { ok: true, value: snapshotOf('snap-b', [entry(3, '2026-08-01', 5000)]) }
  );
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('AC3-1 — 진입점은 저장된 링크가 2개 이상일 때만 존재한다', () => {
  it('링크가 1개면 블렌딩을 쓸 수 없다', () => {
    vi.mocked(loadSheetLinks).mockReturnValue([LINK_MINE]);
    const { result } = renderBlend();
    expect(result.current.model.isAvailable).toBe(false);
  });

  it('링크가 2개면 쓸 수 있다', () => {
    const { result } = renderBlend();
    expect(result.current.model.isAvailable).toBe(true);
  });

  it('구성이 없으면 켜지지 않는다 — 고를 것을 먼저 고르게 한다', () => {
    const { result } = renderBlend();
    act(() => result.current.toggle(true));
    expect(result.current.model.isOn).toBe(false);
  });
});

describe('AC3-7 — 가리키던 링크가 사라지면 구성 전체가 무효다', () => {
  /**
   * 🔴 이 케이스가 `resolveLedgerBlendConfig` 를 건너뛴 구현을 잡는 감시자다. 저장된 구성만 읽고
   * 링크 목록과 대조하지 않으면 아래 단정이 초록이 되고, "우리 가계"가 조용히 한 사람 것이 된다.
   */
  it('한쪽 링크가 목록에서 사라지면 구성이 없는 것으로 읽힌다', () => {
    seedConfig();
    vi.mocked(loadSheetLinks).mockReturnValue([LINK_MINE]);
    const { result } = renderBlend();
    expect(result.current.model.hasConfig).toBe(false);
    expect(result.current.model.isOn).toBe(false);
  });

  it('두 링크가 모두 남아 있으면 구성이 복원된다', () => {
    seedConfig();
    const { result } = renderBlend();
    expect(result.current.model.hasConfig).toBe(true);
  });
});

describe('AC3-8 — 왕복 복원과 불량 페이로드', () => {
  it('설정에서 고른 구성이 다시 열었을 때 라벨까지 그대로 복원된다', async () => {
    const first = renderBlend();
    act(() => first.result.current.toggleSetup(true));
    act(() => {
      first.result.current.changeSource('a', 'sheet-1:0');
      first.result.current.changeSource('b', 'sheet-1:7');
      first.result.current.changeLabel('a', '민수');
      first.result.current.changeLabel('b', '지연');
    });
    act(() => first.result.current.submitSetup());

    await waitFor(() => expect(first.result.current.model.isOn).toBe(true));
    first.unmount();

    const second = renderBlend();
    expect(second.result.current.model.hasConfig).toBe(true);
    act(() => second.result.current.toggleSetup(true));
    expect(second.result.current.model.setup?.a.label).toBe('민수');
    expect(second.result.current.model.setup?.b.label).toBe('지연');
  });

  it('불량 페이로드는 조용히 무시되고 블렌딩이 꺼진 상태로 남는다', () => {
    window.localStorage.setItem(LEDGER_BLEND_STORAGE_KEY, '{"hello":"world"}');
    const { result } = renderBlend();
    expect(result.current.model.hasConfig).toBe(false);
  });

  it('같은 링크를 두 번 고르면 제출이 막히고 저장도 일어나지 않는다', () => {
    const { result } = renderBlend();
    act(() => result.current.toggleSetup(true));
    act(() => {
      result.current.changeSource('a', 'sheet-1:0');
      result.current.changeSource('b', 'sheet-1:0');
    });
    expect(result.current.model.setup?.blockedReason).not.toBeNull();

    act(() => result.current.submitSetup());
    expect(window.localStorage.getItem(LEDGER_BLEND_STORAGE_KEY)).toBeNull();
    expect(result.current.model.isOn).toBe(false);
  });
});

describe('AC3-2 — 링크 저장소는 블렌딩 전후로 한 글자도 바뀌지 않는다', () => {
  it('구성 저장·해제가 snowball:ledger:links 를 건드리지 않는다', async () => {
    const before = JSON.stringify([LINK_MINE, LINK_PARTNER]);
    window.localStorage.setItem(LEDGER_LINK_STORAGE_KEY, before);

    const { result } = renderBlend();
    act(() => result.current.toggleSetup(true));
    act(() => {
      result.current.changeSource('a', 'sheet-1:0');
      result.current.changeSource('b', 'sheet-1:7');
    });
    act(() => result.current.submitSetup());
    /* 제출은 곧바로 블렌딩을 켠다 — 읽기가 끝날 때까지 기다려야 뒤늦은 상태 갱신이 새지 않는다. */
    await waitFor(() => expect(result.current.model.model?.body.kind).toBe('ready'));
    expect(window.localStorage.getItem(LEDGER_BLEND_STORAGE_KEY)).not.toBeNull();
    expect(window.localStorage.getItem(LEDGER_LINK_STORAGE_KEY)).toBe(before);

    act(() => result.current.clear());
    expect(window.localStorage.getItem(LEDGER_BLEND_STORAGE_KEY)).toBeNull();
    expect(window.localStorage.getItem(LEDGER_LINK_STORAGE_KEY)).toBe(before);
  });
});

describe('429 예산 — 진입 시 스냅샷 2회, 그 뒤로는 읽지 않는다', () => {
  it('블렌딩을 켜면 두 출처를 각각 한 번씩만 읽는다 (탭 제목은 이미 메모리에 있어 메타 요청이 0이다)', async () => {
    seedConfig();
    const { result } = renderBlend();

    act(() => result.current.toggle(true));
    await waitFor(() => expect(result.current.model.model?.body.kind).toBe('ready'));

    expect(vi.mocked(readLedgerSnapshot)).toHaveBeenCalledTimes(2);
    expect(vi.mocked(fetchSpreadsheetMeta)).not.toHaveBeenCalled();
  });

  it('달을 옮겨도 시트를 다시 읽지 않는다 — 월 필터는 메모리에서 한다', async () => {
    seedConfig();
    const { result, rerender } = renderBlend();

    act(() => result.current.toggle(true));
    await waitFor(() => expect(result.current.model.model?.body.kind).toBe('ready'));

    rerender({ cursor: { year: 2026, month: 7 } });
    expect(vi.mocked(readLedgerSnapshot)).toHaveBeenCalledTimes(2);

    const body = result.current.model.model?.body;
    // 7월에는 두 출처 모두 기록이 없다 — 갈래는 그대로 `ready` 이고 행만 비어 있다.
    expect(body?.kind === 'ready' ? body.rows.length : -1).toBe(0);
  });
});

describe('AC3-5 — 반쪽 실패는 합계를 만들지 않는다', () => {
  it('한쪽 읽기가 실패하면 partial 갈래가 되고 합산 필드가 존재하지 않는다', async () => {
    seedConfig();
    vi.mocked(readLedgerSnapshot).mockImplementation(async (_context, link) =>
      link.sheetId === 0
        ? { ok: true, value: snapshotOf('snap-a', [entry(2, '2026-08-03', 12000)]) }
        : { ok: false, error: { code: 'network-error', message: '', recovery: 'retry' } }
    );

    const { result } = renderBlend();
    act(() => result.current.toggle(true));
    await waitFor(() => expect(result.current.model.model?.body.kind).toBe('partial'));

    const body = result.current.model.model?.body;
    expect(body === undefined ? true : 'summary' in body).toBe(false);
  });
});

describe('AC3-6 — "이 가계부에서 열기"는 단일 뷰로 전환한다', () => {
  it('다른 탭이면 블렌딩을 끄고 그 탭으로 전환한다', async () => {
    seedConfig();
    const connection = connectionOf();
    const { result } = renderBlend(connection);

    act(() => result.current.toggle(true));
    await waitFor(() => expect(result.current.model.isOn).toBe(true));

    act(() => result.current.openSource('b'));
    expect(result.current.model.isOn).toBe(false);
    expect(connection.switchTab).toHaveBeenCalledWith(7);
  });

  it('이미 보고 있는 탭이면 전환하지 않는다 (같은 탭 재연결은 읽기만 낭비한다)', async () => {
    seedConfig();
    const connection = connectionOf();
    const { result } = renderBlend(connection);

    act(() => result.current.toggle(true));
    await waitFor(() => expect(result.current.model.isOn).toBe(true));

    act(() => result.current.openSource('a'));
    expect(result.current.model.isOn).toBe(false);
    expect(connection.switchTab).not.toHaveBeenCalled();
  });

  it('두 출처가 지금 연결된 파일의 탭이면 둘 다 열 수 있다', () => {
    seedConfig();
    const { result } = renderBlend();
    expect(result.current.model.openableSources).toEqual(['a', 'b']);
  });
});

/**
 * 🔴 **블렌딩이 탭 전환 차단의 우회로가 되지 않는다** (2026-08-02 리뷰가 잡은 Blocking).
 *
 * 사고 경로: 항목 추가 실패 → 폼을 닫아 **대기열** 생성 → 탭 피커는 비활성이지만 블렌딩은 열린다 →
 * 블렌딩 행의 "이 가계부에서 열기" 가 `switchTab` 을 불러 연결이 다른 탭으로 바뀐다 → 대기열
 * "다시 시도"가 **그 탭에 행을 추가**한다. 추가에는 행 참조가 없어 `guardRowRef` 가 못 막는다.
 *
 * 🔴 차단 조건은 탭 피커와 **같은 단일 출처**(`tabSwitchBlockedReason`)를 그대로 통과시킨다 —
 * 여기서 문자열을 지어내면 두 표면이 다른 규칙으로 갈린다.
 */
describe('저장하지 못한 기록이 남아 있으면 블렌딩으로도 탭을 바꿀 수 없다', () => {
  const queueBlocked = () => tabSwitchBlockedReason({ isFormOpen: false, hasUnsavedQueue: true });

  it('대기열이 있으면 "이 가계부에서 열기"가 탭을 바꾸지 않는다', async () => {
    seedConfig();
    const connection = connectionOf();
    const { result } = renderBlend(connection, queueBlocked());

    act(() => result.current.toggle(true));
    await waitFor(() => expect(result.current.model.isOn).toBe(true));

    act(() => result.current.openSource('b'));

    // 🔴 이 단정이 이 수정의 심장이다 — 가드를 지우면 `switchTab(7)` 이 불린다.
    expect(connection.switchTab).not.toHaveBeenCalled();
    // 막혔을 때는 블렌딩을 끄지도 않는다(사용자가 아무 데도 못 간 채 화면만 바뀌면 안 된다).
    expect(result.current.model.isOn).toBe(true);
  });

  it('그 사유가 화면 모델에 실려 나간다 (사유 없는 회색 버튼 금지)', () => {
    seedConfig();
    const { result } = renderBlend(connectionOf(), queueBlocked());
    expect(result.current.model.openBlockedReason).toBe(queueBlocked());
  });

  it('폼이 열려 있을 때도 같은 조건으로 막힌다', async () => {
    seedConfig();
    const connection = connectionOf();
    const { result } = renderBlend(connection, tabSwitchBlockedReason({ isFormOpen: true, hasUnsavedQueue: false }));

    act(() => result.current.toggle(true));
    await waitFor(() => expect(result.current.model.isOn).toBe(true));

    act(() => result.current.openSource('b'));
    expect(connection.switchTab).not.toHaveBeenCalled();
  });

  it('대기열이 없으면 그대로 열린다 (막는 조건이 없을 때까지 막지 않는다)', async () => {
    seedConfig();
    const connection = connectionOf();
    const { result } = renderBlend(connection, tabSwitchBlockedReason({ isFormOpen: false, hasUnsavedQueue: false }));

    act(() => result.current.toggle(true));
    await waitFor(() => expect(result.current.model.isOn).toBe(true));

    act(() => result.current.openSource('b'));
    expect(connection.switchTab).toHaveBeenCalledWith(7);
  });
});
