/**
 * "이 브라우저에서 시뮬레이터를 써 본 적이 있다" 는 **단일 부기 마커** — localStorage.
 *
 * 왜 필요한가: 랜딩(`/`)은 재방문자에게 "이어서 계산하기"(→`/simulator`)를 조건부로 띄워야 하는데,
 * 그 판단은 **렌더 전에 동기로** 나와야 한다(레이아웃 시프트 금지).
 *
 * 🔴 **IndexedDB(`readPersistedAppState`)를 읽지 않는 이유** — 뒤집기 전에 읽어라:
 *  1. `window.indexedDB.open(...)` 은 **없으면 만든다** → 도구를 한 번도 안 쓴 첫 방문자 브라우저에
 *     빈 DB 를 남긴다.
 *  2. 비동기라 결과가 첫 페인트 뒤에 도착한다 → 히어로가 흔들린다.
 *  3. 정확도가 필요 없다 — 목적지가 어차피 `/simulator` 라 오탐(있다고 잘못 봄)의 대가가 0이고,
 *     미탐(없다고 잘못 봄)은 **항상 보이는 시뮬레이터 CTA** 가 받아 준다.
 *
 * 🔴 **"데이터가 있다"의 증거가 아니다.** 저장 성공의 흔적일 뿐, 그 뒤 사용자가 브라우저 저장소를
 * 비웠을 수도 있다. 이 값으로 데이터 로드·분기를 결정하지 마라(링크 하나를 보일지에만 쓴다).
 *
 * 스키마 관점: 영속 payload / 공유 URL(`?share=`·`?s=`) / `user_app_states` **밖의** 순수 클라이언트
 * 부기값이다(`cloudSyncBase` 계열과 같은 급). 마이그레이션 불필요 — 마커가 없는 기존 사용자의 저장
 * 데이터는 그대로 열리고, 다음 저장에서 마커가 자동 백필된다.
 *
 * ⚠ localStorage 불가 환경(사파리 프라이빗 · 저장소 차단 · SSR/노드 테스트)에서는 read 가 `false`,
 *   write/clear 가 no-op 으로 **조용히 강등**된다. 없는 쪽이 안전한 기본값이다.
 */

const HAS_WORKSPACE_KEY = 'snowball:has-workspace';

/** 값 자체는 의미 없다(존재 여부만 본다). 나중에 값에 뜻을 싣지 마라 — 그러면 스키마가 된다. */
const HAS_WORKSPACE_VALUE = '1';

/**
 * localStorage 접근은 **두 겹**으로 막는다: SSR/노드(=`window` 자체가 없음)와,
 * 사파리 프라이빗처럼 `window.localStorage` **접근·호출이 throw** 하는 환경.
 */
const readStorage = (): Storage | null => {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

/**
 * 이 브라우저에 워크스페이스를 저장한 적이 있는가. 랜딩이 **동기로** 부른다(useState 초기화 등).
 * 읽을 수 없으면 언제나 `false` — 마커가 없으면 안 보이는 쪽이 안전하다.
 */
export const hasStoredWorkspace = (): boolean => {
  const storage = readStorage();
  if (!storage) return false;
  try {
    return storage.getItem(HAS_WORKSPACE_KEY) === HAS_WORKSPACE_VALUE;
  } catch {
    return false;
  }
};

/** 자동 저장이 **성공한 뒤** 호출한다. 실패는 무해(다음 저장이 다시 시도한다). */
export const markWorkspaceStored = (): void => {
  const storage = readStorage();
  if (!storage) return;
  try {
    storage.setItem(HAS_WORKSPACE_KEY, HAS_WORKSPACE_VALUE);
  } catch {
    // 쿼터 초과·저장소 차단 → 조용히 강등(재방문 링크만 안 보인다).
  }
};

/** 워크스페이스를 실제로 비운 경로에서만 호출한다(명시적 DB 복구 삭제 등). 실패는 무시. */
export const clearWorkspaceMarker = (): void => {
  const storage = readStorage();
  if (!storage) return;
  try {
    storage.removeItem(HAS_WORKSPACE_KEY);
  } catch {
    // no-op
  }
};
