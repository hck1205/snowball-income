import { isSameMeaningfulPayload, isSamePersistedPayload } from '../persistence';
import type { PersistedAppStatePayload } from '../types';

/**
 * 세션 시작 클라우드 워크스페이스 동기화 — **순수 로직(React·Supabase 비의존)**.
 *
 * 전략: **latest-wins 양방향**. 로컬 autosave(IndexedDB)와 클라우드 autosave의 **클라이언트 저장시각**
 * (양쪽 다 Date.now() 기준 — 서버 now()를 섞지 않는다)을 비교해 더 최신인 쪽을 정본으로 삼고, 반대쪽에
 * 반영한다. 로컬·클라우드 둘 다 autosave 미러를 **유지**한다(구 "마이그레이션 후 로컬 정리"는 폐기 — 로컬을
 * 지우지 않는다).
 *
 * 5분기(+IO 실패 보류):
 *  1. **내용 동일** → no-op. 타임스탬프 비교보다 **먼저** 판정해 clock skew로 인한 불필요한 덮어쓰기를 막는다.
 *  2. **클라우드가 더 최신** → 앱에 적용 + **로컬 IndexedDB에도 미러**(cloud→IndexedDB).
 *  3. **로컬이 더 최신** → 클라우드에 push(IndexedDB→cloud).
 *  4. **한쪽만 존재** → 그쪽 채택 후 반대쪽에 반영(클라우드만=적용+로컬미러 / 로컬만=push).
 *  5. **로컬 읽기 실패** → 읽지 못한 쪽을 **절대 덮어쓰지 않는다**. 클라우드가 있으면 조용한 로드(apply)만
 *     하고 로컬 미러·push는 하지 않는다. operation_error(local-read) 계측 후 보류.
 *  + **pull 자체 실패**(throw) → 부작용 없이 안전 종료(local-first, unhandled rejection 없음).
 *  + **동률**(타임스탬프 같음): 내용 동일이면 1번(no-op), 내용 다르면 **클라우드 우선**(공유 정본으로 안정 수렴).
 *
 * 타임스탬프는 로컬=IndexedDB 레코드의 updatedAt, 클라우드=payload에 실린 savedAt(cloudAutosaveTimestamp).
 * 둘 다 클라이언트 Date.now() 기준이라 기기 간 비교가 일관된다. 구버전 데이터(시각 없음)는 undefined→가장
 * 오래된 것으로 취급되지만, 내용이 같으면 1번 분기가 timestamp 무관하게 흡수한다.
 *
 * IO(pull/read/apply/mirror/push)는 전부 주입받는다 — fake로 5분기를 결정론 테스트할 수 있다. cloudSyncEngine이
 * "로직은 IO를 두지 않는다"의 저장 짝이라면, 여기는 세션 시작 짝이다.
 *
 * ⚠ 어떤 경로에서도 DB 통삭제나 이름 슬롯 삭제를 하지 않는다. 로컬 쓰기는 autosave 슬롯 미러 하나뿐이다.
 */

/** 클라우드 autosave 읽기 결과. payload는 정규화된 것, savedAt은 raw에서 뽑은 클라이언트 저장시각(구버전=undefined). */
export type CloudAutosaveRead = { payload: PersistedAppStatePayload; savedAt: number | undefined } | null;

/** 로컬 autosave 읽기 결과. failed(읽기 실패)와 payload=null(빈/기본, 올릴 게 없음)을 구분한다. */
export type LocalAutosaveRead =
  | { status: 'ok'; payload: PersistedAppStatePayload | null; updatedAt: number | undefined }
  | { status: 'failed' };

/** 동기화 계측 신호(무음 실패 금지). 계측 매핑은 경계(훅)가 한다 — 엔진은 순수. */
export type CloudWorkspaceSyncEvent =
  | { type: 'applied-cloud' } // cloud→local: 클라우드가 최신 → 적용 + 로컬 미러
  | { type: 'pushed-local' } // local→cloud: 로컬이 최신 → 클라우드에 push
  | { type: 'noop' } // 이미 동기(내용 동일) 또는 양쪽 비어 있음
  | { type: 'failed'; reason: 'local-read' | 'push-error' | 'mirror-error' };

