import { describe, expect, it, vi, beforeEach } from 'vitest';
import { act, render, waitFor } from '@testing-library/react';
import { Provider } from 'jotai/react';
import { createStore } from 'jotai/vanilla';
import {
  cloudConflictAtom,
  cloudSyncStateAtom,
  readSyncBase,
  syncCloudWorkspaceAtSessionStart,
  writeSyncBase,
  type CloudAutosaveRead,
  type LocalAutosaveRead
} from '@/jotai/snowball/cloud';
import { buildDefaultPayload, isSameMeaningfulPayload, serializeMeaningfulPayload, type PersistedAppStatePayload } from '@/jotai';
import type { PersistedScenarioState, PersistedInvestmentSettings } from '@/jotai/snowball/types';
import type { TickerProfile } from '@/shared/types/snowball';
import { useCloudWorkspaceSync, type CloudReconciliationApi } from '@/pages/Main/hooks';

/**
 * **Policy A**: merge-base 3-way + **진짜 동시편집(양쪽 다 base에서 변함)일 때만 세션당 1회 모달**.
 * 단방향 변경(한쪽만 base에서 변함)은 엔진이 조용히 fast-forward한다(모달 없음). 화해하면 base가 갱신돼
 * 다음 세션은 noop → **다기기 핑퐁 종식**.
 *
 * 여기서 고정하는 계약:
 *  1. 화해는 **지금 화면의 워크스페이스**(라이브)를 디바이스 정본으로 쓴다.
 *  2. 화해 후 로컬·클라우드·base가 수렴해 다음 세션이 no-op으로 수렴한다(모달 재발 없음).
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

/** 다음 세션 시작(새로고침)을 순수 엔진으로 재현한다(base 배선 없음 — FF/noop 수렴 확인용). */
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

/**
 * 다음 세션 시작을 **merge-base 배선까지 포함**해 재현한다(hook과 동일하게 user-1 base를 read/write).
 * base가 있으면 3-way FF/충돌, 없으면 종전 휴리스틱 — 정책 A의 세션 간 수렴을 raw 엔진으로 결정론 검증한다.
 */
const nextSessionEventsWithBase = async (): Promise<string[]> => {
  const events: string[] = [];
  await syncCloudWorkspaceAtSessionStart({
    pullCloudAutosave: async () => (store.cloud ? { payload: store.cloud, savedAt: store.cloudSavedAt } : null),
    readLocalAutosave: async () =>
      store.local ? { status: 'ok', payload: store.local, updatedAt: store.localUpdatedAt } : { status: 'ok', payload: null, updatedAt: undefined },
    getCurrentPayload: () => store.local ?? buildDefaultPayload(),
    applyPayload: (payload) => {
      store.local = payload;
    },
    writeLocalAutosave: async (payload) => {
      store.local = payload;
    },
    pushCloudAutosave: async (payload, savedAt) => {
      store.cloud = payload;
      store.cloudSavedAt = savedAt;
    },
    readBase: () => readSyncBase('user-1'),
    writeBase: (hash) => writeSyncBase('user-1', hash),
    onEvent: (event) => events.push(event.type)
  });
  return events;
};

