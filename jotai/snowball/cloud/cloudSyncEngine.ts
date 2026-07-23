import type { PersistedAppStatePayload } from '../types';

/**
 * 클라우드 자동 동기화 엔진 — **순수 로직(React·Supabase 비의존)**.
 *
 * IO(getSupabaseClient/세션/PostgREST)는 전부 주입받는다. 그래서 디바운스·상태 전이·
 * 비로그인 skip·오프라인 판정을 fake timer + mock으로 결정론적으로 테스트할 수 있다.
 * (queries.ts가 "IO는 로직을 두지 않는다"면, 여기는 "로직은 IO를 두지 않는다"의 짝이다.)
 */

// 'conflict' = 세션 시작 디바이스↔클라우드 충돌이 화해되지 않은 상태. 이 동안 클라우드 push는 정지되고
// (로컬 autosave는 정상), 헤더 인디케이터가 표면화한다. 화해되면 다른 상태로 빠져나온다.
export type CloudSyncStatus = 'idle' | 'saving' | 'saved' | 'error' | 'offline' | 'conflict';

/** 저장 상태 + 마지막으로 클라우드에 올라간 시각(없으면 null). UI 인디케이터(§8.3)가 읽는다. */
export type CloudSyncState = {
  status: CloudSyncStatus;
  lastSavedAt: number | null;
};

export const INITIAL_CLOUD_SYNC_STATE: CloudSyncState = { status: 'idle', lastSavedAt: null };

/** 디바운스 폭 — 로컬(120ms)보다 넓게 잡아 쓰기 증폭·무료 티어를 보호한다(§D5: 3~5초). */
export const CLOUD_SYNC_DEBOUNCE_MS = 4000;

/**
 * push 결과.
 *  - saved     : 클라우드에 반영됨
 *  - skipped   : 비로그인/커뮤니티 미설정 → 클라우드는 건드리지 않음(로컬 저장은 별도로 이미 됨)
 *  - offline   : 네트워크 없음 → 연결되면 다음 변경에서 다시 시도
 *  - suspended : 미해결 충돌 이연 중 → 클라우드 push만 정지(로컬은 별도로 계속 저장). 상태를 **바꾸지 않는다**
 *                (스케줄러가 'conflict' 상태를 유지해야 헤더가 표면화하고 다음 변경에도 계속 정지된다).
 * throw는 실패(error)로 취급한다.
 */
export type CloudPushOutcome = 'saved' | 'skipped' | 'offline' | 'suspended';

/**
 * push 실행 컨텍스트. `onSaving`은 push가 **실제로 클라우드에 쓰기 시작할 때만**(로그인·온라인 확인
 * 후) 호출한다 — 스케줄러는 이 신호를 받고 나서야 'saving'을 방출한다. 비로그인/오프라인은 onSaving을
 * 부르지 않으므로 "저장 중"이 번쩍였다 사라지는 일이 없다(local-first 정직성).
 */
export type CloudPushContext = { onSaving: () => void };
export type CloudPushFn = (payload: PersistedAppStatePayload, ctx: CloudPushContext) => Promise<CloudPushOutcome>;

export type CloudSyncScheduler = {
  /** 최신 payload를 예약한다. 디바운스 창 안의 연속 호출은 마지막 것으로 합쳐진다. */
  schedule: (payload: PersistedAppStatePayload) => void;
  /** 대기 중인 저장을 즉시 실행한다(언마운트/페이지 이탈 직전 flush 용). */
  flush: () => Promise<void>;
  /** 타이머 정리(언마운트). */
  dispose: () => void;
};

/**
 * 디바운스 스케줄러. onStatus로 상태 전이를 밖에 알린다(atom 갱신은 호출자 몫).
 *
 * 전이(로그인·온라인): schedule → (debounce) → saving → { saved | error }.
 * 전이(비로그인/오프라인): saving을 건너뛰고 곧장 { idle(skipped) | offline } — "저장 중" 플래시 없음.
 * 저장 중(inFlight) 새 변경이 들어오면 완료 후 자동으로 이어서 저장한다(마지막 값 보존).
 */
