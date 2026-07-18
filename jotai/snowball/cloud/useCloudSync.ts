import { useCallback, useEffect, useMemo } from 'react';
import {
  fetchCloudAutosave,
  getSession,
  getSupabaseClient,
  pushCloudAutosave,
  type CommunityClient
} from '@/shared/lib/supabase';
import { normalizePersistedAppState } from '../persistence';
import type { PersistedAppStatePayload } from '../types';
import { readCloudSavedAt, stampCloudAutosave } from './cloudAutosaveTimestamp';
import { createAutosavePush, createCloudSyncScheduler } from './cloudSyncEngine';
import type { CloudAutosaveRead } from './cloudWorkspaceSyncEngine';
import { useSetCloudSyncStateWrite } from './cloudSyncState';

/**
 * ⚠ 이 모듈은 `@/shared/lib/supabase`를 정적 import하므로 `jotai/snowball` 배럴에 연결하지 않는다
 *   (`jotai/snowball/index.ts`에서 재export 금지). 커뮤니티 jotai와 같은 격리 — `@/jotai` 초기
 *   번들에 supabase 코드가 딸려오지 않게, 소비 측이 `@/jotai/snowball/cloud` 폴더 경로로 직접 쓴다.
 *   (SDK 자체는 client.ts가 동적 import하므로 어차피 초기 번들엔 없다.)
 */

/** 로그인 + 커뮤니티 설정이 됐을 때만 client로 run을 실행한다. 아니면 null(=클라우드 skip). */
const withCloudClient = async <T>(run: (client: CommunityClient) => Promise<T>): Promise<T | null> => {
  const client = await getSupabaseClient();
  if (!client) return null;
  const session = await getSession(client);
  if (!session) return null;
  return run(client);
};

/**
 * 활성 워크스페이스를 클라우드에 디바운스 자동 저장한다(§D5, 3~5초).
 * UI(Main)는 편집이 있을 때마다 `scheduleCloudSave(payload)`만 부르면 된다 — 상태 전이·비로그인
 * skip·오프라인 판정은 스케줄러가 처리하고, cloudSyncStateAtom을 통해 인디케이터에 반영된다.
 */
export const useCloudSync = () => {
  const setSyncState = useSetCloudSyncStateWrite();

  const scheduler = useMemo(
    () =>
      createCloudSyncScheduler({
        push: createAutosavePush({
          getClient: getSupabaseClient,
          getSession,
          // 평상시 디바운스 자동저장도 매번 클라이언트 저장시각을 심어야 세션 사이에도 기기 간 latest-wins가
          // 성립한다(세션 시작 엔진만이 아니라 여기도 stamped). savedAt은 정규화가 버리므로 no-op 게이트 무영향.
          push: (client, payload) => pushCloudAutosave(client, stampCloudAutosave(payload, Date.now()))
        }),
        onStatus: setSyncState
      }),
    [setSyncState]
  );

  useEffect(() => () => scheduler.dispose(), [scheduler]);

  return {
    scheduleCloudSave: scheduler.schedule,
    flushCloudSave: scheduler.flush
  };
};

/**
 * 세션 시작 latest-wins 동기화용 자동 슬롯 pull·push.
 * 비로그인/미설정이면 조용히 no-op(null)이다 — UI는 로그인 게이트를 따로 그린다(§8.4).
 * 읽기 payload는 normalizePersistedAppState로 정규화해 돌려준다(하위 호환·안전).
 * (구 "내 저장" 목록/열기/삭제는 MySavePanel 삭제로 제거됨 — 2026-07-18, 사용자 승인.)
 */
export const useCloudSavedStates = () => {
  /**
   * 세션 시작 시 자동 동기화 슬롯을 pull(§8.2). 없거나 비로그인이면 null.
   * 정규화 payload와 함께 **클라이언트 저장시각(savedAt)**을 raw jsonb에서 뽑아 함께 준다(latest-wins 비교용).
   * savedAt은 정규화 전에 읽는다 — 정규화는 savedAt을 버리므로 앱 상태·no-op 비교에는 섞이지 않는다.
   */
  const pullAutosave = useCallback(async (): Promise<CloudAutosaveRead> => {
    const row = await withCloudClient((client) => fetchCloudAutosave(client));
    if (!row) return null;
    return { payload: normalizePersistedAppState(row.payload), savedAt: readCloudSavedAt(row.payload) };
  }, []);

  /**
   * 세션 시작 latest-wins 전용 **직접** push(디바운스 없는 즉시 저장). 비로그인/미설정이면 조용히 no-op.
   * `savedAt`(원본 편집시각)을 payload에 심어 올린다 — 기기 간 최신성 비교가 일관되도록.
   * throw는 호출자(동기화 엔진)가 잡아 "로컬 보존"으로 처리한다.
   */
  const pushAutosave = useCallback(async (payload: PersistedAppStatePayload, savedAt: number): Promise<void> => {
    await withCloudClient((client) => pushCloudAutosave(client, stampCloudAutosave(payload, savedAt)));
  }, []);

  return { pullAutosave, pushAutosave };
};
