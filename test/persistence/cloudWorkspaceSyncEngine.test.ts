import { describe, expect, it, vi } from 'vitest';
import {
  syncCloudWorkspaceAtSessionStart,
  type CloudAutosaveRead,
  type CloudWorkspaceSyncDeps,
  type CloudWorkspaceSyncEvent,
  type LocalAutosaveRead
} from '@/jotai/snowball/cloud';
import { buildDefaultPayload, type PersistedAppStatePayload } from '@/jotai';
import type { TickerProfile } from '@/shared/types/snowball';

/**
 * 세션 시작 클라우드 동기화 순수 엔진 — **latest-wins 양방향**. IO를 주입해 5분기를 결정론 검증한다.
 *
 * 핵심 불변식:
 *  - 내용 동일이면 타임스탬프와 무관하게 **no-op**(clock skew 방지, 타임스탬프 비교보다 먼저).
 *  - 최신인 쪽이 정본: 클라우드 최신=적용+로컬미러, 로컬 최신=클라우드 push. 로컬을 **지우지 않는다**(둘 다 미러 유지).
 *  - 한쪽만 존재하면 그쪽 채택 후 반대쪽 반영. 동률이면 클라우드 우선.
 *  - 로컬 읽기 실패=읽지 못한 쪽 덮어쓰기 금지(클라우드 있으면 apply만), pull 실패=무부작용 종료.
 */

/** 의미있게 구별되는 payload를 만든다(ticker가 다르면 isSameMeaningfulPayload가 다르다고 본다). */
const withTicker = (ticker: string): PersistedAppStatePayload => {
  const base = buildDefaultPayload();
  const profile: TickerProfile = {
    id: `id-${ticker}`,
    ticker,
    name: ticker,
    initialPrice: 100,
    dividendYield: 3,
    dividendGrowth: 0,
    expectedTotalReturn: 3,
    frequency: 'quarterly'
  };
  const portfolio = {
    ...base.scenarios[0].portfolio,
    tickerProfiles: [profile],
    includedTickerIds: [profile.id]
  };
  const scenario = { ...base.scenarios[0], portfolio };
  return { ...base, portfolio, scenarios: [scenario], activeScenarioId: scenario.id };
};

const A = withTicker('AAA'); // 로컬 기본
const B = withTicker('BBB'); // 클라우드 기본
const CURRENT = withTicker('CURRENT'); // 현재 앱(기본적으로 A·B 모두와 다름 → apply 가드 통과)

const cloud = (payload: PersistedAppStatePayload, savedAt: number | undefined): CloudAutosaveRead => ({ payload, savedAt });
const localOk = (payload: PersistedAppStatePayload | null, updatedAt: number | undefined): LocalAutosaveRead => ({
  status: 'ok',
  payload,
  updatedAt
});
const localFailed: LocalAutosaveRead = { status: 'failed' };

type Calls = {
  apply: PersistedAppStatePayload[];
  mirror: PersistedAppStatePayload[];
  push: { payload: PersistedAppStatePayload; savedAt: number }[];
};

const makeHarness = (over: Partial<CloudWorkspaceSyncDeps> = {}) => {
  const events: CloudWorkspaceSyncEvent[] = [];
  const calls: Calls = { apply: [], mirror: [], push: [] };

  const deps: CloudWorkspaceSyncDeps = {
    pullCloudAutosave: vi.fn(async (): Promise<CloudAutosaveRead> => null),
    readLocalAutosave: vi.fn(async (): Promise<LocalAutosaveRead> => localOk(null, undefined)),
    getCurrentPayload: () => CURRENT,
    applyPayload: (p) => {
      calls.apply.push(p);
    },
    writeLocalAutosave: vi.fn(async (p: PersistedAppStatePayload) => {
      calls.mirror.push(p);
    }),
    pushCloudAutosave: vi.fn(async (p: PersistedAppStatePayload, savedAt: number) => {
      calls.push.push({ payload: p, savedAt });
    }),
    now: () => 999_999,
    onEvent: (e) => events.push(e),
    ...over
  };

  return { events, calls, deps };
};

const types = (events: CloudWorkspaceSyncEvent[]) => events.map((e) => e.type);
const failReason = (event: CloudWorkspaceSyncEvent) => (event as { reason: string }).reason;

describe('latest-wins: 내용 동일 → no-op (타임스탬프 비교보다 먼저)', () => {
  it('클라우드가 타임스탬프상 더 최신이어도 내용이 같으면 아무것도 하지 않는다(clock skew 방지)', async () => {
    const h = makeHarness({
      pullCloudAutosave: vi.fn(async () => cloud(withTicker('AAA'), 9000)),
      readLocalAutosave: vi.fn(async () => localOk(A, 1000))
    });

    await syncCloudWorkspaceAtSessionStart(h.deps);

    expect(h.calls.apply).toEqual([]);
    expect(h.calls.mirror).toEqual([]);
    expect(h.calls.push).toEqual([]);
    expect(types(h.events)).toEqual(['noop']);
  });
});