export const createCloudSyncScheduler = (opts: {
  push: CloudPushFn;
  onStatus: (state: CloudSyncState) => void;
  /**
   * 클라우드에 **실제 반영된**('saved') 직후, **그때 push된 payload**로 호출된다(현재값 아님).
   * merge-base 갱신 훅 — 경계(useCloudSync)가 이 payload 해시를 base로 기록한다. skipped/offline/
   * suspended/error에는 부르지 않는다. ⚠ 반드시 인자로 받은 payload를 쓸 것: run() 진입 시 캡처된
   * 그 payload라, push 완료를 기다리는 사이 사용자가 더 편집했어도(현재값 전진) base가 클라우드보다 앞서지 않는다.
   */
  onSaved?: (payload: PersistedAppStatePayload) => void;
  debounceMs?: number;
  now?: () => number;
}): CloudSyncScheduler => {
  const debounceMs = opts.debounceMs ?? CLOUD_SYNC_DEBOUNCE_MS;
  const now = opts.now ?? Date.now;

  let timer: ReturnType<typeof setTimeout> | null = null;
  let pending: PersistedAppStatePayload | null = null;
  let lastSavedAt: number | null = null;
  let inFlight = false;

  const arm = () => {
    if (timer !== null) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      void run();
    }, debounceMs);
  };

  const run = async () => {
    if (pending === null || inFlight) return;
    const payload = pending;
    pending = null;
    inFlight = true;

    // 'saving'은 push가 실제 쓰기에 진입할 때만(onSaving 콜백) 방출한다 — 비로그인/오프라인은
    // 게이트에서 걸러져 onSaving을 안 부르므로 "저장 중" 플래시가 없다(발견 2).
    const markSaving = () => opts.onStatus({ status: 'saving', lastSavedAt });

    try {
      const outcome = await opts.push(payload, { onSaving: markSaving });
      if (outcome === 'saved') {
        lastSavedAt = now();
        // base는 **방금 push된 이 payload**로 갱신한다(현재값이 아니라 run() 진입 시 캡처된 payload).
        opts.onSaved?.(payload);
        opts.onStatus({ status: 'saved', lastSavedAt });
      } else if (outcome === 'offline') {
        opts.onStatus({ status: 'offline', lastSavedAt });
      } else if (outcome === 'suspended') {
        // 충돌 이연 중 — 클라우드 push만 걸렀다. 상태는 **건드리지 않는다**(경계가 세운 'conflict'를
        // 'idle'/'saved'로 덮으면 헤더 표면화가 사라진다). 로컬 write는 이 경로 밖에서 이미 됐다.
      } else {
        // skipped(비로그인) — 클라우드 상태는 idle. 실패가 아니므로 error로 보이지 않는다.
        opts.onStatus({ status: 'idle', lastSavedAt });
      }
    } catch {
      // 실패해도 로컬에는 저장돼 있다 — 상태만 error로 표시(데이터 유실 없음, §8.2).
      opts.onStatus({ status: 'error', lastSavedAt });
    } finally {
      inFlight = false;
      if (pending !== null) arm();
    }
  };

  return {
    schedule: (payload) => {
      pending = payload;
      arm();
    },
    flush: async () => {
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
      await run();
    },
    dispose: () => {
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
    }
  };
};

/**
 * 자동 저장 push 팩토리 — 비로그인/미설정/오프라인/충돌이연 게이팅을 IO 주입으로 결정론화한다.
 *
 * 게이트 순서: 오프라인 → **충돌 이연(suspended)** → 미설정(client 없음) → 비로그인(session 없음) →
 * ctx.onSaving() → 실제 저장. `isSuspended`는 미해결 충돌 이연 중(=`cloudSyncStateAtom.status==='conflict'`)이면
 * true를 주입받아, 클라우드 push만 걸러 반대쪽 기기 탭을 덮지 않게 한다. `onSaving`을 모든 게이트를 통과한
 * 뒤에만 부르므로 'saving'은 로그인·온라인·비이연일 때만 뜬다(발견 2). 로컬 자동 저장은 이 경로와 무관하게 돈다.
 */
export const createAutosavePush = <TClient, TSession>(deps: {
  getClient: () => Promise<TClient | null>;
  getSession: (client: TClient) => Promise<TSession | null>;
  push: (client: TClient, payload: PersistedAppStatePayload) => Promise<unknown>;
  isOnline?: () => boolean;
  /** 미해결 충돌 이연 여부(라이브 읽기). true면 클라우드 push만 정지한다(suspended). 기본 false. */
  isSuspended?: () => boolean;
}): CloudPushFn => {
  const isOnline = deps.isOnline ?? (() => typeof navigator === 'undefined' || navigator.onLine !== false);
  const isSuspended = deps.isSuspended ?? (() => false);

  return async (payload, ctx) => {
    if (!isOnline()) return 'offline';
    // 오프라인 다음, 로그인 확인보다 먼저 판정한다 — 이연 중엔 세션이 있어도 클라우드를 건드리지 않는다.
    if (isSuspended()) return 'suspended';
    const client = await deps.getClient();
    if (!client) return 'skipped';
    const session = await deps.getSession(client);
    if (!session) return 'skipped';
    ctx.onSaving();
    await deps.push(client, payload);
    return 'saved';
  };
};
