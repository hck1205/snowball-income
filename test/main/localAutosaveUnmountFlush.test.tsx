import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { Provider } from 'jotai/react';
import { createStore } from 'jotai/vanilla';
import type { ReactNode } from 'react';
import type { PersistedAppStatePayload, PersistedAppStateReadResult } from '@/jotai';

/**
 * **회귀: 로컬 autosave(120ms)의 언마운트 유실.**
 *
 * 예전에는 autosave effect의 cleanup이 `clearTimeout`만 했다 — cleanup은 "의존성 변경(정상 디바운스)"과
 * "언마운트"를 구분하지 못하므로, 마지막 편집 후 120ms 안에 트리가 사라지면(라우트 이동 등) IndexedDB
 * 쓰기가 **아예 일어나지 않고** 편집이 유실됐다. 기존 이탈 flush(pagehide/visibilitychange)는 클라우드
 * 전용이라 이 구멍을 못 막는다.
 *
 * 여기서 고정하는 계약:
 *  1. 편집 후 120ms 이내 언마운트 → 로컬 저장이 **실제로 일어난다**(취소가 아니라 flush).
 *  2. 의존성 변경(연속 타건)은 **여전히 디바운스** — 중간값이 디스크에 써지지 않는다.
 *  3. 하이드레이션 미완료/실패면 언마운트 flush도 **일어나지 않는다**(화면 기본값이 원본을 덮는 경로 차단).
 *  4. 클라우드는 같은 flush에서 "예약 → 즉시 flush" 순서로 처리되고, 디바운스 경로(120ms)는 클라우드를
 *     flush하지 않는다(4초 디바운스 유지).
 */

const writeSpy = vi.fn(async (_payload: PersistedAppStatePayload) => {});
const readMock = vi.fn<() => Promise<PersistedAppStateReadResult>>();
const scheduleSpy = vi.fn();
const flushSpy = vi.fn(async () => {});

vi.mock('@/jotai', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/jotai')>();
  return {
    ...actual,
    writePersistedAppState: (payload: PersistedAppStatePayload) => writeSpy(payload),
    readPersistedAppState: () => readMock()
  };
});

// useCloudSync만 스파이로 대체(실 supabase·스케줄러 없이 예약/flush 호출만 관측). 나머지 export는 real 유지.
vi.mock('@/jotai/snowball/cloud', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/jotai/snowball/cloud')>();
  return {
    ...actual,
    useCloudSync: () => ({ scheduleCloudSave: scheduleSpy, flushCloudSave: flushSpy })
  };
});

vi.mock('@/shared/lib/analytics', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/lib/analytics')>();
  return { ...actual, track: vi.fn(), trackEvent: vi.fn(), setUserProperties: vi.fn() };
});

const { buildDefaultPayload, yieldFormAtom } = await import('@/jotai');
const { usePortfolioPersistence } = await import('@/pages/Main/hooks/persistence');

type Store = ReturnType<typeof createStore>;

const renderPersistence = () => {
  const store = createStore();
  const wrapper = ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>;
  return { ...renderHook(() => usePortfolioPersistence(), { wrapper }), store };
};

const editInitialInvestment = (store: Store, amount: number) => {
  act(() => {
    store.set(yieldFormAtom, (prev) => ({ ...prev, initialInvestment: amount }));
  });
};

const advance = (ms: number) => {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
};

/** 마운트 직후 1회 도는 초기 autosave를 소진하고 스파이를 비운다(이후 단정은 편집분만 본다). */
const drainInitialAutosave = () => {
  advance(200);
  writeSpy.mockClear();
  scheduleSpy.mockClear();
  flushSpy.mockClear();
};

const writtenAmounts = () =>
  writeSpy.mock.calls.map(([payload]) => payload.investmentSettings.initialInvestment);

