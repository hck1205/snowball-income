import { describe, expect, it, vi, beforeEach } from 'vitest';
import { act, render, waitFor } from '@testing-library/react';
import { Provider } from 'jotai/react';
import { createStore } from 'jotai/vanilla';
import {
  cloudConflictAtom,
  cloudSyncStateAtom,
  syncCloudWorkspaceAtSessionStart,
  type CloudAutosaveRead,
  type LocalAutosaveRead
} from '@/jotai/snowball/cloud';
import { buildDefaultPayload, isSameMeaningfulPayload, type PersistedAppStatePayload } from '@/jotai';
import type { PersistedScenarioState, PersistedInvestmentSettings } from '@/jotai/snowball/types';
import type { TickerProfile } from '@/shared/types/snowball';
import { useCloudWorkspaceSync, type CloudReconciliationApi } from '@/pages/Main/hooks';

/**
 * **회귀(프로덕션 버그)**: 로그인 상태에서 시나리오 탭을 지웠더니 "이 기기와 클라우드에 저장된 내용이
 * 다릅니다" 모달이 **새로고침마다 반복**되던 사고.
 *
 * 원인은 화해가 **세션 시작 스냅샷**을 디바이스 정본으로 쓴 것이었다. 모달은 세션 시작에 뜨지만 사용자는
 * 그 뒤에도 편집한다(탭 삭제). "이 기기 데이터로 맞추기"가 지우기 **이전** 스냅샷을 클라우드에 올리고
 * 로컬은 지워진 상태로 남아, 두 미러가 매번 다시 어긋났다 → 다음 세션에 같은 충돌 재감지(영구 루프).
 *
 * 여기서 고정하는 계약:
 *  1. 화해는 **지금 화면의 워크스페이스**(라이브)를 디바이스 정본으로 쓴다.
 *  2. 화해 후 **로컬·클라우드 두 미러가 같은 payload**가 되어, 다음 세션 시작이 no-op으로 수렴한다.
 *  3. 화해 IO 실패는 조용히 삼키지 않는다(hasResolveFailed) — 모달이 열린 채 재시도할 수 있다.
 */

const DEFAULT_SETTINGS: PersistedInvestmentSettings = buildDefaultPayload().investmentSettings;

const makeScenario = (id: string, ticker: string): PersistedScenarioState => {
  const profile: TickerProfile = {
    id: `t-${ticker}`,
    ticker,
    name: ticker,
    initialPrice: 100,
    dividendYield: 3,
    dividendGrowth: 0,
    expectedTotalReturn: 3,
    frequency: 'quarterly'
  };
  return {
    id,
    name: `탭-${ticker}`,
    portfolio: {
      tickerProfiles: [profile],
      includedTickerIds: [profile.id],
      weightByTickerId: {},
      fixedByTickerId: {},
      selectedTickerId: null
    },
    investmentSettings: DEFAULT_SETTINGS
  };
};

const makePayload = (scenarios: PersistedScenarioState[]): PersistedAppStatePayload => ({
  portfolio: scenarios[0].portfolio,
  investmentSettings: scenarios[0].investmentSettings,
  scenarios,
  activeScenarioId: scenarios[0].id
});

// ── 가짜 저장소(로컬 IndexedDB 슬롯 / 클라우드 슬롯) ─────────────────────────────
const store = {
  local: null as PersistedAppStatePayload | null,
  localUpdatedAt: undefined as number | undefined,
  cloud: null as PersistedAppStatePayload | null,
  cloudSavedAt: undefined as number | undefined,
  pushShouldFail: false
};

const writeLocalSpy = vi.fn(async (payload: PersistedAppStatePayload) => {
  store.local = payload;
  store.localUpdatedAt = 5_000;
});

vi.mock('@/jotai', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/jotai')>();
  return { ...actual, writePersistedAppState: (payload: PersistedAppStatePayload) => writeLocalSpy(payload) };
});

