import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { Provider } from 'jotai/react';
import { createStore } from 'jotai/vanilla';
import type { ReactNode } from 'react';
import type { PersistedAppStatePayload, PersistedAppStateReadResult } from '@/jotai';
import type { TickerProfile } from '@/shared/types/snowball';

/**
 * 🔴 **첫 방문 기본 시나리오(프리필)는 저장되지 않는다.**
 *
 * 프리필은 앱이 대신 채운 화면이지 사용자가 만든 데이터가 아니다. 한 번이라도 IndexedDB·클라우드에
 * 흘러가면 ①다음 방문에 "내가 만든 적 없는 포트폴리오"가 복원되고 ②로그인 사용자라면 그것이
 * 다른 기기의 워크스페이스까지 덮는다. 화면만 보면 정상이라 **눈으로는 절대 못 잡는 회귀**다.
 *
 * 여기서 못 박는 계약:
 *  1. 저장된 워크스페이스가 없으면 프리필을 **요청**한다(`requested`).
 *  2. `requested`·`applied` 동안 로컬 write 도 클라우드 예약도 **0회**다.
 *  3. 클라우드 동기화가 보는 payload(`buildPayload`)는 **하이드레이션 당시의 것**이다(프리필이 안 샌다).
 *  4. 사용자가 의미 있는 값을 바꾸면 **승격** — 표식이 내려가고, 그 순간부터 정상 저장되며,
 *     저장된 내용은 **얼어붙은 payload 가 아니라 방금 바뀐 값**이다.
 *  5. 저장된 포트폴리오가 있으면 프리필을 요청하지 않는다(복원이 우선).
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

const {
  buildDefaultPayload,
  includedTickerIdsAtom,
  scenarioPrefillAtom,
  tickerProfilesAtom,
  weightByTickerIdAtom,
  yieldFormAtom
} = await import('@/jotai');
const { usePortfolioPersistence } = await import('@/pages/Main/hooks/persistence');
const { DEFAULT_PREFILL_PRESET_ID } = await import('@/pages/Main/utils');

type Store = ReturnType<typeof createStore>;

const PREFILLED_PROFILE: TickerProfile = {
  id: 'prefill-schd',
  ticker: 'SCHD',
  name: '',
  initialPrice: 100,
  dividendYield: 3.5,
  dividendGrowth: 6,
  expectedTotalReturn: 9.5,
  frequency: 'quarterly'
};

const renderPersistence = (store: Store) => {
  const wrapper = ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>;
  return renderHook(() => usePortfolioPersistence(), { wrapper });
};

const advance = (ms: number) => {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
};

/** 우패널(`usePortfolioPrefill`)이 하는 일 = 프리셋 커밋 + `applied` 전이. **같은 배치**여야 한다. */
const applyPrefillLikeRightPanel = (store: Store) => {
  act(() => {
    store.set(tickerProfilesAtom, [PREFILLED_PROFILE]);
    store.set(includedTickerIdsAtom, [PREFILLED_PROFILE.id]);
    store.set(weightByTickerIdAtom, { [PREFILLED_PROFILE.id]: 100 });
    store.set(yieldFormAtom, (prev) => ({ ...prev, monthlyContribution: 1_500_000, durationYears: 12 }));
    store.set(scenarioPrefillAtom, { presetId: DEFAULT_PREFILL_PRESET_ID, status: 'applied' });
  });
};

const payloadWithPortfolio = (): PersistedAppStatePayload => {
  const base = buildDefaultPayload();
  return {
    ...base,
    scenarios: base.scenarios.map((scenario) => ({
      ...scenario,
      portfolio: {
        ...scenario.portfolio,
        tickerProfiles: [{ ...PREFILLED_PROFILE, id: 'saved-1' }],
        includedTickerIds: ['saved-1']
      }
    }))
  };
};