describe('충돌 화해 — 탭 삭제 후 "이 기기" 선택이 실제로 수렴한다(반복 모달 회귀)', () => {
  const threeTabs = makePayload([makeScenario('a', 'AAA'), makeScenario('b', 'BBB'), makeScenario('c', 'CCC')]);
  const cloudThreeTabs = makePayload([makeScenario('a', 'AAA'), makeScenario('b', 'BBB'), makeScenario('d', 'DDD')]);

  beforeEach(() => {
    // 화해가 user-1 base를 localStorage에 쓴다 → 테스트 간 오염을 막으려면 매번 비운다.
    // base가 비어 있어야 이 divergent(부분겹침) 시나리오가 폴백으로 충돌을 감지한다(base 미존재 폴백).
    localStorage.clear();
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

/**
 * **회귀(실사용자 신고)**: 로컬 autosave(120ms)는 삭제를 즉시 반영하지만 클라우드 push는 4초 디바운스라,
 * 새로고침이 디바운스를 앞지르면 로컬{a,b} vs 클라우드{a,b,c}로 세션 시작 엔진이 거짓 충돌을 냈다. 수정 B:
 * 로컬 ⊂ 클라우드 + 로컬이 엄격히 더 최근이면 = 같은 기기의 삭제→새로고침 레이스라 삭제를 정본으로 push한다
 * (conflict 없이). **사용자 개입(모달) 없이 다음 세션이 noop으로 수렴**함을 단정한다.
 */
describe('탭 삭제 후 새로고침 — 사용자 개입 없이 수렴한다(거짓 충돌 루프 종식)', () => {
  const twoTabs = makePayload([makeScenario('a', 'AAA'), makeScenario('b', 'BBB')]);
  const cloudThreeTabs = makePayload([makeScenario('a', 'AAA'), makeScenario('b', 'BBB'), makeScenario('c', 'CCC')]);

  beforeEach(() => {
    // 사용자가 c 탭을 방금 삭제(로컬은 120ms에 {a,b} 반영, updatedAt이 더 최근).
    store.local = twoTabs;
    store.localUpdatedAt = 5_000;
    // 클라우드는 삭제가 도달하기 전 상태({a,b,c}, savedAt이 더 과거 — 디바운스가 못 따라감).
    store.cloud = cloudThreeTabs;
    store.cloudSavedAt = 2_000;
    store.pushShouldFail = false;
  });

  it('로컬 ⊂ 클라우드 + 로컬이 더 최근 → 첫 세션이 삭제를 push(무모달), 두 번째 세션은 noop', async () => {
    // 새로고침 #1: 삭제가 이겨 클라우드가 {a,b}로 수렴한다(conflict 아님).
    expect(await nextSessionEvents()).toEqual(['pushed-local']);
    expect(store.cloud?.scenarios.map((s) => s.id)).toEqual(['a', 'b']);
    expect(isSameMeaningfulPayload(store.cloud!, store.local!)).toBe(true);

    // 새로고침 #2: 양쪽이 같아 아무 일도 없다(모달 재등장 없음).
    expect(await nextSessionEvents()).toEqual(['noop']);
  });

  it('삭제를 반복해도(다시 삭제→새로고침) 매번 수렴 — 루프가 재발하지 않는다', async () => {
    // 1차 삭제 수렴.
    expect(await nextSessionEvents()).toEqual(['pushed-local']);
    expect(await nextSessionEvents()).toEqual(['noop']);

    // 사용자가 b 탭을 또 삭제(로컬 {a}, 더 최근). 클라우드는 push 전 {a,b}.
    store.local = makePayload([makeScenario('a', 'AAA')]);
    store.localUpdatedAt = 9_000;
    // (store.cloud는 직전 세션에서 {a,b}/2_000이 아니라 pushed-local의 savedAt=5_000이 됐다 → 로컬 9_000이 더 최근)

    expect(await nextSessionEvents()).toEqual(['pushed-local']);
    expect(store.cloud?.scenarios.map((s) => s.id)).toEqual(['a']);
    expect(await nextSessionEvents()).toEqual(['noop']);
  });
});

/**
 * **회귀(다기기 핑퐁)**: 부분겹침 발산(로컬{a,b,c} vs 클라우드{a,b,d})은 subset이 아니라 세션 시작 엔진이
 * 매번 conflict를 냈고, 한쪽이 화해해도 반대쪽이 또 conflict → 무한 핑퐁이었다(사용자 신고, pitfalls 2026-07-23).
 * 정책 A = per-user **merge-base**로 "각각 base에서 바뀌었나"를 판정한다: 한쪽만 변하면 **무모달 FF**,
 * 양쪽 변하면 모달 1회이고 **해결 시 base가 갱신돼 재발하지 않는다**. 여기서 hook 배선(readSyncBase/
 * writeSyncBase + resolve 시 base 확립)과 세션 간 수렴을 고정한다.
 */
describe('merge-base 정책 A — 단방향 FF(무모달) vs 양방향 모달, 다기기 핑퐁 종식', () => {
  const twoTabs = makePayload([makeScenario('a', 'AAA'), makeScenario('b', 'BBB')]);
  const localPlusC = makePayload([makeScenario('a', 'AAA'), makeScenario('b', 'BBB'), makeScenario('c', 'CCC')]);
  const cloudPlusD = makePayload([makeScenario('a', 'AAA'), makeScenario('b', 'BBB'), makeScenario('d', 'DDD')]);

  beforeEach(() => {
    localStorage.clear();
    writeLocalSpy.mockClear();
    store.local = null;
    store.localUpdatedAt = undefined;
    store.cloud = null;
    store.cloudSavedAt = undefined;
    store.pushShouldFail = false;
  });

  const mount = () => {
    const jotaiStore = createStore();
    render(
      <Provider store={jotaiStore}>
        <Probe />
      </Provider>
    );
    return jotaiStore;
  };

  it('단방향(클라우드만 전진, 로컬==base) → 모달 없이 조용히 FF apply + base 전진 + 다음 세션 noop', async () => {
    store.local = twoTabs;
    store.localUpdatedAt = 1_000;
    store.cloud = cloudPlusD; // 다른 기기가 DDD 추가
    store.cloudSavedAt = 500; // 시각상 더 과거여도 base가 판정한다
    liveWorkspace = twoTabs;
    writeSyncBase('user-1', serializeMeaningfulPayload(twoTabs)); // 마지막 동기화 = 2탭

    const jotaiStore = mount();

    // 조용한 FF apply 완료: 앱·로컬 미러가 클라우드(3탭)로 전진, 모달은 뜨지 않는다.
    await waitFor(() => expect(store.local?.scenarios.map((s) => s.id)).toEqual(['a', 'b', 'd']));
    expect(jotaiStore.get(cloudConflictAtom)).toBeNull();
    expect(jotaiStore.get(cloudSyncStateAtom).status).not.toBe('conflict');
    expect(liveWorkspace.scenarios.map((s) => s.id)).toEqual(['a', 'b', 'd']);
    expect(readSyncBase('user-1')).toBe(serializeMeaningfulPayload(cloudPlusD));
    expect(await nextSessionEventsWithBase()).toEqual(['noop']);
  });

  it('단방향(로컬만 전진, 클라우드==base) → 모달 없이 조용히 FF push + base 전진 + 다음 세션 noop', async () => {
    store.local = localPlusC; // 이 기기가 CCC 추가
    store.localUpdatedAt = 1_000;
    store.cloud = twoTabs;
    store.cloudSavedAt = 9_000; // 클라우드가 시각상 더 최신이어도 base가 판정한다
    liveWorkspace = localPlusC;
    writeSyncBase('user-1', serializeMeaningfulPayload(twoTabs)); // 마지막 동기화 = 2탭(=클라우드)

    const jotaiStore = mount();

    // 조용한 FF push 완료: 클라우드가 로컬(3탭)로 전진, 모달은 뜨지 않는다.
    await waitFor(() => expect(store.cloud?.scenarios.map((s) => s.id)).toEqual(['a', 'b', 'c']));
    expect(jotaiStore.get(cloudConflictAtom)).toBeNull();
    expect(jotaiStore.get(cloudSyncStateAtom).status).not.toBe('conflict');
    expect(readSyncBase('user-1')).toBe(serializeMeaningfulPayload(localPlusC));
    expect(await nextSessionEventsWithBase()).toEqual(['noop']);
  });

  it('양방향(로컬·클라우드가 각각 base에서 전진) → 진짜 동시편집 → 모달 1회 + push 정지', async () => {
    store.local = localPlusC; // 이 기기 CCC
    store.localUpdatedAt = 1_000;
    store.cloud = cloudPlusD; // 다른 기기 DDD
    store.cloudSavedAt = 2_000;
    liveWorkspace = localPlusC;
    writeSyncBase('user-1', serializeMeaningfulPayload(twoTabs)); // 공통 조상 = 2탭

    const jotaiStore = mount();

    await waitFor(() => expect(jotaiStore.get(cloudConflictAtom)).not.toBeNull());
    expect(jotaiStore.get(cloudSyncStateAtom).status).toBe('conflict');
  });

  it('base 미존재(신규 기기) → 정책 A 건너뛰고 현행 휴리스틱 폴백(부분겹침 발산 → 모달)', async () => {
    // base를 seed하지 않는다(localStorage 비어 있음) → readSyncBase=undefined → 폴백.
    store.local = localPlusC;
    store.localUpdatedAt = 5_000;
    store.cloud = cloudPlusD;
    store.cloudSavedAt = 5_000;
    liveWorkspace = localPlusC;

    const jotaiStore = mount();

    await waitFor(() => expect(jotaiStore.get(cloudConflictAtom)).not.toBeNull()); // 폴백도 이 divergent엔 모달
  });

  it('핑퐁 종식: "이 기기"로 해결하면 base가 갱신돼, 이후 클라우드만 전진한 세션은 재충돌 없이 FF apply→noop', async () => {
    // 1) 진짜 동시편집(양쪽 base 전진) → 모달.
    store.local = localPlusC;
    store.localUpdatedAt = 1_000;
    store.cloud = cloudPlusD;
    store.cloudSavedAt = 2_000;
    liveWorkspace = localPlusC;
    writeSyncBase('user-1', serializeMeaningfulPayload(twoTabs));

    const jotaiStore = mount();
    await waitFor(() => expect(jotaiStore.get(cloudConflictAtom)).not.toBeNull());

    // 2) "이 기기"로 해결 → 로컬·클라우드가 localPlusC로 수렴하고 base=localPlusC로 확립된다(핑퐁을 끊는 핵심).
    await act(async () => {
      api.resolveWithDevice();
    });
    await waitFor(() => expect(jotaiStore.get(cloudConflictAtom)).toBeNull());
    expect(store.cloud?.scenarios.map((s) => s.id)).toEqual(['a', 'b', 'c']);
    expect(readSyncBase('user-1')).toBe(serializeMeaningfulPayload(localPlusC));

    // 3) 다음 세션: 다른 기기가 클라우드에 EEE만 더 얹었다(로컬은 여전히 base). 재충돌 없이 조용히 FF apply.
    const cloudPlusCE = makePayload([
      makeScenario('a', 'AAA'),
      makeScenario('b', 'BBB'),
      makeScenario('c', 'CCC'),
      makeScenario('e', 'EEE')
    ]);
    store.cloud = cloudPlusCE;
    store.cloudSavedAt = 5_000;
    expect(await nextSessionEventsWithBase()).toEqual(['applied-cloud']);
    expect(store.local?.scenarios.map((s) => s.id)).toEqual(['a', 'b', 'c', 'e']);

    // 4) 재차 새로고침: 양쪽 == base → noop(핑퐁 완전 종식, resolve 횟수와 무관하게 수렴).
    expect(await nextSessionEventsWithBase()).toEqual(['noop']);
  });
});
