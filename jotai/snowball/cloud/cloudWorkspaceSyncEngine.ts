import { isSameMeaningfulPayload, isSamePersistedPayload, serializeMeaningfulPayload } from '../persistence';
import type { PersistedAppStatePayload } from '../types';
import { isWorkspaceSubsumedBy } from './cloudWorkspaceReconcile';

/**
 * 세션 시작 클라우드 워크스페이스 동기화 — **순수 로직(React·Supabase 비의존)**.
 *
 * 전략: **latest-wins 양방향**. 로컬 autosave(IndexedDB)와 클라우드 autosave의 **클라이언트 저장시각**
 * (양쪽 다 Date.now() 기준 — 서버 now()를 섞지 않는다)을 비교해 더 최신인 쪽을 정본으로 삼고, 반대쪽에
 * 반영한다. 로컬·클라우드 둘 다 autosave 미러를 **유지**한다(구 "마이그레이션 후 로컬 정리"는 폐기 — 로컬을
 * 지우지 않는다).
 *
 * 분기(+IO 실패 보류):
 *  1. **내용 동일** → no-op. 타임스탬프 비교보다 **먼저** 판정해 clock skew로 인한 불필요한 덮어쓰기를 막는다.
 *  1.3 **merge-base 3-way**(base 주입 시 우선): per-user 마지막 동기화 기준 해시(base=`serializeMeaningfulPayload`)로
 *     "로컬/클라우드가 **각각 base에서 바뀌었나**"를 판정한다. 타임스탬프 휴리스틱의 구조적 사각(진짜 발산·모호
 *     타임스탬프를 전부 conflict로 남겨 다기기 핑퐁을 유발)을 없앤다.
 *      · **로컬만** 변함(cloud==base) → 로컬을 FF push(무손실). 삭제·추가 모두 포함(1.45 삭제레이스를 시각 없이 흡수).
 *      · **클라우드만** 변함(local==base) → 이 기기 미편집 → 클라우드 FF apply+미러(무손실).
 *      · **양쪽 다** 변함 → 진짜 동시편집 → conflict(모달 1회). 해결 시 base 갱신 → 재발 없음.
 *     base가 없으면(레거시·신규 기기·localStorage 불가) 이 블록을 건너뛰고 아래 1.4/1.45/1.5 휴리스틱으로 **폴백**한다.
 *     게이트는 1.5와 같다(둘 다 내용 있음). 어느 종단 수렴(noop/applied-cloud/pushed-local)에서든 합의 해시로 base를 확립한다.
 *  1.4 **클라우드 ⊆ 로컬**(모든 클라우드 탭이 로컬에 그대로 있음) → 충돌이 아니라 "로컬이 앞서 있음".
 *     묻지 않고 로컬을 push한다(무손실 — 블렌드해도 로컬과 같은 결과).
 *  1.45 **로컬 ⊂ 클라우드 + 로컬이 엄격히 더 최근 편집**(양쪽 시각 정의 + localUpdatedAt > cloudSavedAt)
 *     → 이 기기가 방금 탭을 지우고 새로고침한 레이스(같은 클럭이라 신뢰됨). 삭제가 이겨 로컬을 push한다.
 *     반대(클라우드가 더 최근=다른 기기가 추가)나 타임스탬프 모호(하나라도 undefined)는 1.5 충돌로.
 *  1.5 **충돌**(로컬·클라우드 둘 다 내용 있고 의미있게 다르며 위 1.4/1.45에 해당 안 함) → 자동 화해 금지.
 *     `conflict` 이벤트만 방출하고 **어느 쪽도 apply/mirror/push하지 않는다**(순수·비파괴). 정본 결정은
 *     경계(모달)가 사용자에게 위임한다 — 무음 last-write-wins가 반대쪽 기기의 탭을 조용히 덮던 유실을 막는다.
 *  2. **클라우드가 더 최신**(한쪽만 존재 등 충돌 아님) → 앱에 적용 + **로컬 IndexedDB에도 미러**(cloud→IndexedDB).
 *  3. **로컬이 더 최신** → 클라우드에 push(IndexedDB→cloud).
 *  4. **한쪽만 존재** → 그쪽 채택 후 반대쪽에 반영(클라우드만=적용+로컬미러 / 로컬만=push).
 *  5. **로컬 읽기 실패** → 읽지 못한 쪽을 **절대 덮어쓰지 않는다**. 클라우드가 있으면 조용한 로드(apply)만
 *     하고 로컬 미러·push는 하지 않는다. operation_error(local-read) 계측 후 보류.
 *  + **pull 자체 실패**(throw) → 부작용 없이 안전 종료(local-first, unhandled rejection 없음).
 *  + **한쪽만 존재/빈 클라우드 슬롯 등 비충돌 동률**(타임스탬프 같음): 내용 동일이면 1번(no-op),
 *     내용 다르면 **클라우드 우선**(공유 정본으로 안정 수렴). 둘 다 내용 있고 다르면 1.5 충돌이 먼저 가로챈다.
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
  // 충돌: 로컬·클라우드 **둘 다 내용 있고** 의미있게 다름 → 자동 화해 대신 경계(모달)로 위임한다.
  // 엔진은 이 이벤트만 방출하고 **어느 쪽도 apply/mirror/push하지 않는다**(순수·비파괴). local/cloud는 후보
  // payload, 타임스탬프는 요약(마지막 편집시각) 표시용이다(정본 결정은 사용자 몫이라 여기선 비교하지 않는다).
  | {
      type: 'conflict';
      local: PersistedAppStatePayload;
      cloud: PersistedAppStatePayload;
      localUpdatedAt: number | undefined;
      cloudSavedAt: number | undefined;
    }
  | { type: 'failed'; reason: 'local-read' | 'push-error' | 'mirror-error' };

/**
 * "내용 있음" 판정 — 어느 시나리오든 티커 프로필이 하나라도 있으면 정본 후보다.
 * 세션 시작 로컬 read(sessionLocalAutosave의 toLocalAutosaveRead)와 **같은 규칙**을 클라우드에도 적용해
 * 충돌 감지의 "둘 다 내용 있고"를 대칭으로 판정한다.
 */
