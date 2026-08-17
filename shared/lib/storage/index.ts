/**
 * 브라우저 저장소 **키 규약**과 그 이관.
 *
 * 이 폴더는 값을 읽고 쓰지 않는다 — 키를 어떻게 짓는지(`storagePrefix`)와, 옛 접두사로 저장된 것을
 * 어떻게 데려오는지(`migrateLegacyStorage`)만 안다. 실제 읽기·쓰기는 각 도메인 모듈이 계속 소유한다
 * (팔레트는 `jotai/snowball/atoms/ui`, 장부 연결은 `shared/lib/googleSheets` …).
 */
export {
  LEGACY_STORAGE_PREFIX,
  STORAGE_PREFIX,
  legacyStorageKey,
  storageKey
} from './storagePrefix';
export { migrateLegacyStorageKeys } from './migrateLegacyStorage';
