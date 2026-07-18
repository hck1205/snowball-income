import type { PersistedAppStatePayload } from '../types';

/**
 * 클라우드 autosave의 **클라이언트 저장시각**(savedAt)을 payload jsonb에 실어 왕복시킨다.
 *
 * 왜 payload에 심나: `user_app_states.updated_at`은 **서버 시각**이라 로컬(Date.now())과 비교 기준이
 * 어긋난다. 클라이언트가 쓸 수 있는 타임스탬프 컬럼이 없으므로(DB 마이그레이션 지양), savedName 선례처럼
 * payload 최상위에 클라이언트 시각을 실어 기기 간 latest-wins 비교를 한 기준(Date.now())으로 통일한다.
 *
 * ⚠ savedAt은 **전송 전용 메타**다. `normalizePersistedAppState`가 이를 보존하지 않으므로(정규화 출력에
 *   savedAt 키가 없다) 앱 상태나 no-op 비교(`isSamePersistedPayload`/`isSameMeaningfulPayload`)에는 절대
 *   섞이지 않는다. 그래서 매 저장마다 savedAt이 달라져도 no-op 게이트가 무력화되지 않는다.
 *   (읽기 측은 정규화 **전에** raw jsonb에서 `readCloudSavedAt`으로 뽑아 별도 메타로 다룬다.)
 */

/** savedAt이 실린 클라우드 autosave 전송 payload. savedAt은 optional이라 평범한 payload도 이 타입에 대입된다. */
export type StampedCloudAutosavePayload = PersistedAppStatePayload & { savedAt?: number };

/** payload에 클라이언트 저장시각을 심는다(모든 클라우드 autosave **쓰기**의 단일 지점). */
export const stampCloudAutosave = (
  payload: PersistedAppStatePayload,
  savedAt: number
): StampedCloudAutosavePayload => ({ ...payload, savedAt });

/**
 * raw 클라우드 payload(jsonb)에서 클라이언트 저장시각을 읽는다(모든 클라우드 autosave **읽기**의 단일 지점).
 * 없거나(구버전) 유한한 숫자가 아니면 undefined — latest-wins 비교에서 최소값(=아주 오래됨)으로 취급된다.
 */
export const readCloudSavedAt = (rawPayload: unknown): number | undefined => {
  if (!rawPayload || typeof rawPayload !== 'object') return undefined;
  const savedAt = (rawPayload as { savedAt?: unknown }).savedAt;
  return typeof savedAt === 'number' && Number.isFinite(savedAt) ? savedAt : undefined;
};
