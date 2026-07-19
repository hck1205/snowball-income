import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CLOUD_SYNC_DEBOUNCE_MS,
  createAutosavePush,
  createCloudSyncScheduler,
  type CloudSyncState
} from '@/jotai/snowball/cloud';
import { buildDefaultPayload, normalizePersistedAppState, type PersistedAppStatePayload } from '@/jotai';

/**
 * 클라우드 동기화 순수 로직 — React·Supabase 없이 fake timer + mock으로 결정론 검증한다.
 * (디바운스 합치기, 상태 전이, 비로그인 skip / 오프라인 게이팅, 저장 스키마 왕복.)
 */

const payloadA = (): PersistedAppStatePayload => ({ ...buildDefaultPayload(), savedName: 'A' });
const payloadB = (): PersistedAppStatePayload => ({ ...buildDefaultPayload(), savedName: 'B' });

describe('createCloudSyncScheduler — 디바운스 + 상태 전이', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('디바운스 창 안의 연속 변경은 마지막 payload 하나로 합쳐진다', async () => {
    const pushed: PersistedAppStatePayload[] = [];
    const push = vi.fn(async (p: PersistedAppStatePayload) => {
      pushed.push(p);
      return 'saved' as const;
    });
    const scheduler = createCloudSyncScheduler({ push, onStatus: () => undefined, now: () => 1000 });

    scheduler.schedule(payloadA());
    scheduler.schedule(payloadB()); // 창 안에서 덮어씀
    expect(push).not.toHaveBeenCalled(); // 아직 디바운스 대기

    await vi.advanceTimersByTimeAsync(CLOUD_SYNC_DEBOUNCE_MS);

    expect(push).toHaveBeenCalledTimes(1);
    expect(pushed[0].savedName).toBe('B');
  });

  it('실제 저장 진입 시(onSaving) saving → saved 전이 + lastSavedAt을 주입 now로 기록한다', async () => {
    const states: CloudSyncState[] = [];
    const scheduler = createCloudSyncScheduler({
      // 로그인·온라인 push는 쓰기 직전 onSaving을 부른다
      push: async (_p, ctx) => {
        ctx.onSaving();
        return 'saved';
      },
      onStatus: (s) => states.push(s),
      now: () => 777
    });

    scheduler.schedule(payloadA());
    await vi.advanceTimersByTimeAsync(CLOUD_SYNC_DEBOUNCE_MS);

    expect(states.map((s) => s.status)).toEqual(['saving', 'saved']);
    expect(states[1].lastSavedAt).toBe(777);
  });

  it('비로그인(skipped)은 saving 플래시 없이 idle만 표시한다 (발견 2)', async () => {
    const states: CloudSyncState[] = [];
    // 비로그인 push는 게이트에서 걸러져 onSaving을 부르지 않는다
    const scheduler = createCloudSyncScheduler({ push: async () => 'skipped', onStatus: (s) => states.push(s) });

    scheduler.schedule(payloadA());
    await vi.advanceTimersByTimeAsync(CLOUD_SYNC_DEBOUNCE_MS);

    expect(states.map((s) => s.status)).toEqual(['idle']);
    expect(states.map((s) => s.status)).not.toContain('saving');
  });

  it('오프라인은 saving 플래시 없이 offline만 표시한다', async () => {
    const states: CloudSyncState[] = [];
    const scheduler = createCloudSyncScheduler({ push: async () => 'offline', onStatus: (s) => states.push(s) });

    scheduler.schedule(payloadA());
    await vi.advanceTimersByTimeAsync(CLOUD_SYNC_DEBOUNCE_MS);

    expect(states.map((s) => s.status)).toEqual(['offline']);
    expect(states.map((s) => s.status)).not.toContain('saving');
  });

  it('suspended(충돌 이연)는 onStatus를 부르지 않아 conflict 상태를 유지한다 (헤더 표면화 보존)', async () => {
    const states: CloudSyncState[] = [];
    const scheduler = createCloudSyncScheduler({ push: async () => 'suspended', onStatus: (s) => states.push(s) });

    scheduler.schedule(payloadA());
    await vi.advanceTimersByTimeAsync(CLOUD_SYNC_DEBOUNCE_MS);

    expect(states).toEqual([]); // 상태 전이 없음 — 경계가 세운 'conflict'가 덮이지 않는다
  });

  it('쓰기 진입 후 실패하면 saving → error (로컬은 안전하므로 유실 아님)', async () => {
    const states: CloudSyncState[] = [];
    const scheduler = createCloudSyncScheduler({
      push: async (_p, ctx) => {
        ctx.onSaving(); // 로그인 확인 후 실제 쓰기 중 실패
        throw new Error('network');
      },
      onStatus: (s) => states.push(s)
    });

    scheduler.schedule(payloadA());
    await vi.advanceTimersByTimeAsync(CLOUD_SYNC_DEBOUNCE_MS);

    expect(states.map((s) => s.status)).toEqual(['saving', 'error']);
  });

  it('dispose 후에는 예약된 저장이 실행되지 않는다', async () => {
    const push = vi.fn(async () => 'saved' as const);
    const scheduler = createCloudSyncScheduler({ push, onStatus: () => undefined });

    scheduler.schedule(payloadA());
    scheduler.dispose();
    await vi.advanceTimersByTimeAsync(CLOUD_SYNC_DEBOUNCE_MS * 2);

    expect(push).not.toHaveBeenCalled();
  });
});