describe('latest-wins: 클라우드가 더 최신 → 적용 + 로컬 미러', () => {
  it('앱에 적용하고 로컬 IndexedDB에도 미러한다(cloud→IndexedDB)', async () => {
    const h = makeHarness({
      pullCloudAutosave: vi.fn(async () => cloud(B, 2000)),
      readLocalAutosave: vi.fn(async () => localOk(A, 1000))
    });

    await syncCloudWorkspaceAtSessionStart(h.deps);

    expect(h.calls.apply).toEqual([B]);
    expect(h.calls.mirror).toEqual([B]);
    expect(h.calls.push).toEqual([]);
    expect(types(h.events)).toEqual(['applied-cloud']);
  });

  it('클라우드가 현재 앱과 완전히 같으면 적용은 건너뛰되(리렌더 회피) 미러는 한다', async () => {
    const h = makeHarness({
      pullCloudAutosave: vi.fn(async () => cloud(CURRENT, 2000)),
      readLocalAutosave: vi.fn(async () => localOk(A, 1000))
    });

    await syncCloudWorkspaceAtSessionStart(h.deps);

    expect(h.calls.apply).toEqual([]); // getCurrentPayload와 동일 → 재적용 안 함
    expect(h.calls.mirror).toEqual([CURRENT]);
    expect(types(h.events)).toEqual(['applied-cloud']);
  });

  it('미러(로컬 쓰기)가 실패하면 failed(mirror-error) — 앱엔 적용됨, 무음 실패 금지', async () => {
    const h = makeHarness({
      pullCloudAutosave: vi.fn(async () => cloud(B, 2000)),
      readLocalAutosave: vi.fn(async () => localOk(A, 1000)),
      writeLocalAutosave: vi.fn(async () => {
        throw new Error('idb write failed');
      })
    });

    await syncCloudWorkspaceAtSessionStart(h.deps);

    expect(h.calls.apply).toEqual([B]);
    expect(h.calls.push).toEqual([]);
    expect(types(h.events)).toEqual(['failed']);
    expect(failReason(h.events[0])).toBe('mirror-error');
  });
});

describe('latest-wins: 로컬이 더 최신 → 클라우드에 push', () => {
  it('로컬 payload를 원본 편집시각(updatedAt)을 savedAt으로 심어 올린다(IndexedDB→cloud)', async () => {
    const h = makeHarness({
      pullCloudAutosave: vi.fn(async () => cloud(B, 1000)),
      readLocalAutosave: vi.fn(async () => localOk(A, 3000))
    });

    await syncCloudWorkspaceAtSessionStart(h.deps);

    expect(h.calls.apply).toEqual([]);
    expect(h.calls.mirror).toEqual([]);
    expect(h.calls.push).toEqual([{ payload: A, savedAt: 3000 }]);
    expect(types(h.events)).toEqual(['pushed-local']);
  });

  it('push가 실패하면 failed(push-error) — 로컬 보존', async () => {
    const h = makeHarness({
      pullCloudAutosave: vi.fn(async () => cloud(B, 1000)),
      readLocalAutosave: vi.fn(async () => localOk(A, 3000)),
      pushCloudAutosave: vi.fn(async () => {
        throw new Error('network');
      })
    });

    await syncCloudWorkspaceAtSessionStart(h.deps);

    expect(types(h.events)).toEqual(['failed']);
    expect(failReason(h.events[0])).toBe('push-error');
  });
});

describe('latest-wins: 한쪽만 존재', () => {
  it('클라우드만 존재 → 적용 + 로컬 미러', async () => {
    const h = makeHarness({
      pullCloudAutosave: vi.fn(async () => cloud(B, 2000)),
      readLocalAutosave: vi.fn(async () => localOk(null, undefined))
    });

    await syncCloudWorkspaceAtSessionStart(h.deps);

    expect(h.calls.apply).toEqual([B]);
    expect(h.calls.mirror).toEqual([B]);
    expect(h.calls.push).toEqual([]);
    expect(types(h.events)).toEqual(['applied-cloud']);
  });

  it('로컬만 존재 → 클라우드에 push', async () => {
    const h = makeHarness({
      pullCloudAutosave: vi.fn(async () => null),
      readLocalAutosave: vi.fn(async () => localOk(A, 1500))
    });

    await syncCloudWorkspaceAtSessionStart(h.deps);

    expect(h.calls.push).toEqual([{ payload: A, savedAt: 1500 }]);
    expect(h.calls.apply).toEqual([]);
    expect(h.calls.mirror).toEqual([]);
    expect(types(h.events)).toEqual(['pushed-local']);
  });

  it('양쪽 다 비어 있으면 no-op', async () => {
    const h = makeHarness({
      pullCloudAutosave: vi.fn(async () => null),
      readLocalAutosave: vi.fn(async () => localOk(null, undefined))
    });

    await syncCloudWorkspaceAtSessionStart(h.deps);

    expect(h.calls.apply).toEqual([]);
    expect(h.calls.push).toEqual([]);
    expect(h.calls.mirror).toEqual([]);
    expect(types(h.events)).toEqual(['noop']);
  });
});