vi.mock('@/jotai/community', () => ({
  useIsLoggedInAtomValue: () => true,
  useSessionAtomValue: () => ({ user: { id: 'user-1' } })
}));

vi.mock('@/jotai/snowball/cloud', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/jotai/snowball/cloud')>();
  return {
    ...actual,
    useCloudSavedStates: () => ({
      pullAutosave: async (): Promise<CloudAutosaveRead> =>
        store.cloud ? { payload: store.cloud, savedAt: store.cloudSavedAt } : null,
      pushAutosave: async (payload: PersistedAppStatePayload, savedAt: number): Promise<void> => {
        if (store.pushShouldFail) throw new Error('network down');
        store.cloud = payload;
        store.cloudSavedAt = savedAt;
      }
    })
  };
});

vi.mock('@/shared/lib/analytics', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/lib/analytics')>();
  return { ...actual, track: vi.fn(), trackEvent: vi.fn(), readAndClearLoginSource: () => null };
});

/** 화면(앱)의 라이브 워크스페이스 — 사용자의 편집(탭 삭제)을 여기 반영한다. */
let liveWorkspace: PersistedAppStatePayload;
let api: CloudReconciliationApi;

function Probe() {
  api = useCloudWorkspaceSync({
    isPortfolioHydrated: true,
    buildPayload: () => liveWorkspace,
    applyPersistedPayload: (payload) => {
      liveWorkspace = payload;
    },
    readLocalAutosave: async (): Promise<LocalAutosaveRead> =>
      store.local ? { status: 'ok', payload: store.local, updatedAt: store.localUpdatedAt } : { status: 'ok', payload: null, updatedAt: undefined }
  });
  return null;
}

/** 다음 세션 시작(새로고침)을 순수 엔진으로 재현해 충돌이 다시 뜨는지 본다. */
const nextSessionEvents = async (): Promise<string[]> => {
  const events: string[] = [];
  await syncCloudWorkspaceAtSessionStart({
    pullCloudAutosave: async () => (store.cloud ? { payload: store.cloud, savedAt: store.cloudSavedAt } : null),
    readLocalAutosave: async () =>
      store.local ? { status: 'ok', payload: store.local, updatedAt: store.localUpdatedAt } : { status: 'ok', payload: null, updatedAt: undefined },
    getCurrentPayload: () => store.local ?? buildDefaultPayload(),
    applyPayload: () => {},
    writeLocalAutosave: async (payload) => {
      store.local = payload;
    },
    pushCloudAutosave: async (payload, savedAt) => {
      store.cloud = payload;
      store.cloudSavedAt = savedAt;
    },
    onEvent: (event) => events.push(event.type)
  });
  return events;
};