describe('createAutosavePush — 로그인/설정/네트워크 게이팅', () => {
  const session = { access_token: 'x' };
  const makeCtx = () => ({ onSaving: vi.fn() });

  it('오프라인이면 IO를 건드리지 않고 offline (onSaving 미호출)', async () => {
    const push = vi.fn(async () => undefined);
    const ctx = makeCtx();
    const outcome = await createAutosavePush({
      getClient: async () => ({}),
      getSession: async () => session,
      push,
      isOnline: () => false
    })(payloadA(), ctx);

    expect(outcome).toBe('offline');
    expect(push).not.toHaveBeenCalled();
    expect(ctx.onSaving).not.toHaveBeenCalled();
  });

  it('커뮤니티 미설정(client 없음)이면 skipped (onSaving 미호출)', async () => {
    const ctx = makeCtx();
    const outcome = await createAutosavePush({
      getClient: async () => null,
      getSession: async () => session,
      push: vi.fn(),
      isOnline: () => true
    })(payloadA(), ctx);

    expect(outcome).toBe('skipped');
    expect(ctx.onSaving).not.toHaveBeenCalled();
  });

  it('비로그인(session 없음)이면 skipped — 클라우드에 쓰지 않고 onSaving도 안 부른다 (발견 2)', async () => {
    const push = vi.fn(async () => undefined);
    const ctx = makeCtx();
    const outcome = await createAutosavePush({
      getClient: async () => ({}),
      getSession: async () => null,
      push,
      isOnline: () => true
    })(payloadA(), ctx);

    expect(outcome).toBe('skipped');
    expect(push).not.toHaveBeenCalled();
    expect(ctx.onSaving).not.toHaveBeenCalled();
  });

  it('충돌 이연 중(isSuspended)이면 로그인·온라인이어도 클라우드 push를 하지 않고 suspended (onSaving 미호출)', async () => {
    const push = vi.fn(async () => undefined);
    const ctx = makeCtx();
    const outcome = await createAutosavePush({
      getClient: async () => ({}),
      getSession: async () => session,
      push,
      isOnline: () => true,
      isSuspended: () => true
    })(payloadA(), ctx);

    expect(outcome).toBe('suspended');
    expect(push).not.toHaveBeenCalled(); // 반대쪽 기기 탭을 덮지 않는다(로컬 저장은 이 경로 밖에서 계속됨)
    expect(ctx.onSaving).not.toHaveBeenCalled();
  });

  it('로그인 상태면 onSaving을 부른 뒤 IO push를 호출하고 saved', async () => {
    const client = { tag: 'client' };
    const push = vi.fn(async () => undefined);
    const ctx = makeCtx();
    const payload = payloadA();

    const outcome = await createAutosavePush({
      getClient: async () => client,
      getSession: async () => session,
      push,
      isOnline: () => true
    })(payload, ctx);

    expect(outcome).toBe('saved');
    expect(ctx.onSaving).toHaveBeenCalledTimes(1);
    expect(push).toHaveBeenCalledWith(client, payload);
  });
});

describe('저장 스키마 왕복 (로컬 = 클라우드 = JSON 하나의 스키마)', () => {
  it('payload를 jsonb 저장(JSON 왕복) 후 정규화해도 동등하다', () => {
    const original = normalizePersistedAppState(buildDefaultPayload());

    // 클라우드 저장 = JSON 직렬화되어 jsonb로 들어갔다 나오는 것과 같다
    const roundTripped = normalizePersistedAppState(JSON.parse(JSON.stringify(original)));

    expect(roundTripped).toEqual(original);
  });
});
