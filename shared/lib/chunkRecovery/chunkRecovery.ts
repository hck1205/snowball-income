/**
 * **배포 스큐(deploy skew) 복구** — 사라진 lazy 청크를 만났을 때 앱이 통째로 죽지 않게 한다.
 *
 * ## 무엇이 나는가 (2026-08-07 프로덕션 실측)
 * 새 배포가 나가면 `assets/*.js` 의 해시 파일명이 **전부 바뀐다**. 그런데 그 순간 이미 열려 있던
 * 탭(또는 edge/브라우저에 캐시된 `index.html`)은 **옛 해시**를 기억하고 있다. 사용자가 그 탭에서
 * lazy 라우트를 처음 여는 순간 — 검색 결과를 펼치거나 다른 화면으로 이동할 때 —
 * 없는 파일을 가져오려다 실패하고, 라우터의 에러 경계가 화면을 통째로 대체한다:
 *
 *     Unexpected Application Error!
 *     Failed to fetch dynamically imported module: …/assets/index-XXXX.js
 *
 * 🔴 **사용자에게는 "사이트가 깨졌다"로 보인다.** 실제로는 새로고침 한 번이면 끝나는 상태인데,
 * 그 사실을 아무도 알려 주지 않는다.
 *
 * ## 처방
 * 실패를 감지하면 **한 번만** 새로고침한다. 새 `index.html` 을 받으면 새 해시를 얻어 정상화된다.
 *
 * 🔴 **"한 번만"이 이 파일의 핵심이다.** 조건 없이 새로고침하면, 청크가 정말로 없는 경우
 * (자산 배포 실패·네트워크 차단) 무한 새로고침 루프가 된다 — 그건 원래 증상보다 훨씬 나쁘다.
 * 그래서 표식을 `sessionStorage` 에 남기고, 이미 시도했으면 두 번째부터는 그냥 에러를 흘려보낸다.
 *
 * ⚠ `sessionStorage` 인 이유: 탭을 닫으면 사라져야 한다. `localStorage` 면 "한 번 복구했다"가
 *   영원히 남아, 몇 주 뒤 진짜 스큐가 났을 때 복구가 동작하지 않는다.
 * ⚠ 사설 모드·저장소 차단 환경에서 `sessionStorage` 접근이 throw 할 수 있다 — 그 경우는
 *   복구를 포기한다(에러를 삼키지 않는 쪽이 안전하다).
 */

const RELOAD_MARK = 'snowball:chunk-reload';

/** 이 오류가 "사라진 청크"인가. 브라우저마다 문구가 달라 **여러 형태**를 본다. */
export const isChunkLoadError = (reason: unknown): boolean => {
  const message =
    reason instanceof Error ? `${reason.name}: ${reason.message}` : typeof reason === 'string' ? reason : '';
  if (!message) return false;

  return (
    /Failed to fetch dynamically imported module/i.test(message) ||
    /error loading dynamically imported module/i.test(message) ||
    /Importing a module script failed/i.test(message) || // Safari
    /ChunkLoadError/i.test(message)
  );
};

/**
 * 한 번만 새로고침한다. 이미 시도했으면 `false` 를 돌려주고 아무것도 하지 않는다.
 * @returns 새로고침을 시작했는가.
 */
export const reloadOnceForChunkError = (): boolean => {
  if (typeof window === 'undefined') return false;

  try {
    if (window.sessionStorage.getItem(RELOAD_MARK)) return false;
    window.sessionStorage.setItem(RELOAD_MARK, '1');
  } catch {
    /* 저장소를 못 쓰면 루프를 막을 방법이 없다 — 복구를 포기한다(무한 새로고침보다 낫다). */
    return false;
  }

  window.location.reload();
  return true;
};

/**
 * 정상적으로 앱이 뜬 뒤 표식을 지운다 — 다음 배포에서 다시 복구할 수 있게.
 * ⚠ 이걸 빠뜨리면 **탭 수명 동안 복구가 한 번뿐**이라, 하루에 두 번 배포하면 두 번째는 못 산다.
 */
export const clearChunkReloadMark = (): void => {
  try {
    window.sessionStorage.removeItem(RELOAD_MARK);
  } catch {
    /* 못 지워도 다음 탭에서는 어차피 비어 있다. */
  }
};

/**
 * 전역 배선. **앱 마운트 전에 한 번** 부른다.
 *
 * 두 갈래를 모두 듣는다:
 *  - `vite:preloadError` — Vite 가 모듈 프리로드 실패에 쏘는 전용 이벤트. 라우터까지 가기 전에 잡힌다.
 *  - `unhandledrejection` — 위 이벤트를 안 쓰는 경로(직접 `import()`)로 새는 실패.
 */
export const installChunkRecovery = (): void => {
  if (typeof window === 'undefined') return;

  window.addEventListener('vite:preloadError', (event) => {
    /* 기본 동작(에러 던지기)을 막고 우리가 복구를 시도한다. */
    if (reloadOnceForChunkError()) event.preventDefault();
  });

  window.addEventListener('unhandledrejection', (event) => {
    if (!isChunkLoadError(event.reason)) return;
    if (reloadOnceForChunkError()) event.preventDefault();
  });
};