describe('충돌 화해 — 탭 삭제 후 "이 기기" 선택이 실제로 수렴한다(반복 모달 회귀)', () => {
  const threeTabs = makePayload([makeScenario('a', 'AAA'), makeScenario('b', 'BBB'), makeScenario('c', 'CCC')]);
  const cloudThreeTabs = makePayload([makeScenario('a', 'AAA'), makeScenario('b', 'BBB'), makeScenario('d', 'DDD')]);

  beforeEach(() => {
    writeLocalSpy.mockClear();
    store.local = threeTabs;
    store.localUpdatedAt = 1_000;
    store.cloud = cloudThreeTabs;
    store.cloudSavedAt = 2_000;
    store.pushShouldFail = false;
    liveWorkspace = threeTabs;
  });

  const mountAndDetectConflict = async () => {
    const jotaiStore = createStore();
    render(
      <Provider store={jotaiStore}>
        <Probe />
      </Provider>
    );
    await waitFor(() => expect(jotaiStore.get(cloudConflictAtom)).not.toBeNull());
    expect(jotaiStore.get(cloudSyncStateAtom).status).toBe('conflict'); // push 정지
    return jotaiStore;
  };

  it('모달이 뜬 뒤 탭을 지우고 "이 기기"를 고르면, 지운 상태가 양쪽에 반영되고 다음 세션은 no-op', async () => {
    const jotaiStore = await mountAndDetectConflict();

    // 사용자가 모달을 띄워둔 채 탭 하나를 지운다(라이브 상태만 바뀌고 클라우드 push는 정지 중).
    const afterDelete = makePayload([makeScenario('a', 'AAA'), makeScenario('b', 'BBB')]);
    liveWorkspace = afterDelete;

    await act(async () => {
      api.resolveWithDevice();
    });

    await waitFor(() => expect(jotaiStore.get(cloudConflictAtom)).toBeNull());

    // 세션 시작 스냅샷(3탭)이 아니라 **지운 뒤 상태(2탭)** 가 양쪽에 반영돼야 한다.
    expect(store.cloud?.scenarios.map((s) => s.id)).toEqual(['a', 'b']);
    expect(store.local?.scenarios.map((s) => s.id)).toEqual(['a', 'b']);
    expect(isSameMeaningfulPayload(store.cloud!, store.local!)).toBe(true);
    expect(jotaiStore.get(cloudSyncStateAtom).status).toBe('saved'); // push 정지 해제

    // 새로고침 = 다음 세션 시작 → 같은 충돌이 다시 뜨지 않는다(수렴).
    expect(await nextSessionEvents()).toEqual(['noop']);
  });

  it('블렌드도 라이브 상태를 병합한다 — 화해 중 지운 탭이 되살아나지 않고, 클라우드 고유 탭은 보존', async () => {
    const jotaiStore = await mountAndDetectConflict();

    liveWorkspace = makePayload([makeScenario('a', 'AAA'), makeScenario('b', 'BBB')]); // c 삭제

    await act(async () => {
      api.resolveWithBlend();
    });

    await waitFor(() => expect(jotaiStore.get(cloudConflictAtom)).toBeNull());

    const mergedIds = store.cloud!.scenarios.map((s) => s.id);
    expect(mergedIds).toContain('d'); // 클라우드 고유 탭은 유실 없이 보존(무손실 병합)
    expect(mergedIds).not.toContain('c'); // 사용자가 방금 지운 탭은 되살아나지 않는다
    expect(isSameMeaningfulPayload(store.cloud!, store.local!)).toBe(true);
    expect(await nextSessionEvents()).toEqual(['noop']);
  });

  it('클라우드 기준을 고르면 클라우드 내용으로 양쪽이 수렴한다', async () => {
    const jotaiStore = await mountAndDetectConflict();

    await act(async () => {
      api.resolveWithCloud();
    });

    await waitFor(() => expect(jotaiStore.get(cloudConflictAtom)).toBeNull());
    expect(store.local?.scenarios.map((s) => s.id)).toEqual(['a', 'b', 'd']);
    expect(await nextSessionEvents()).toEqual(['noop']);
  });

  it('화해 IO가 실패하면 조용히 삼키지 않는다 — 충돌 유지 + 실패 표면화 + 재시도로 수렴', async () => {
    const jotaiStore = await mountAndDetectConflict();
    store.pushShouldFail = true;

    await act(async () => {
      api.resolveWithDevice();
    });

    await waitFor(() => expect(api.hasResolveFailed).toBe(true));
    expect(jotaiStore.get(cloudConflictAtom)).not.toBeNull(); // 모달 유지(재시도 경로)
    expect(jotaiStore.get(cloudSyncStateAtom).status).toBe('conflict'); // push 계속 정지

    // 연결 복구 후 같은 버튼으로 재시도 → 수렴.
    store.pushShouldFail = false;
    await act(async () => {
      api.resolveWithDevice();
    });

    await waitFor(() => expect(jotaiStore.get(cloudConflictAtom)).toBeNull());
    expect(api.hasResolveFailed).toBe(false);
    expect(await nextSessionEvents()).toEqual(['noop']);
  });
});