beforeEach(() => {
  vi.useFakeTimers();
  writeSpy.mockClear();
  scheduleSpy.mockClear();
  flushSpy.mockClear();
  readMock.mockReset();
  readMock.mockResolvedValue({ ok: true, payload: buildDefaultPayload() });
  // MODE==='test' 는 하이드레이션을 건너뛰는 우회 경로다 — 실제 읽기 경로를 타야 프리필 판정이 돈다.
  vi.stubEnv('MODE', 'development');
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

describe('첫 방문 기본 시나리오 — 저장되지 않는다', () => {
  it('저장된 워크스페이스가 없으면 프리필을 요청한다', async () => {
    const store = createStore();
    renderPersistence(store);
    await act(async () => undefined);

    expect(store.get(scenarioPrefillAtom)).toEqual({
      presetId: DEFAULT_PREFILL_PRESET_ID,
      status: 'requested'
    });
  });

  it('저장된 포트폴리오가 있으면 프리필을 요청하지 않는다(복원이 우선)', async () => {
    readMock.mockResolvedValue({ ok: true, payload: payloadWithPortfolio() });

    const store = createStore();
    renderPersistence(store);
    await act(async () => undefined);

    expect(store.get(scenarioPrefillAtom)).toBeNull();
  });

  it('프리필이 화면에 붙어 있는 동안 로컬 저장도 클라우드 예약도 일어나지 않는다', async () => {
    const store = createStore();
    renderPersistence(store);
    await act(async () => undefined);

    applyPrefillLikeRightPanel(store);
    advance(5_000); // 로컬 120ms · 클라우드 4s 를 모두 넘긴다

    expect(writeSpy).not.toHaveBeenCalled();
    expect(scheduleSpy).not.toHaveBeenCalled();
  });

  it('프리필 중 언마운트해도(flush 경로) 저장되지 않는다', async () => {
    const store = createStore();
    const { unmount } = renderPersistence(store);
    await act(async () => undefined);

    applyPrefillLikeRightPanel(store);
    act(() => unmount());

    expect(writeSpy).not.toHaveBeenCalled();
    expect(scheduleSpy).not.toHaveBeenCalled();
  });

  it('클라우드 동기화가 보는 payload 는 하이드레이션 당시의 것이다 — 프리필이 클라우드로 새지 않는다', async () => {
    const store = createStore();
    const { result } = renderPersistence(store);
    await act(async () => undefined);

    applyPrefillLikeRightPanel(store);

    const payload = result.current.buildPayload();
    const tickers = payload.scenarios.flatMap((scenario) => scenario.portfolio.tickerProfiles);
    expect(tickers).toEqual([]);
  });
});

describe('첫 방문 기본 시나리오 — 사용자가 건드리면 승격된다', () => {
  it('의미 있는 값이 바뀌면 표식이 내려가고 정상 저장된다(그리고 바뀐 값이 저장된다)', async () => {
    const store = createStore();
    renderPersistence(store);
    await act(async () => undefined);

    applyPrefillLikeRightPanel(store);
    advance(5_000);
    expect(writeSpy).not.toHaveBeenCalled();

    // 인라인 "빠른 조정" 슬라이더가 커밋할 때와 같은 경로(폼 값 변경).
    act(() => {
      store.set(yieldFormAtom, (prev) => ({ ...prev, monthlyContribution: 3_000_000 }));
    });
    advance(200);

    expect(store.get(scenarioPrefillAtom)).toBeNull();
    expect(writeSpy).toHaveBeenCalledTimes(1);

    const [saved] = writeSpy.mock.calls[0];
    expect(saved.investmentSettings.monthlyContribution).toBe(3_000_000);
    // 얼어붙은(비어 있던) payload 가 아니라 화면의 워크스페이스가 저장돼야 한다.
    expect(saved.scenarios.flatMap((scenario) => scenario.portfolio.tickerProfiles)).toHaveLength(1);
  });

  it('뷰 토글만 바꾸면 승격되지 않는다 — 저장할 사용자 데이터가 아직 없다', async () => {
    const store = createStore();
    renderPersistence(store);
    await act(async () => undefined);

    applyPrefillLikeRightPanel(store);
    advance(200);

    const { isResultCompactAtom } = await import('@/jotai');
    act(() => {
      store.set(isResultCompactAtom, true);
    });
    advance(500);

    expect(store.get(scenarioPrefillAtom)).not.toBeNull();
    expect(writeSpy).not.toHaveBeenCalled();
  });
});