const hasContent = (payload: PersistedAppStatePayload): boolean =>
  payload.scenarios.some((scenario) => scenario.portfolio.tickerProfiles.length > 0);

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
  /**
   * 마지막 동기화 기준 해시(merge-base) 읽기. `undefined`면 base 없음 → 종전 휴리스틱 폴백(하위호환).
   * 순수·결정론 유지를 위해 주입한다(엔진이 localStorage를 직접 만지지 않는다). 미주입=폴백.
   */
  readBase?: () => string | undefined;
  /**
   * 수렴(noop/applied-cloud/pushed-local) 시 합의된 payload의 해시를 기록한다 — 다음 세션의 3-way 기준.
   * 충돌(conflict)·실패에는 부르지 않는다(합의가 없으므로). 미주입=no-op(폴백 모드).
   */
  writeBase?: (hash: string) => void;
  /**
   * **전역 로컬 autosave가 현재 사용자가 아닌 다른 계정 것인지**(M1 계정전환 감지). true면 로컬을 정본으로
   * 삼는 어떤 무음 화해(FF-push/1.4/1.45)도 금지하고 **conflict(보호 모달)** 로 위임한다 — per-user base와 달리
   * 로컬 IndexedDB는 전역이라, A→B→A 전환 시 B의 로컬로 A의 클라우드를 조용히 덮는 손실을 막는다.
   * 미주입/false = 소유 정보 없음/현재 사용자 소유 → 종전대로(하위호환, 기존 테스트 무변경).
   */
  isForeignLocalWorkspace?: () => boolean;
  /** savedAt 폴백용 시각(로컬 updatedAt이 없을 때). 결정론 테스트를 위해 주입. */
  now?: () => number;
  /** 계측 신호(선택). */
  onEvent?: (event: CloudWorkspaceSyncEvent) => void;
};

/** 클라우드 payload가 현재 앱과 다를 때만 적용(불필요한 리렌더·재저장 회피). */
const applyIfChanged = (deps: CloudWorkspaceSyncDeps, payload: PersistedAppStatePayload): void => {
  if (!isSamePersistedPayload(payload, deps.getCurrentPayload())) deps.applyPayload(payload);
};