describe('latest-wins: 동률(타임스탬프 같음)', () => {
  it('동률 + 내용 다름 → 클라우드 우선(적용 + 미러)', async () => {
    const h = makeHarness({
      pullCloudAutosave: vi.fn(async () => cloud(B, 5000)),
      readLocalAutosave: vi.fn(async () => localOk(A, 5000))
    });

    await syncCloudWorkspaceAtSessionStart(h.deps);

    expect(h.calls.apply).toEqual([B]);
    expect(h.calls.mirror).toEqual([B]);
    expect(h.calls.push).toEqual([]);
    expect(types(h.events)).toEqual(['applied-cloud']);
  });

  it('동률 + 내용 동일 → no-op', async () => {
    const h = makeHarness({
      pullCloudAutosave: vi.fn(async () => cloud(withTicker('AAA'), 5000)),
      readLocalAutosave: vi.fn(async () => localOk(A, 5000))
    });

    await syncCloudWorkspaceAtSessionStart(h.deps);

    expect(types(h.events)).toEqual(['noop']);
    expect(h.calls.apply).toEqual([]);
    expect(h.calls.push).toEqual([]);
  });
});

describe('latest-wins: IO 실패 보류', () => {
  it('로컬 읽기 실패 + 클라우드 있음 → 조용한 로드(apply)만, 미러/push 없음 + failed(local-read)', async () => {
    const h = makeHarness({
      pullCloudAutosave: vi.fn(async () => cloud(B, 1)),
      readLocalAutosave: vi.fn(async () => localFailed)
    });

    await syncCloudWorkspaceAtSessionStart(h.deps);

    expect(h.calls.apply).toEqual([B]); // 읽지 못한 로컬은 덮어쓰지 않고 클라우드만 조용히 로드
    expect(h.calls.mirror).toEqual([]);
    expect(h.calls.push).toEqual([]);
    expect(types(h.events)).toEqual(['failed']);
    expect(failReason(h.events[0])).toBe('local-read');
  });

  it('로컬 읽기 실패 + 클라우드 없음 → 아무것도 하지 않고 failed(local-read)', async () => {
    const h = makeHarness({
      pullCloudAutosave: vi.fn(async () => null),
      readLocalAutosave: vi.fn(async () => localFailed)
    });

    await syncCloudWorkspaceAtSessionStart(h.deps);

    expect(h.calls.apply).toEqual([]);
    expect(h.calls.push).toEqual([]);
    expect(types(h.events)).toEqual(['failed']);
    expect(failReason(h.events[0])).toBe('local-read');
  });

  it('pull 자체가 실패하면(throw) 부작용 없이 안전 종료 — 이벤트도 없음', async () => {
    const h = makeHarness({
      pullCloudAutosave: vi.fn(async () => {
        throw new Error('table missing');
      }),
      readLocalAutosave: vi.fn(async () => localOk(A, 1000))
    });

    await syncCloudWorkspaceAtSessionStart(h.deps);

    expect(h.calls.apply).toEqual([]);
    expect(h.calls.push).toEqual([]);
    expect(h.calls.mirror).toEqual([]);
    expect(h.events).toEqual([]);
  });
});

describe('latest-wins: 하위 호환(savedAt/updatedAt 없는 구버전 데이터)', () => {
  it('클라우드 savedAt 없음 + 로컬 updatedAt 있음 + 내용 다름 → 로컬이 최신(push)', async () => {
    const h = makeHarness({
      pullCloudAutosave: vi.fn(async () => cloud(B, undefined)),
      readLocalAutosave: vi.fn(async () => localOk(A, 1000))
    });

    await syncCloudWorkspaceAtSessionStart(h.deps);

    expect(h.calls.push).toEqual([{ payload: A, savedAt: 1000 }]);
    expect(types(h.events)).toEqual(['pushed-local']);
  });

  it('로컬 updatedAt 없음 + 클라우드 savedAt 있음 + 내용 다름 → 클라우드가 최신(적용 + 미러)', async () => {
    const h = makeHarness({
      pullCloudAutosave: vi.fn(async () => cloud(B, 1000)),
      readLocalAutosave: vi.fn(async () => localOk(A, undefined))
    });

    await syncCloudWorkspaceAtSessionStart(h.deps);

    expect(h.calls.apply).toEqual([B]);
    expect(h.calls.mirror).toEqual([B]);
    expect(types(h.events)).toEqual(['applied-cloud']);
  });

  it('양쪽 다 시각 없음 + 내용 다름 → 동률(0==0) → 클라우드 우선', async () => {
    const h = makeHarness({
      pullCloudAutosave: vi.fn(async () => cloud(B, undefined)),
      readLocalAutosave: vi.fn(async () => localOk(A, undefined))
    });

    await syncCloudWorkspaceAtSessionStart(h.deps);

    expect(h.calls.apply).toEqual([B]);
    expect(h.calls.mirror).toEqual([B]);
    expect(types(h.events)).toEqual(['applied-cloud']);
  });
});