export type CloudWorkspaceSyncDeps = {
  /** 클라우드 autosave 슬롯 pull(정규화 payload + savedAt). 없으면 null. */
  pullCloudAutosave: () => Promise<CloudAutosaveRead>;
  /** 로컬 autosave 읽기(정규화 payload + updatedAt). failed면 덮어쓰기를 보류한다. */
  readLocalAutosave: () => Promise<LocalAutosaveRead>;
  /** 현재(이 기기) 앱 payload — apply가 "리렌더 불필요"를 판단하는 기준. */
  getCurrentPayload: () => PersistedAppStatePayload;
  /** 클라우드 payload를 이 기기 앱에 적용(조용한 로드). */
  applyPayload: (payload: PersistedAppStatePayload) => void;
  /** 클라우드 정본을 로컬 IndexedDB autosave에 미러(cloud→IndexedDB). */
  writeLocalAutosave: (payload: PersistedAppStatePayload) => Promise<void>;
  /** 로컬 payload를 클라우드 autosave로 push(savedAt은 원본 편집시각을 심는다). */
  pushCloudAutosave: (payload: PersistedAppStatePayload, savedAt: number) => Promise<void>;
  /** savedAt 폴백용 시각(로컬 updatedAt이 없을 때). 결정론 테스트를 위해 주입. */
  now?: () => number;
  /** 계측 신호(선택). */
  onEvent?: (event: CloudWorkspaceSyncEvent) => void;
};

/** 클라우드 payload가 현재 앱과 다를 때만 적용(불필요한 리렌더·재저장 회피). */
const applyIfChanged = (deps: CloudWorkspaceSyncDeps, payload: PersistedAppStatePayload): void => {
  if (!isSamePersistedPayload(payload, deps.getCurrentPayload())) deps.applyPayload(payload);
};

/**
 * 정본 결정. 내용이 다른 두(또는 한쪽) payload에서 어느 쪽이 최신인지 판정한다.
 *  - 한쪽만 존재 → 존재하는 쪽.
 *  - 둘 다 존재 → 타임스탬프 비교, 동률이면 클라우드 우선(공유 정본으로 안정 수렴).
 */
const cloudIsCanonical = (
  cloud: CloudAutosaveRead,
  localPayload: PersistedAppStatePayload | null,
  localUpdatedAt: number | undefined
): boolean => {
  if (cloud && !localPayload) return true;
  if (!cloud && localPayload) return false;
  const cloudTime = cloud?.savedAt ?? 0;
  const localTime = localUpdatedAt ?? 0;
  if (cloudTime > localTime) return true;
  if (localTime > cloudTime) return false;
  return true; // 동률 → 클라우드 우선
};

export const syncCloudWorkspaceAtSessionStart = async (deps: CloudWorkspaceSyncDeps): Promise<void> => {
  let cloud: CloudAutosaveRead;
  try {
    cloud = await deps.pullCloudAutosave();
  } catch {
    // 클라우드 상태를 못 읽음(테이블 미배포·네트워크) → 아무것도 하지 않는다(local-first, 안전).
    // unhandled rejection도 남기지 않는다.
    return;
  }

  const local = await deps.readLocalAutosave();

  // 5) 로컬 읽기 실패 → 읽지 못한 쪽을 절대 덮어쓰지 않는다. 클라우드가 있으면 조용한 로드만.
  if (local.status === 'failed') {
    if (cloud) applyIfChanged(deps, cloud.payload);
    deps.onEvent?.({ type: 'failed', reason: 'local-read' });
    return;
  }

  const localPayload = local.payload;

  // 양쪽 다 비어 있음 → 할 일 없음.
  if (!cloud && !localPayload) {
    deps.onEvent?.({ type: 'noop' });
    return;
  }

  // 1) 내용 동일(의미있는 관점) → no-op. 타임스탬프 비교보다 먼저(clock skew 방지).
  if (cloud && localPayload && isSameMeaningfulPayload(cloud.payload, localPayload)) {
    deps.onEvent?.({ type: 'noop' });
    return;
  }

  // 2·4) 클라우드가 정본 → 적용 + 로컬 미러.
  if (cloudIsCanonical(cloud, localPayload, local.updatedAt) && cloud) {
    applyIfChanged(deps, cloud.payload);
    try {
      await deps.writeLocalAutosave(cloud.payload);
    } catch {
      // 미러 실패 → 앱에는 적용됨, 로컬은 다음 자동저장이 따라잡는다. 무음 실패 금지.
      deps.onEvent?.({ type: 'failed', reason: 'mirror-error' });
      return;
    }
    deps.onEvent?.({ type: 'applied-cloud' });
    return;
  }

  // 3·4) 로컬이 정본 → 클라우드에 push(원본 편집시각을 savedAt으로 심는다).
  if (localPayload) {
    const now = deps.now ?? Date.now;
    try {
      await deps.pushCloudAutosave(localPayload, local.updatedAt ?? now());
    } catch {
      // push 실패 → 로컬 보존(로컬을 정본으로 이미 갖고 있음). 무음 실패 금지.
      deps.onEvent?.({ type: 'failed', reason: 'push-error' });
      return;
    }
    deps.onEvent?.({ type: 'pushed-local' });
  }
};
