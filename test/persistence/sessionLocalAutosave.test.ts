import { describe, expect, it, vi } from 'vitest';
import {
  createSessionLocalAutosaveCache,
  syncCloudWorkspaceAtSessionStart,
  toLocalAutosaveRead,
  type CloudAutosaveRead,
  type CloudWorkspaceSyncEvent,
  type LocalAutosaveRead
} from '@/jotai/snowball/cloud';
import { buildDefaultPayload, type PersistedAppStatePayload } from '@/jotai';
import type { PersistedAppStateReadResult } from '@/jotai';
import type { TickerProfile } from '@/shared/types/snowball';

/**
 * 세션 시작 **로컬 read 1회 공유**(하이드레이션 ↔ 세션시작 클라우드 sync)의 순수 계약.
 *
 * 배경(데이터 유실 경로 M1): 예전에는 하이드레이션과 sync가 로컬 IndexedDB를 각각 독립 read했다. 로그인
 * 사용자에서 로컬 L이 클라우드 C보다 최신일 때 — 하이드레이션 read는 성공(app=L, autosave 잠금 안 됨)했는데
 * 직후 sync read가 일시 실패하면, 엔진이 더 오래된 C를 apply → 잠기지 않은 app autosave가 120ms 뒤 로컬 L을
 * C로 덮어써 **더 최신이던 로컬 편집이 유실**됐다. 두 read를 1회로 통일하면 이 불일치 창 자체가 사라진다.
 */

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

const LOCAL_NEWER = withTicker('LOCAL'); // 로컬 최신본 L(실제 포트폴리오 보유)
const CLOUD_OLDER = withTicker('CLOUD'); // 더 오래된 클라우드 C
const CURRENT = withTicker('CURRENT'); // 현재 앱(하이드레이션이 L을 넣었다고 가정해도 apply 가드 통과)

const okRead = (payload: PersistedAppStatePayload, updatedAt: number): PersistedAppStateReadResult => ({
  ok: true,
  payload,
  updatedAt
});
const failedRead = (): PersistedAppStateReadResult => ({
  ok: false,
  payload: buildDefaultPayload(),
  error: new Error('IndexedDB open blocked by another tab')
});

const cloud = (payload: PersistedAppStatePayload, savedAt: number): CloudAutosaveRead => ({ payload, savedAt });

describe('toLocalAutosaveRead: readPersistedAppState 결과 → 클라우드 sync 입력 변환', () => {
  it('읽기 실패는 failed로 변환한다(덮어쓰기 보류 신호)', () => {
    expect(toLocalAutosaveRead(failedRead())).toEqual<LocalAutosaveRead>({ status: 'failed' });
  });

  it('성공이지만 실제 포트폴리오가 없으면 payload=null(정본 후보 아님)', () => {
    const empty = okRead(buildDefaultPayload(), 1234);
    expect(toLocalAutosaveRead(empty)).toEqual<LocalAutosaveRead>({
      status: 'ok',
      payload: null,
      updatedAt: undefined
    });
  });

  it('성공 + 포트폴리오 보유 → payload와 updatedAt을 그대로 싣는다', () => {
    expect(toLocalAutosaveRead(okRead(LOCAL_NEWER, 2000))).toEqual<LocalAutosaveRead>({
      status: 'ok',
      payload: LOCAL_NEWER,
      updatedAt: 2000
    });
  });
});

describe('createSessionLocalAutosaveCache: 세션당 로컬 read 1회 공유', () => {
  it('read/readForSync를 여러 번 불러도 밑단 read는 정확히 1회만 수행한다', async () => {
    const underlying = vi.fn(async () => okRead(LOCAL_NEWER, 2000));
    const cache = createSessionLocalAutosaveCache(underlying);

    const hydrate = await cache.read(); // 하이드레이션
    const forSync1 = await cache.readForSync(); // sync
    const forSync2 = await cache.readForSync();

    expect(underlying).toHaveBeenCalledTimes(1);
    expect(hydrate).toEqual(okRead(LOCAL_NEWER, 2000));
    expect(forSync1).toEqual<LocalAutosaveRead>({ status: 'ok', payload: LOCAL_NEWER, updatedAt: 2000 });
    expect(forSync2).toEqual(forSync1);
  });
});

