import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { serializeMeaningfulPayload, writePersistedAppState, type PersistedAppStatePayload } from '@/jotai';
import {
  readLocalOwner,
  readSyncBase,
  resolveWithBlend,
  resolveWithCloud,
  resolveWithDevice,
  summarizeReconciliation,
  syncCloudWorkspaceAtSessionStart,
  useCloudSavedStates,
  useCloudConflictValue,
  useSetCloudConflictWrite,
  useSetCloudSyncStateWrite,
  writeLocalOwner,
  writeSyncBase,
  type CloudReconciliationSummary,
  type CloudWorkspaceConflict,
  type CloudWorkspaceSyncEvent,
  type LocalAutosaveRead,
  type WorkspaceReconcileDeps
} from '@/jotai/snowball/cloud';
import { useIsLoggedInAtomValue, useSessionAtomValue } from '@/jotai/community';
import { ANALYTICS_EVENT, readAndClearLoginSource, track, trackEvent } from '@/shared/lib/analytics';

/** latest-wins 동기화 신호를 GA4로 매핑한다(엔진은 순수 → 발화는 이 경계에서). conflict는 별도 처리(무발화). */
const trackSyncEvent = (event: Exclude<CloudWorkspaceSyncEvent, { type: 'conflict' }>): void => {
  switch (event.type) {
    case 'applied-cloud':
      trackEvent(ANALYTICS_EVENT.CLOUD_SYNC_RECONCILED, { direction: 'cloud_to_local' });
      break;
    case 'pushed-local':
      trackEvent(ANALYTICS_EVENT.CLOUD_SYNC_RECONCILED, { direction: 'local_to_cloud' });
      break;
    case 'noop':
      trackEvent(ANALYTICS_EVENT.CLOUD_SYNC_RECONCILED, { direction: 'noop' });
      break;
    case 'failed':
      trackEvent(ANALYTICS_EVENT.OPERATION_ERROR, { operation: 'cloud_sync', reason: event.reason });
      break;
  }
};

/**
 * "이 워크스페이스에 실제 내용이 있나" — 엔진의 충돌 감지 게이트와 **같은 규칙**(티커 프로필 존재).
 * 라이브 payload를 디바이스 정본으로 채택해도 되는지 판단할 때 쓴다(빈 화면으로 클라우드를 덮지 않게).
 */
const hasWorkspaceContent = (payload: PersistedAppStatePayload): boolean =>
  payload.scenarios.some((scenario) => scenario.portfolio.tickerProfiles.length > 0);

/** 모달·헤더가 소비하는 화해 API. `useCloudWorkspaceSync`의 반환값. */
export type CloudReconciliationApi = {
  /** 미해결 충돌 스냅샷(없으면 null). 모달 표시 게이트로 쓴다. */
  conflict: CloudWorkspaceConflict | null;
  /** 좌(디바이스)/우(클라우드) 요약 — 탭 개수·이름 목록·마지막 편집시각. conflict가 null이면 null. */
  summary: CloudReconciliationSummary | null;
  /** 화해 IO 진행 중(버튼 중복 클릭 방지 + "반영 중" 표시). */
  isResolving: boolean;
  /** 화해 IO가 실패했는지. 모달이 오류를 표시하고 같은 버튼으로 재시도할 수 있게 한다(무음 실패 금지). */
  hasResolveFailed: boolean;
  /** 디바이스(로컬) 채택 → 클라우드 덮어씀. */
  resolveWithDevice: () => void;
  /** 클라우드 채택 → 앱 적용 + 로컬 미러. */
  resolveWithCloud: () => void;
  /** 블렌드(합집합·비파괴) → 양쪽 반영. */
  resolveWithBlend: () => void;
  /** 이연(결정 없이 닫기) → 디바이스 상태 유지 + 세션 내 클라우드 push 정지(로컬 저장은 정상). */
  deferConflict: () => void;
};

