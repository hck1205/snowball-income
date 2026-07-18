import type { PersistedAppStatePayload } from '@/jotai/snowball/types';
import type { CommunityClient } from './queries';
import type { UserAppStateRow } from './types';

/**
 * 개인 클라우드 저장 IO 레이어 (user_app_states, cloud-save-proposal §5).
 *
 * queries.ts와 같은 규율: **로직을 두지 않는다.** client를 인자로 받아(테스트에 가짜 주입 가능)
 * PostgREST 호출만 조립한다. 디바운스·상태 전이·정규화는 상위(jotai/snowball/cloud)가 한다.
 *
 * ⚠ payload는 서버에서 신뢰하지 않는다 — 읽기 결과는 호출자가 normalizePersistedAppState로
 *   정규화해야 한다(이 계층은 행을 그대로 돌려줄 뿐이다).
 */

/** "내 저장" 목록: 무거운 payload를 뺀 메타만(대역폭). */
const STATE_META_COLUMNS = 'id,user_id,name,created_at,updated_at';
/** 자동 슬롯/체크포인트 열람: payload 포함. */
const STATE_FULL_COLUMNS = `${STATE_META_COLUMNS},payload`;

const unwrap = <T>(result: { data: T | null; error: { message: string } | null }): T => {
  if (result.error) throw new Error(result.error.message);
  if (result.data === null) throw new Error('Supabase 응답이 비어 있습니다');
  return result.data;
};

// ── 자동 동기화 슬롯 (name = null, 1인 1개) ───────────────────────────────────

/** 자동 동기화 슬롯을 읽는다. 없으면 null(첫 로그인/미저장). RLS가 내 것만 준다. */
export const fetchCloudAutosave = async (client: CommunityClient): Promise<UserAppStateRow | null> => {
  const rows = unwrap(
    await client.from('user_app_states').select(STATE_FULL_COLUMNS).is('name', null).limit(1).returns<UserAppStateRow[]>()
  );
  return rows[0] ?? null;
};

/**
 * 자동 동기화 슬롯 upsert. partial unique index(user_id where name is null) 때문에 PostgREST
 * onConflict upsert가 깔끔하지 않아, 존재하면 update·없으면 insert로 명시 처리한다.
 * 동시 insert 경쟁은 index가 막고, 실패 시 상위가 재시도(update)로 폴백한다.
 */
export const pushCloudAutosave = async (
  client: CommunityClient,
  payload: PersistedAppStatePayload
): Promise<UserAppStateRow> => {
  const existing = unwrap(
    await client.from('user_app_states').select('id').is('name', null).limit(1).returns<{ id: string }[]>()
  );

  if (existing.length > 0) {
    return unwrap(
      await client
        .from('user_app_states')
        .update({ payload })
        .eq('id', existing[0].id)
        .select(STATE_FULL_COLUMNS)
        .single()
        .returns<UserAppStateRow>()
    );
  }

  return unwrap(
    await client
      .from('user_app_states')
      .insert({ payload, name: null })
      .select(STATE_FULL_COLUMNS)
      .single()
      .returns<UserAppStateRow>()
  );
};