describe('M1 불변식: 하이드레이션 성공 + 이후 storage 실패에도 로컬 최신본 보존', () => {
  it('sync가 하이드레이션 read를 재사용해, 2차 read가 실패해도 클라우드를 apply/덮어쓰지 않고 로컬을 push한다', async () => {
    // 밑단 read: 1회차(하이드레이션)=성공(L), 2회차 이후=실패(cross-tab blocked 등 일시).
    let calls = 0;
    const flakyRead = vi.fn(async (): Promise<PersistedAppStateReadResult> => {
      calls += 1;
      return calls === 1 ? okRead(LOCAL_NEWER, 2000) : failedRead();
    });
    const cache = createSessionLocalAutosaveCache(flakyRead);

    // 하이드레이션이 먼저 L을 읽는다(app=L, autosave 잠금 안 걸림).
    const hydrate = await cache.read();
    expect(hydrate.ok).toBe(true);

    const events: CloudWorkspaceSyncEvent[] = [];
    const apply: PersistedAppStatePayload[] = [];
    const mirror: PersistedAppStatePayload[] = [];
    const push: { payload: PersistedAppStatePayload; savedAt: number }[] = [];

    await syncCloudWorkspaceAtSessionStart({
      pullCloudAutosave: vi.fn(async () => cloud(CLOUD_OLDER, 1000)), // 클라우드는 더 오래됨
      readLocalAutosave: cache.readForSync, // ★ 하이드레이션 read를 재사용(독립 2차 read 아님)
      getCurrentPayload: () => CURRENT,
      applyPayload: (p) => apply.push(p),
      writeLocalAutosave: vi.fn(async (p: PersistedAppStatePayload) => {
        mirror.push(p);
      }),
      pushCloudAutosave: vi.fn(async (p: PersistedAppStatePayload, savedAt: number) => {
        push.push({ payload: p, savedAt });
      }),
      onEvent: (e) => events.push(e)
    });

    // 로컬(L)이 정본 → 클라우드를 apply하지도, 로컬을 덮어쓰지도 않는다. L을 원본 시각(2000)으로 push.
    expect(apply).toEqual([]);
    expect(mirror).toEqual([]);
    expect(push).toEqual([{ payload: LOCAL_NEWER, savedAt: 2000 }]);
    expect(events.map((e) => e.type)).toEqual(['pushed-local']);

    // 핵심: 밑단 read는 하이드레이션 1회뿐 — 실패했을 2차 read 자체가 발생하지 않는다.
    expect(flakyRead).toHaveBeenCalledTimes(1);
  });

  it('대조: 만약 sync가 독립 2차 read를 했다면 그 read는 실패해 엔진이 더 오래된 클라우드를 apply했을 것(구 유실 경로)', async () => {
    // 캐시를 거치지 않고 밑단 read를 직접 두 번 부르면 2차는 실패한다 — 구 구조의 위험을 문서화한다.
    let calls = 0;
    const flakyRead = async (): Promise<PersistedAppStateReadResult> => {
      calls += 1;
      return calls === 1 ? okRead(LOCAL_NEWER, 2000) : failedRead();
    };

    await flakyRead(); // 하이드레이션 read
    const independentSecond = toLocalAutosaveRead(await flakyRead()); // sync가 독립 read했다면
    expect(independentSecond).toEqual<LocalAutosaveRead>({ status: 'failed' });

    const apply: PersistedAppStatePayload[] = [];
    await syncCloudWorkspaceAtSessionStart({
      pullCloudAutosave: vi.fn(async () => cloud(CLOUD_OLDER, 1000)),
      readLocalAutosave: vi.fn(async () => independentSecond),
      getCurrentPayload: () => CURRENT,
      applyPayload: (p) => apply.push(p),
      writeLocalAutosave: vi.fn(async () => {}),
      pushCloudAutosave: vi.fn(async () => {})
    });

    // 독립 read 구조에서는 로컬읽기 실패 분기가 더 오래된 클라우드를 조용히 apply → app autosave 덮어쓰기 유발.
    expect(apply).toEqual([CLOUD_OLDER]);
  });
});
