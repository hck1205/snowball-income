/**
 * 일회성 공지의 "닫힘" 플래그.
 *
 * 앱의 저장 상태(IndexedDB)나 공유 링크 페이로드에는 **절대 넣지 않는다.** 이 플래그는 "이 브라우저에서
 * 이 공지를 봤는가"라는 기기 로컬 사실일 뿐, 사용자가 저장·공유하는 시나리오 데이터가 아니다.
 * 페이로드에 섞이면 공유 링크를 여는 사람의 공지 상태까지 덮어쓰게 된다.
 *
 * 키에 버전(`:v1`)을 붙여 두어, 다음 공지는 새 키(`:v2` 또는 다른 slug)로 독립적으로 띄울 수 있다.
 */
export const MODEL_CHANGE_NOTICE_STORAGE_KEY = 'snowball:notice:coherent-model:v1';

const DISMISSED_VALUE = 'dismissed';

/**
 * localStorage 접근은 예외를 던질 수 있다(사파리 프라이빗 모드, 쿠키/스토리지 차단, SSR).
 * 실패하면 "안 닫혔다"로 간주한다 — 공지를 한 번 더 보는 쪽이 앱이 죽는 것보다 낫다.
 */
export const isNoticeDismissed = (storageKey: string): boolean => {
  try {
    return window.localStorage.getItem(storageKey) === DISMISSED_VALUE;
  } catch {
    return false;
  }
};

/** 저장에 실패해도 조용히 넘어간다 — 다음 방문에 공지가 다시 뜰 뿐이다. */
export const markNoticeDismissed = (storageKey: string): void => {
  try {
    window.localStorage.setItem(storageKey, DISMISSED_VALUE);
  } catch {
    /* 스토리지를 못 쓰는 환경: 닫힘 상태를 기억하지 못할 뿐, 동작은 유지된다. */
  }
};
