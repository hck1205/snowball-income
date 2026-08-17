/**
 * 브라우저 저장소 키의 **접두사 단일 출처**.
 *
 * ## 왜 상수 하나가 소유하는가
 * 2026-08-17 이전에는 `'snowball:...'` 문자열이 21곳에 흩어져 있었다. 접두사를 한 번 바꾸는 데
 * 20개 파일을 손대야 했고, 하나를 빠뜨리면 **그 키만 조용히 고아가 된다**(사용자에게는 "설정이
 * 초기화됐다"로 보인다). 지금은 여기 한 줄이 정본이고 나머지는 `storageKey()` 로 파생한다.
 *
 * ## 접두사 자체가 계약이다
 * 🔴 `LEGACY_STORAGE_PREFIX` 를 지우지 마라. 이 값은 **이미 사용자 브라우저에 저장된 키**를 가리킨다 —
 * 코드에서 사라져도 사용자 기기에서는 사라지지 않는다. `migrateLegacyStorage` 가 이 접두사를 훑어
 * 새 접두사로 옮기고, 그 이관은 **모든 기존 사용자가 한 번씩 방문할 때까지** 필요하다.
 * 언제 지울 수 있는지는 아무도 모른다(마지막 방문자가 언제 올지 모르므로) — 비용이 사실상 0이니
 * 그냥 둔다.
 *
 * ## 구분자는 콜론이다
 * `hungryhippo:ledger:links` 처럼 **콜론으로 계층**을 만든다. 이관은 접두사만 갈아끼우므로
 * 뒷부분(`ledger:links`)은 그대로 따라온다 — 즉 이 파일을 바꿔도 키의 의미 구조는 보존된다.
 *
 * ⚠ `index.html` 의 프리페인트 인라인 스크립트도 이 접두사로 팔레트·색상을 읽는다. 번들보다 **먼저**
 *   도는 코드라 여기서 import 할 수 없고 문자열이 복제돼 있다 — 이 값을 바꾸면 그쪽도 함께 고쳐라
 *   (`test/storage/storagePrefix.test.ts` 가 두 곳이 갈라지면 실패한다).
 */

/** 지금 쓰는 접두사. 새 키는 반드시 `storageKey()` 를 거친다. */
export const STORAGE_PREFIX = 'hungryhippo:';

/** 2026-08-17 이전 접두사. 이관 전용 — 새 코드가 이 값으로 **쓰면** 안 된다. */
export const LEGACY_STORAGE_PREFIX = 'snowball:';

/**
 * 접두사를 붙인 저장소 키를 만든다.
 *
 * ⚠ `suffix` 에 접두사를 다시 넣지 마라(`storageKey('hungryhippo:palette')` → 중복). 접미사만 준다.
 */
export const storageKey = (suffix: string): string => `${STORAGE_PREFIX}${suffix}`;

/** 옛 접두사가 붙은 같은 키. 이관과 테스트에서만 쓴다. */
export const legacyStorageKey = (suffix: string): string => `${LEGACY_STORAGE_PREFIX}${suffix}`;
