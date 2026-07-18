import { useEffect, useRef } from 'react';
import { writePersistedAppState, type PersistedAppStatePayload } from '@/jotai';
import {
  syncCloudWorkspaceAtSessionStart,
  useCloudSavedStates,
  type CloudWorkspaceSyncEvent,
  type LocalAutosaveRead
} from '@/jotai/snowball/cloud';
import { useIsLoggedInAtomValue, useSessionAtomValue } from '@/jotai/community';
import { ANALYTICS_EVENT, readAndClearLoginSource, trackEvent } from '@/shared/lib/analytics';

/** latest-wins 동기화 신호를 GA4로 매핑한다(엔진은 순수 → 발화는 이 경계에서). 무음 실패 금지. */
const trackSyncEvent = (event: CloudWorkspaceSyncEvent): void => {
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
 * 세션 시작 시 클라우드 워크스페이스를 **latest-wins 양방향**으로 동기화한다.
 *
 * - 로컬 autosave와 클라우드 autosave의 **클라이언트 저장시각**을 비교해 최신을 정본으로 삼고 반대쪽에 반영한다
 *   (내용 동일이면 no-op). 로컬·클라우드 둘 다 미러를 유지한다(로컬을 지우지 않는다).
 * - **세션당 1회** 실행(로그아웃하면 리셋 → 다음 로그인에 다시 동기화). 마이그레이션 1회 플래그는 폐기됐다 —
 *   latest-wins는 매 세션시작 실행이 자연스럽고, 세션당 1회는 `syncedForSessionRef`가 보장한다.
 * - latest-wins 로직은 순수 엔진(syncCloudWorkspaceAtSessionStart)이 보장한다 — 이 훅은 IO만 배선.
 * - 비로그인/미설정이면 IO가 null/no-op이라 조용히 아무것도 하지 않는다(local-first 훼손 없음).
 * - **로컬 read는 하이드레이션과 공유한다**: `readLocalAutosave`는 usePortfolioPersistence가 세션 시작에
 *   1회 읽어 캐시한 결과를 재사용한다. 예전처럼 여기서 독립 read하면, 하이드레이션 성공 직후 이 read가
 *   일시 실패할 때 엔진이 더 오래된 클라우드를 apply → app autosave가 로컬 최신본을 덮어쓰는 유실 경로가 있었다.
 */
export const useCloudWorkspaceSync = (deps: {
  isPortfolioHydrated: boolean;
  buildPayload: () => PersistedAppStatePayload;
  applyPersistedPayload: (payload: PersistedAppStatePayload) => void;
  /** 하이드레이션이 세션 시작에 읽어 캐시한 로컬 autosave를 재사용하는 리더(로컬 read 1회 공유). */
  readLocalAutosave: () => Promise<LocalAutosaveRead>;
}): void => {
  const { isPortfolioHydrated } = deps;
  const { pullAutosave, pushAutosave } = useCloudSavedStates();
  const isLoggedIn = useIsLoggedInAtomValue();
  const session = useSessionAtomValue();
  const userId = session?.user?.id ?? '';

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
      return;
    }
    if (!isPortfolioHydrated || !userId || syncedForSessionRef.current) return;
    syncedForSessionRef.current = true;

    // OAuth 리다이렉트로 돌아와 세션이 잡힌 첫 시점(메인 랜딩). CommunityAuthProvider.login이 리다이렉트
    // 직전에 심은 source(=제공자)가 있으면 로그인 완료를 발화하고 마커를 지운다. 커뮤니티 랜딩은
    // CommunityAuthProvider가 같은 read+clear로 발화하므로(마커 게이팅) 로그인당 정확히 1회만 집계된다.
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
      onEvent: trackSyncEvent
    });

    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, isPortfolioHydrated, pullAutosave, pushAutosave, userId]);
};