beforeEach(() => {
  vi.useFakeTimers();
  writeSpy.mockClear();
  scheduleSpy.mockClear();
  flushSpy.mockClear();
  readMock.mockReset();
  readMock.mockResolvedValue({ ok: true, payload: buildDefaultPayload() });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

describe('usePortfolioPersistence — 로컬 autosave 언마운트 flush', () => {
  it('편집 후 120ms 이내에 언마운트해도 로컬 저장이 실제로 일어난다(취소가 아니라 flush)', () => {
    const { unmount, store } = renderPersistence();
    drainInitialAutosave();

    editInitialInvestment(store, 123_456);
    advance(100); // 아직 디바운스가 끝나지 않은 시점
    expect(writeSpy).not.toHaveBeenCalled();

    act(() => unmount());

    expect(writeSpy).toHaveBeenCalledTimes(1);
    expect(writtenAmounts()).toEqual([123_456]);
  });

  it('연속 타건은 여전히 디바운스된다 — 중간값은 디스크에 써지지 않는다', () => {
    const { store } = renderPersistence();
    drainInitialAutosave();

    editInitialInvestment(store, 100);
    advance(100);
    editInitialInvestment(store, 200);
    advance(100);
    editInitialInvestment(store, 300);
    advance(100);
    expect(writeSpy).not.toHaveBeenCalled();

    advance(20); // 마지막 편집으로부터 120ms

    expect(writeSpy).toHaveBeenCalledTimes(1);
    expect(writtenAmounts()).toEqual([300]);
  });

  it('대기 중인 저장이 없으면(이미 발화) 언마운트가 추가 저장을 만들지 않는다', () => {
    const { unmount, store } = renderPersistence();
    drainInitialAutosave();

    editInitialInvestment(store, 777);
    advance(120);
    expect(writeSpy).toHaveBeenCalledTimes(1);

    act(() => unmount());

    expect(writeSpy).toHaveBeenCalledTimes(1);
  });

  it('하이드레이션이 끝나지 않았으면 언마운트 flush도 하지 않는다', async () => {
    // MODE==='test'는 하이드레이션을 즉시 통과시키는 우회 경로다(usePortfolioPersistence). 실제 읽기
    // 경로를 타려면 MODE를 바꿔야 한다.
    vi.stubEnv('MODE', 'development');
    readMock.mockImplementation(() => new Promise<PersistedAppStateReadResult>(() => undefined)); // 영원히 대기

    const { unmount, store, result } = renderPersistence();
    await act(async () => undefined);
    expect(result.current.isPortfolioHydrated).toBe(false);

    editInitialInvestment(store, 999);
    advance(100);
    act(() => unmount());

    expect(writeSpy).not.toHaveBeenCalled();
    expect(flushSpy).not.toHaveBeenCalled();
  });

  it('하이드레이션 읽기에 실패했으면 언마운트 flush도 하지 않는다(원본 덮어쓰기 차단)', async () => {
    vi.stubEnv('MODE', 'development');
    readMock.mockResolvedValue({ ok: false, payload: buildDefaultPayload(), error: new Error('blocked') });

    const { unmount, store, result } = renderPersistence();
    await act(async () => undefined);
    expect(result.current.isPortfolioHydrated).toBe(true);

    editInitialInvestment(store, 999);
    advance(100);
    act(() => unmount());

    expect(writeSpy).not.toHaveBeenCalled();
    expect(flushSpy).not.toHaveBeenCalled();
  });
});

describe('usePortfolioPersistence — 언마운트 flush의 클라우드 경로', () => {
  it('언마운트 flush는 클라우드를 "예약 → 즉시 flush" 순서로 1회씩 처리한다', () => {
    const { unmount, store } = renderPersistence();
    drainInitialAutosave();

    editInitialInvestment(store, 555_000);
    act(() => unmount());

    expect(scheduleSpy).toHaveBeenCalledTimes(1);
    expect(flushSpy).toHaveBeenCalledTimes(1);
    // 예약이 flush보다 **먼저**여야 방금 편집분이 push 대상에 들어간다(순서가 뒤집히면 마지막 편집이 빠진다).
    expect(scheduleSpy.mock.invocationCallOrder[0]).toBeLessThan(flushSpy.mock.invocationCallOrder[0]);
  });

  it('디바운스 경로(120ms)는 클라우드를 flush하지 않는다 — 4초 디바운스 유지', () => {
    const { store } = renderPersistence();
    drainInitialAutosave();

    editInitialInvestment(store, 42_000);
    advance(120);

    expect(writeSpy).toHaveBeenCalledTimes(1);
    expect(scheduleSpy).toHaveBeenCalledTimes(1);
    expect(flushSpy).not.toHaveBeenCalled();
  });
});