/**
 * 세션 시작 시 클라우드 워크스페이스를 동기화하고, **진짜 충돌 시에만 화해 API를 노출**한다(Policy A).
 *
 * - 무음 동기화 유지 케이스(한쪽만 존재·동일·로컬읽기실패·pull실패)는 순수 엔진이 종전대로 처리한다.
 * - **merge-base 3-way**: base가 있으면 "한쪽만 base에서 변함"은 **조용한 fast-forward**(모달 없음)이고,
 *   **양쪽 다 base에서 변함**(진짜 동시편집)일 때만 엔진이 `conflict`를 방출한다(base 없으면 휴리스틱 폴백).
 *   이 훅은 그때 충돌 스냅샷을 `cloudConflictAtom`에 담고 `cloudSyncStateAtom`을 **'conflict'**로 바꾼다
 *   (→ 클라우드 push 정지 + 헤더 표면화). 정본 결정은 모달이 부르는 resolve/defer 액션으로 사용자가 한다.
 * - 화해 성공 시 **base를 갱신**해 다음 세션 재발을 끊는다(다기기 핑퐁 종식). defer(미해결)는 base를 안 바꾼다.
 * - **세션당 1회** 실행(로그아웃 시 리셋 + 미해결 충돌 정리). 로컬 read는 하이드레이션과 공유한다.
 */