/** 수렴 시 합의 payload의 의미있는 해시를 base로 확립(다음 세션 3-way 기준). writeBase 미주입=no-op(폴백). */
const recordBase = (deps: CloudWorkspaceSyncDeps, payload: PersistedAppStatePayload): void => {
  deps.writeBase?.(serializeMeaningfulPayload(payload));
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

/** 로컬 정본 → 클라우드 push(원본 편집시각을 savedAt으로 심는다). 실패는 무음이 아니라 이벤트로 알린다. */
const pushLocal = async (
  deps: CloudWorkspaceSyncDeps,
  localPayload: PersistedAppStatePayload,
  localUpdatedAt: number | undefined
): Promise<void> => {
  const now = deps.now ?? Date.now;
  try {
    await deps.pushCloudAutosave(localPayload, localUpdatedAt ?? now());
  } catch {
    // push 실패 → 로컬 보존(로컬을 정본으로 이미 갖고 있음). 무음 실패 금지. base는 갱신하지 않는다(수렴 실패).
    deps.onEvent?.({ type: 'failed', reason: 'push-error' });
    return;
  }
  // 로컬 = 양쪽 정본으로 수렴 → base 확립.
  recordBase(deps, localPayload);
  deps.onEvent?.({ type: 'pushed-local' });
};

/** 클라우드 정본 → 앱 적용 + 로컬 미러 + base 확립. 미러 실패는 이벤트로 알린다(무음 금지, base 갱신 안 함). */
const applyCloud = async (deps: CloudWorkspaceSyncDeps, cloudPayload: PersistedAppStatePayload): Promise<void> => {
  applyIfChanged(deps, cloudPayload);
  try {
    await deps.writeLocalAutosave(cloudPayload);
  } catch {
    // 미러 실패 → 앱에는 적용됨, 로컬은 다음 자동저장이 따라잡는다. 무음 실패 금지. base는 갱신하지 않는다.
    deps.onEvent?.({ type: 'failed', reason: 'mirror-error' });
    return;
  }
  // 클라우드 = 양쪽 정본으로 수렴 → base 확립.
  recordBase(deps, cloudPayload);
  deps.onEvent?.({ type: 'applied-cloud' });
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
    // 이미 양쪽이 합의 상태 → 그 내용을 base로 확립(base가 비었던 기기도 여기서 자동 확립).
    recordBase(deps, localPayload);
    deps.onEvent?.({ type: 'noop' });
    return;
  }

  // 1.25) **M1 계정전환 보호**: 둘 다 내용 있는데(진짜 화해 영역) 전역 로컬 autosave가 **다른 계정 것**이면,
  //   로컬을 정본으로 삼는 어떤 무음 화해(FF-push/1.4/1.45)도 이 사용자의 클라우드를 남의 데이터로 덮을 수 있다
  //   (per-user base ↔ 전역 로컬의 불일치). base 도입 전엔 이 상황이 conflict 모달이었다 → 그 **보호 모달을
  //   복원**한다. 정상 오프라인 편집(같은 계정)은 owner==현재라 여기 안 걸리고 아래 조용한 FF로 간다.
  if (cloud && localPayload && hasContent(localPayload) && hasContent(cloud.payload) && deps.isForeignLocalWorkspace?.()) {
    deps.onEvent?.({
      type: 'conflict',
      local: localPayload,
      cloud: cloud.payload,
      localUpdatedAt: local.updatedAt,
      cloudSavedAt: cloud.savedAt
    });
    return;
  }

  // 1.3) merge-base 3-way(base 주입 시 우선). "로컬/클라우드가 각각 base에서 바뀌었나"로 판정한다.
  //   base가 있으면 타임스탬프 휴리스틱(1.4/1.45/1.5)보다 정확하다 — 진짜 발산·모호 타임스탬프를 전부
  //   conflict로 남겨 다기기 핑퐁을 유발하던 구조적 사각을 없앤다. 게이트는 1.5와 같다(둘 다 내용 있음).
  //   base가 없으면(레거시·신규 기기·localStorage 불가) 이 블록을 건너뛰어 아래 휴리스틱으로 폴백한다(하위호환).
  const base = deps.readBase?.();
  if (base !== undefined && cloud && localPayload && hasContent(localPayload) && hasContent(cloud.payload)) {
    // 여기 도달 = 1)에서 안 걸림 → 로컬·클라우드가 의미있게 다름 → 최소 한쪽은 base와도 다르다.
    const localChanged = serializeMeaningfulPayload(localPayload) !== base;
    const cloudChanged = serializeMeaningfulPayload(cloud.payload) !== base;
    if (localChanged && !cloudChanged) {
      // 로컬만 base에서 전진(클라우드는 아직 base) → 무손실 FF push. 삭제·추가 모두 흡수(1.45를 시각 없이 대체).
      await pushLocal(deps, localPayload, local.updatedAt);
      return;
    }
    if (cloudChanged && !localChanged) {
      // 클라우드만 base에서 전진(이 기기는 미편집, local==base) → 무손실 FF apply+미러.
      await applyCloud(deps, cloud.payload);
      return;
    }
    // 양쪽 다 base에서 변함 → 진짜 동시편집 → 자동 병합 금지(유실 위험), 경계(모달)로 위임. base는 갱신 안 함
    // (합의 없음 — 해결 시 resolveWith가 갱신해 재발을 끊는다).
    deps.onEvent?.({
      type: 'conflict',
      local: localPayload,
      cloud: cloud.payload,
      localUpdatedAt: local.updatedAt,
      cloudSavedAt: cloud.savedAt
    });
    return;
  }

  // 1.5) 충돌: 로컬·클라우드 둘 다 내용 있고(각자 티커 존재) 의미있게 다름 → 자동 화해 금지, 경계로 위임.
  //   여기까지 왔다면 1)에서 걸러지지 않았으므로 (둘 다 존재 시) 이미 의미있게 다르다. 무음 last-write-wins가
  //   반대쪽 탭을 조용히 덮던 다기기 유실을 막기 위해, 아래 두 거짓충돌 케이스를 제외하면 **어느 쪽도 건드리지
  //   않고** conflict만 방출한다. 한쪽만 내용 있음(빈 클라우드 슬롯 등)은 여기서 걸러 아래 latest-wins 무음
  //   처리로 남긴다(결정 §1).
  //
  //   거짓 충돌 제거 두 갈래:
  //   ① **클라우드 ⊆ 로컬**(모든 클라우드 탭이 로컬에 그대로 있음) → 로컬을 정본으로 삼아도 잃을 시나리오가
  //      없다(블렌드해도 로컬과 같은 결과). "로컬이 앞서 있음"이므로 방향·타임스탬프 무관하게 묻지 않고 push.
  //   ② **로컬 ⊂ 클라우드 + 로컬이 더 최근 편집**(localUpdatedAt·cloudSavedAt 둘 다 정의 + 엄격 부등호로
  //      localUpdatedAt > cloudSavedAt) → 이 기기가 방금 탭을 지우고 새로고침한 레이스다(같은 클럭이라
  //      신뢰됨: cloud.savedAt은 삭제 이전 {…}를 마지막 push한 시각, local.updatedAt은 그 뒤 삭제 시각).
  //      삭제가 이겨 로컬을 정본으로 push(conflict 안 냄). ⚠ 반대(cloudSavedAt ≥ localUpdatedAt)는 **다른
  //      기기가 탭을 추가**한 것이라 그 추가분을 날리면 안 되고, 타임스탬프가 하나라도 undefined(레거시·모호)면
  //      판정 불가라, 둘 다 **conflict로 남겨 사용자에게 묻는다**(데이터 유실 방지). 포함관계(로컬 ⊂ 클라우드)가
  //      아닌 진짜 발산(부분 겹침)은 로컬이 더 최근이어도 순수 삭제가 아니므로 여전히 conflict.
  if (cloud && localPayload && hasContent(localPayload) && hasContent(cloud.payload)) {
    // ① 클라우드 ⊆ 로컬 → 무손실, 묻지 않고 로컬 push.
    if (isWorkspaceSubsumedBy(cloud.payload, localPayload)) {
      await pushLocal(deps, localPayload, local.updatedAt);
      return;
    }
    // ② 로컬 ⊂ 클라우드 + 로컬이 엄격히 더 최근 → 이 기기의 삭제→새로고침 레이스. 삭제가 이긴다.
    const localUpdatedAt = local.updatedAt;
    const cloudSavedAt = cloud.savedAt;
    if (
      isWorkspaceSubsumedBy(localPayload, cloud.payload) &&
      localUpdatedAt !== undefined &&
      cloudSavedAt !== undefined &&
      localUpdatedAt > cloudSavedAt
    ) {
      await pushLocal(deps, localPayload, localUpdatedAt);
      return;
    }
    // 그 외(진짜 발산 / 다른 기기가 추가 / 타임스탬프 모호) → 사용자에게 묻는다(유실 방지).
    deps.onEvent?.({
      type: 'conflict',
      local: localPayload,
      cloud: cloud.payload,
      localUpdatedAt: local.updatedAt,
      cloudSavedAt: cloud.savedAt
    });
    return;
  }

  // 2·4) 클라우드가 정본 → 적용 + 로컬 미러(+ base 확립).
  if (cloudIsCanonical(cloud, localPayload, local.updatedAt) && cloud) {
    await applyCloud(deps, cloud.payload);
    return;
  }

  // 3·4) 로컬이 정본 → 클라우드에 push(원본 편집시각을 savedAt으로 심는다, + base 확립).
  if (localPayload) await pushLocal(deps, localPayload, local.updatedAt);
};
