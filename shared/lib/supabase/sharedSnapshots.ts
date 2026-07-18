import type { CommunityClient } from './queries';
import type { PersistedScenarioState, SharedSnapshotEnvelope } from './types';

/**
 * 공유 스냅샷 IO 레이어 (shared_snapshots, 트랙 E).
 *
 * queries.ts / userAppStates.ts와 같은 규율: **로직을 두지 않는다.** client를 인자로 받아
 * (테스트에 가짜 주입 가능) SECURITY DEFINER RPC 호출만 조립한다. URL 조립·폴백·정규화는
 * 상위(usePortfolioPersistence)가 한다.
 *
 * ⚠ payload는 서버에서 신뢰하지 않는다 — 조회 결과의 scenario는 호출자가
 *   normalizePersistedAppState로 정규화해야 한다(이 계층은 값을 그대로 돌려줄 뿐이다).
 */

/** 활성 시나리오 한 개를 v1 envelope로 감싼다(payload 계약을 한 곳에서 못박는다). */
export const buildSharedSnapshotEnvelope = (scenario: PersistedScenarioState): SharedSnapshotEnvelope => ({
  v: 1,
  scenario
});

const isObject = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object';

/**
 * envelope 형태 가드(신뢰불가 입력 방어).
 *
 * ⚠ 서버 CHECK는 "jsonb object + ≤64KB"만 강제하고 **형태(v===1, scenario 객체)는 검증하지 않는다**
 *   — anon이 `create_shared_snapshot`로 `{"foo":1}` 같은 임의 객체를 저장할 수 있다. 조회 측에서
 *   형태를 검증해 상위(hook)가 `scenario` 존재를 신뢰할 수 있게 한다(없으면 정규화 시도 자체가 TypeError).
 */
export const isValidSharedSnapshotEnvelope = (value: unknown): value is SharedSnapshotEnvelope =>
  isObject(value) && value.v === 1 && isObject(value.scenario);

/**
 * 공유 스냅샷 생성. 서버가 key를 만들어 반환한다.
 * RPC 에러/빈 응답이면 throw → 상위가 구 lz-string `?share=` 링크로 폴백한다(무음 실패 금지).
 */
export const createSharedSnapshot = async (
  client: CommunityClient,
  payload: SharedSnapshotEnvelope
): Promise<string> => {
  const { data, error } = await client.rpc('create_shared_snapshot', { p_payload: payload });
  if (error) throw new Error(error.message);
  if (typeof data !== 'string' || !data) throw new Error('공유 키를 생성하지 못했습니다');
  return data;
};

/**
 * key로 공유 스냅샷 payload를 읽는다. 부재/만료/**형태 불일치**면 null(예외 아님).
 * 네트워크·RPC 에러만 throw → 상위가 계측+쿼리 정리한다.
 *
 * envelope 형태 검증을 여기서 하므로 상위(hook)는 non-null 반환을 **유효한 scenario 보유**로
 * 신뢰할 수 있다(결손/비-envelope payload가 정규화 경로로 새지 않는다).
 */
export const fetchSharedSnapshot = async (
  client: CommunityClient,
  key: string
): Promise<SharedSnapshotEnvelope | null> => {
  const { data, error } = await client.rpc('get_shared_snapshot', { p_key: key });
  if (error) throw new Error(error.message);
  return isValidSharedSnapshotEnvelope(data) ? data : null;
};