export const useCloudWorkspaceSync = (deps: {
  isPortfolioHydrated: boolean;
  buildPayload: () => PersistedAppStatePayload;
  applyPersistedPayload: (payload: PersistedAppStatePayload) => void;
  /** 하이드레이션이 세션 시작에 읽어 캐시한 로컬 autosave를 재사용하는 리더(로컬 read 1회 공유). */
  readLocalAutosave: () => Promise<LocalAutosaveRead>;
}): CloudReconciliationApi => {
  const { isPortfolioHydrated } = deps;
  const { pullAutosave, pushAutosave } = useCloudSavedStates();
  const isLoggedIn = useIsLoggedInAtomValue();
  const session = useSessionAtomValue();
  const userId = session?.user?.id ?? '';
  // 화해 콜백(resolveWith)이 stale userId를 닫지 않게 ref로 최신값을 참조한다(콜백 deps에 userId를 넣으면
  // 로그인 전이마다 콜백이 재생성돼 불필요한 재바인딩이 생긴다).
  const userIdRef = useRef(userId);
  userIdRef.current = userId;

  const setCloudConflict = useSetCloudConflictWrite();
  const setSyncState = useSetCloudSyncStateWrite();
  const conflict = useCloudConflictValue();
  const conflictRef = useRef(conflict);
  conflictRef.current = conflict;

  // 화해 IO 진행/실패 표면화. ref는 재진입(중복 클릭) 가드, state는 렌더용 — 둘을 짝으로 둔다.
  const [isResolving, setResolving] = useState(false);
  const [hasResolveFailed, setResolveFailed] = useState(false);
  const isResolvingRef = useRef(false);

  // buildPayload/applyPersistedPayload/readLocalAutosave는 매 렌더 새 함수라 effect 의존성에서 뺀다(refs로 최신값 참조).
  const buildPayloadRef = useRef(deps.buildPayload);
  buildPayloadRef.current = deps.buildPayload;
  const applyRef = useRef(deps.applyPersistedPayload);
  applyRef.current = deps.applyPersistedPayload;
  const readLocalAutosaveRef = useRef(deps.readLocalAutosave);
  readLocalAutosaveRef.current = deps.readLocalAutosave;

  const syncedForSessionRef = useRef(false);

  useEffect(() => {
    if (!isLoggedIn) {
      syncedForSessionRef.current = false;
      // 로그아웃 → 미해결 충돌은 무의미(클라우드 sync 없음). 정리 + push 정지 해제.
      if (conflictRef.current) {
        setCloudConflict(null);
        setSyncState((prev) => (prev.status === 'conflict' ? { status: 'idle', lastSavedAt: prev.lastSavedAt } : prev));
      }
      return;
    }
    if (!isPortfolioHydrated || !userId || syncedForSessionRef.current) return;
    syncedForSessionRef.current = true;

    // M1 계정전환 보호: **전역** 로컬 autosave(IndexedDB)의 직전 소유자(로그인 사용자)를 읽는다. 현재 사용자와
    // 다른 특정 계정이면(A→B→A) 전역 로컬이 남의 것 → 무음 FF-push로 내 클라우드를 덮지 않게 conflict로 위임한다.
    // foreign 판정은 claim **전** 값으로 고정한 뒤, 이 세션부터 소유권을 현재 사용자로 넘긴다(다음 전환 감지 기준).
    const priorLocalOwner = readLocalOwner();
    const isForeignLocal = priorLocalOwner !== undefined && priorLocalOwner !== '' && priorLocalOwner !== userId;
    writeLocalOwner(userId);

    // OAuth 리다이렉트로 돌아와 세션이 잡힌 첫 시점(메인 랜딩). 로그인 완료 귀속(마커 read+clear).
    const loginSource = readAndClearLoginSource();
    if (loginSource) {
      trackEvent(ANALYTICS_EVENT.LOGIN_COMPLETED, { source: loginSource });
    }

    let cancelled = false;

    void syncCloudWorkspaceAtSessionStart({
      pullCloudAutosave: pullAutosave,
      // 하이드레이션이 이미 읽은(캐시된) 로컬 read를 재사용한다 — 독립 read로 인한 불일치 유실 경로 제거.
      readLocalAutosave: () => readLocalAutosaveRef.current(),
      getCurrentPayload: () => buildPayloadRef.current(),
      applyPayload: (payload) => {
        if (!cancelled) applyRef.current(payload);
      },
      writeLocalAutosave: writePersistedAppState,
      pushCloudAutosave: pushAutosave,
      // merge-base 3-way: per-user 마지막 동기화 기준 해시를 읽고, 수렴(noop/FF)마다 갱신한다.
      // base 없으면(신규 기기·localStorage 불가) 엔진이 종전 휴리스틱으로 폴백한다(하위호환).
      readBase: () => readSyncBase(userId),
      writeBase: (hash) => writeSyncBase(userId, hash),
      // M1: 전역 로컬이 다른 계정 것이면 무음 FF 금지 → conflict(보호 모달). 세션시작에 고정한 값을 준다.
      isForeignLocalWorkspace: () => isForeignLocal,
      onEvent: (event) => {
        if (cancelled) return;
        if (event.type === 'conflict') {
          // 진짜 동시편집(양쪽 다 base에서 변함) → 스냅샷을 담고 status를 'conflict'로 → 클라우드 push 정지 +
          // 헤더 표면화. 무음 화해 금지. 단방향 변경은 여기 안 오고 엔진이 조용히 FF한다(모달 없음).
          setCloudConflict({
            device: event.local,
            cloud: event.cloud,
            deviceUpdatedAt: event.localUpdatedAt,
            cloudSavedAt: event.cloudSavedAt
          });
          setSyncState((prev) => ({ status: 'conflict', lastSavedAt: prev.lastSavedAt }));
          return;
        }
        trackSyncEvent(event);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, isPortfolioHydrated, pullAutosave, pushAutosave, setCloudConflict, setSyncState, userId]);

  // ── 화해 액션(모달이 호출) ──────────────────────────────────────────────────
  // 화해 IO 진행 중에도 status를 'conflict'로 **유지**해 스케줄러 push를 계속 정지시킨다(직접 push만 나간다).
  const resolveWith = useCallback(
    async (mode: 'device' | 'cloud' | 'blend') => {
      const current = conflictRef.current;
      if (!current || isResolvingRef.current) return;
      isResolvingRef.current = true;
      setResolving(true);
      setResolveFailed(false);

      // ⚠ **세션 시작 스냅샷이 아니라 "지금 화면의 워크스페이스"** 를 디바이스 정본으로 쓴다.
      //   모달은 세션 시작에 뜨지만 사용자는 그 뒤에도 편집한다(탭 삭제 등). 스냅샷을 쓰면 지운 탭이
      //   클라우드로 되살아나고 로컬은 지워진 채라 **양쪽이 영원히 어긋나 매 새로고침 모달이 반복**됐다.
      //   화면이 비어 있으면(하이드레이션 실패 등) 라이브를 신뢰하지 않고 스냅샷으로 폴백한다.
      const live = buildPayloadRef.current();
      const device = hasWorkspaceContent(live) ? live : current.device;

      const deviceTabs = device.scenarios.length;
      const cloudTabs = current.cloud.scenarios.length;
      const reconcileDeps: WorkspaceReconcileDeps = {
        applyPayload: (payload) => applyRef.current(payload),
        writeLocalAutosave: writePersistedAppState,
        pushCloudAutosave: pushAutosave
      };
      try {
        const resolved =
          mode === 'device'
            ? await resolveWithDevice(device, reconcileDeps)
            : mode === 'cloud'
              ? await resolveWithCloud(current.cloud, reconcileDeps)
              : await resolveWithBlend(device, current.cloud, reconcileDeps);
        // 화해로 로컬·클라우드가 `resolved`로 수렴했다 → 그 해시를 base로 확립해 **핑퐁을 끊는다**
        // (다음 세션은 local==base==cloud → noop, 또는 한쪽만 편집 시 조용한 FF). defer(미해결)는 갱신 안 함.
        writeSyncBase(userIdRef.current, serializeMeaningfulPayload(resolved));
        track(ANALYTICS_EVENT.CLOUD_SYNC_CONFLICT, {
          shown: true,
          resolution: mode,
          device_tabs: deviceTabs,
          cloud_tabs: cloudTabs,
          result_tabs: resolved.scenarios.length
        });
        setCloudConflict(null);
        setResolveFailed(false);
        // 화해 완료 → push 정지 해제(status를 'conflict'에서 뺀다). 방금 클라우드에 직접 반영했으니 'saved' 표시.
        setSyncState({ status: 'saved', lastSavedAt: Date.now() });
      } catch {
        // IO 실패 — 로컬 데이터는 안전. 충돌 유지(push 계속 정지) + 에러 계측 + **모달에 오류 표시**.
        // 모달은 열린 채로 남고 같은 버튼이 재시도 경로가 된다(무음 실패 금지).
        setResolveFailed(true);
        setSyncState((prev) => ({ status: 'conflict', lastSavedAt: prev.lastSavedAt }));
        trackEvent(ANALYTICS_EVENT.OPERATION_ERROR, { operation: 'cloud_sync', reason: 'reconcile-error' });
      } finally {
        isResolvingRef.current = false;
        setResolving(false);
      }
    },
    [pushAutosave, setCloudConflict, setSyncState]
  );

  const resolveWithDeviceAction = useCallback(() => void resolveWith('device'), [resolveWith]);
  const resolveWithCloudAction = useCallback(() => void resolveWith('cloud'), [resolveWith]);
  const resolveWithBlendAction = useCallback(() => void resolveWith('blend'), [resolveWith]);

  const deferConflict = useCallback(() => {
    const current = conflictRef.current;
    if (!current) return;
    track(ANALYTICS_EVENT.CLOUD_SYNC_CONFLICT, {
      shown: true,
      resolution: 'deferred',
      device_tabs: current.device.scenarios.length,
      cloud_tabs: current.cloud.scenarios.length,
      result_tabs: current.device.scenarios.length // 디바이스 상태 유지
    });
    // 이연: 디바이스 상태 유지 + 클라우드 push는 **세션 내** 정지(status 'conflict' 유지). 충돌 데이터는 남겨 재개봉 가능.
    // 정지 중 로컬 편집이 쌓여 발산이 커져도 안전하다 — 화해는 스냅샷이 아니라 **라이브** 워크스페이스를
    // 디바이스 정본으로 쓰므로(위 resolveWith), 나중에 어떤 선택을 해도 그 사이 편집이 반영·보존된다.
    setSyncState((prev) => (prev.status === 'conflict' ? prev : { status: 'conflict', lastSavedAt: prev.lastSavedAt }));
  }, [setSyncState]);

  const summary = useMemo(() => (conflict ? summarizeReconciliation(conflict) : null), [conflict]);

  return {
    conflict,
    summary,
    isResolving,
    hasResolveFailed,
    resolveWithDevice: resolveWithDeviceAction,
    resolveWithCloud: resolveWithCloudAction,
    resolveWithBlend: resolveWithBlendAction,
    deferConflict
  };
};
