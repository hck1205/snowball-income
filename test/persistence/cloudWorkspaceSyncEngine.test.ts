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
 * 세션 시작 클라우드 동기화 순수 엔진 — 무음 last-write-wins → **충돌 감지 + 무음 케이스 유지**.
 *
 * 핵심 불변식:
 *  - 내용 동일이면 타임스탬프와 무관하게 **no-op**(clock skew 방지, 타임스탬프 비교보다 먼저).
 *  - **로컬·클라우드 둘 다 내용 있고 의미있게 다르면** `conflict`만 방출하고 어느 쪽도 apply/mirror/push하지
 *    않는다(자동 화해 금지 — 다기기 탭 유실 차단). 타임스탬프는 요약용으로 실어 보내되 정본 결정엔 안 쓴다.
 *  - **한쪽만 존재/빈 슬롯 등 비충돌**은 종전 latest-wins 무음 처리 유지(클라우드만=적용+미러, 로컬만=push).
 *  - 로컬 읽기 실패=읽지 못한 쪽 덮어쓰기 금지, pull 실패=무부작용 종료.
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

const A = withTicker('AAA'); // 로컬 기본(내용 있음)
const B = withTicker('BBB'); // 클라우드 기본(내용 있음)
const CURRENT = withTicker('CURRENT'); // 현재 앱(기본적으로 A·B 모두와 다름 → apply 가드 통과)
const EMPTY = buildDefaultPayload(); // 티커 0개 = 내용 없음(빈 슬롯)

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
const noSideEffects = (calls: Calls) => {
  expect(calls.apply).toEqual([]);
  expect(calls.mirror).toEqual([]);
  expect(calls.push).toEqual([]);
};

describe('내용 동일 → no-op (타임스탬프 비교보다 먼저)', () => {
  it('클라우드가 타임스탬프상 더 최신이어도 내용이 같으면 아무것도 하지 않는다(clock skew 방지)', async () => {
    const h = makeHarness({
      pullCloudAutosave: vi.fn(async () => cloud(withTicker('AAA'), 9000)),
      readLocalAutosave: vi.fn(async () => localOk(A, 1000))
    });

    await syncCloudWorkspaceAtSessionStart(h.deps);

    noSideEffects(h.calls);
    expect(types(h.events)).toEqual(['noop']);
  });
});

describe('충돌: 로컬·클라우드 둘 다 내용 있고 의미있게 다름 → conflict만 방출(무부작용)', () => {
  it('한 탭 내용이 다르면 conflict를 방출하고 local/cloud/타임스탬프를 실어 준다 — apply/mirror/push 없음', async () => {
    const h = makeHarness({
      pullCloudAutosave: vi.fn(async () => cloud(B, 2000)),
      readLocalAutosave: vi.fn(async () => localOk(A, 1000))
    });

    await syncCloudWorkspaceAtSessionStart(h.deps);

    noSideEffects(h.calls);
    expect(h.events).toEqual([
      { type: 'conflict', local: A, cloud: B, localUpdatedAt: 1000, cloudSavedAt: 2000 }
    ]);
  });

  it('로컬이 타임스탬프상 더 최신이어도 자동 push하지 않고 conflict(정본은 사용자 몫)', async () => {
    const h = makeHarness({
      pullCloudAutosave: vi.fn(async () => cloud(B, 1000)),
      readLocalAutosave: vi.fn(async () => localOk(A, 3000))
    });

    await syncCloudWorkspaceAtSessionStart(h.deps);

    noSideEffects(h.calls);
    expect(types(h.events)).toEqual(['conflict']);
  });

  it('동률(타임스탬프 같음)이어도 클라우드 우선 자동적용 없이 conflict', async () => {
    const h = makeHarness({
      pullCloudAutosave: vi.fn(async () => cloud(B, 5000)),
      readLocalAutosave: vi.fn(async () => localOk(A, 5000))
    });

    await syncCloudWorkspaceAtSessionStart(h.deps);

    noSideEffects(h.calls);
    expect(types(h.events)).toEqual(['conflict']);
  });

  it('구버전(양쪽 시각 없음)이라도 둘 다 내용 있고 다르면 conflict + 타임스탬프는 undefined로 전달', async () => {
    const h = makeHarness({
      pullCloudAutosave: vi.fn(async () => cloud(B, undefined)),
      readLocalAutosave: vi.fn(async () => localOk(A, undefined))
    });

    await syncCloudWorkspaceAtSessionStart(h.deps);

    noSideEffects(h.calls);
    expect(h.events).toEqual([
      { type: 'conflict', local: A, cloud: B, localUpdatedAt: undefined, cloudSavedAt: undefined }
    ]);
  });
});

describe('비충돌: 한쪽만 존재 → 종전 latest-wins 무음 처리 유지', () => {
  it('클라우드만 존재(로컬 빈) → 적용 + 로컬 미러', async () => {
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

  it('클라우드만 존재하고 그 내용이 현재 앱과 같으면 apply는 건너뛰되(리렌더 회피) 미러는 한다', async () => {
    const h = makeHarness({
      pullCloudAutosave: vi.fn(async () => cloud(CURRENT, 2000)), // getCurrentPayload와 동일
      readLocalAutosave: vi.fn(async () => localOk(null, undefined))
    });

    await syncCloudWorkspaceAtSessionStart(h.deps);

    expect(h.calls.apply).toEqual([]); // 현재 앱과 동일 → 재적용 안 함
    expect(h.calls.mirror).toEqual([CURRENT]);
    expect(types(h.events)).toEqual(['applied-cloud']);
  });

  it('로컬만 존재(클라우드 없음) → 클라우드에 push', async () => {
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

    noSideEffects(h.calls);
    expect(types(h.events)).toEqual(['noop']);
  });
});

describe('비충돌: 빈 클라우드 슬롯(내용 0) + 로컬 내용 → 충돌 아님(잔여 latest-wins)', () => {
  it('빈 클라우드가 타임스탬프상 더 최신이어도 conflict가 아니라 종전대로 클라우드(빈) 적용+미러', async () => {
    const h = makeHarness({
      pullCloudAutosave: vi.fn(async () => cloud(EMPTY, 9000)),
      readLocalAutosave: vi.fn(async () => localOk(A, 1000))
    });

    await syncCloudWorkspaceAtSessionStart(h.deps);

    // 빈 클라우드는 "둘 다 내용 있음"을 만족하지 않아 conflict 분기를 건너뛴다 → 잔여 latest-wins.
    expect(h.calls.apply).toEqual([EMPTY]);
    expect(h.calls.mirror).toEqual([EMPTY]);
    expect(types(h.events)).toEqual(['applied-cloud']);
  });

  it('빈 클라우드가 더 오래됐으면 로컬(내용)이 정본 → push', async () => {
    const h = makeHarness({
      pullCloudAutosave: vi.fn(async () => cloud(EMPTY, 500)),
      readLocalAutosave: vi.fn(async () => localOk(A, 1000))
    });

    await syncCloudWorkspaceAtSessionStart(h.deps);

    expect(h.calls.push).toEqual([{ payload: A, savedAt: 1000 }]);
    expect(types(h.events)).toEqual(['pushed-local']);
  });
});

describe('IO 실패 보류', () => {
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

    noSideEffects(h.calls);
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

    noSideEffects(h.calls);
    expect(h.events).toEqual([]);
  });
});
