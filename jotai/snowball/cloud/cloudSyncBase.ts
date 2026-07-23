/**
 * 클라우드 리컨사일 **merge-base(마지막 동기화 기준점)** 의 per-user 로컬 저장 — localStorage.
 *
 * 왜 필요한가: 세션 시작 동기화가 "로컬/클라우드가 **각각 base에서 바뀌었나**"를 알아야 3-way를 판정한다.
 *  - 한쪽만 base에서 변함 → 조용히 fast-forward(무손실, 모달 없음).
 *  - 양쪽 다 base에서 변함 → 진짜 동시편집 → 충돌 모달 1회(해결 시 base 갱신 → 재발 없음).
 * base가 없으면(레거시·신규 기기) 엔진은 종전 타임스탬프 휴리스틱(1.4/1.45/1.5)으로 폴백한다(하위호환).
 *
 * 저장값 = `serializeMeaningfulPayload`(의미있는 부분집합의 안정 직렬화) 문자열. payload/공유 URL **밖의**
 * 순수 클라이언트 부기값이라 영속 스키마·`user_app_states`·공유 스냅샷·공유 URL과 무관하다
 * (additive optional — 마이그레이션 불필요, 기존 사용자 base=없음→폴백→자동확립).
 *
 * ⚠ 저장소는 **localStorage**(동기·단순)다 — autosave(IndexedDB)와 독립. base는 매 수렴마다 즉시 갱신되는
 *   작은 부기값이라 비동기 IndexedDB가 아니라 동기 localStorage가 맞다.
 * ⚠ localStorage 불가 환경(사파리 프라이빗 등)에서는 read/write가 조용히 실패(undefined/no-op)해 **base 없음
 *   폴백**으로 안전하게 강등된다 — 앱을 죽이지 않고, 데이터 안전(무손실 FF·모달)도 그대로다.
 */

/** per-user 저장 키 접두. userId를 붙여 기기 내에서 사용자별로 격리한다(다른 사용자 로그인 시 충돌 없음). */
const SYNC_BASE_KEY_PREFIX = 'snowball:cloud-sync-base:';

const keyFor = (userId: string): string => `${SYNC_BASE_KEY_PREFIX}${userId}`;

/**
 * userId의 마지막 동기화 기준 해시를 읽는다. 없거나(신규 기기) 실패하면(localStorage 불가) `undefined`
 * → 세션 시작 엔진은 base 없음으로 보고 종전 휴리스틱 폴백을 탄다.
 */
export const readSyncBase = (userId: string): string | undefined => {
  if (!userId) return undefined;
  try {
    return window.localStorage.getItem(keyFor(userId)) ?? undefined;
  } catch {
    return undefined;
  }
};

/**
 * userId의 마지막 동기화 기준 해시를 기록한다 — 세션 시작 수렴(noop/applied-cloud/pushed-local)과
 * 충돌 해결, 디바운스 autosave 실반영('saved') 시 호출된다. 실패는 무해(다음 세션은 base 없음 폴백).
 */
export const writeSyncBase = (userId: string, hash: string): void => {
  if (!userId) return;
  try {
    window.localStorage.setItem(keyFor(userId), hash);
  } catch {
    // localStorage 불가/쿼터 초과 → 조용히 강등(다음 세션은 base 없음 폴백으로 안전).
  }
};

/** userId의 base를 지운다(공개 API — 예: 계정 삭제·동기화 리셋). 실패는 무시. 로그아웃엔 쓰지 않는다
 *  (같은 사용자가 다시 로그인하면 base가 그대로 유효해 로그아웃 사이 오프라인 편집을 무손실로 흡수한다). */
export const clearSyncBase = (userId: string): void => {
  if (!userId) return;
  try {
    window.localStorage.removeItem(keyFor(userId));
  } catch {
    // no-op
  }
};
