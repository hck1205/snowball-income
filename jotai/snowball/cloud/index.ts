/**
 * 클라우드 저장 동기화 (cloud-save-proposal Stage 1) — 순수 엔진 + 상태 atom + React 훅.
 *
 * ⚠ 이 폴더는 `jotai/snowball/index.ts`(→ `@/jotai`) 배럴에 **연결하지 않는다**. supabase 정적
 *   import가 초기 번들로 새지 않게 하려는 격리다(커뮤니티 jotai와 같은 규율). 소비 측(메인 화면)은
 *   `@/jotai/snowball/cloud` 폴더 경로로 직접 import한다.
 */
export * from './cloudAutosaveTimestamp';
export * from './cloudConflictState';
export * from './cloudSyncEngine';
export * from './cloudSyncState';
export * from './cloudWorkspaceReconcile';
export * from './cloudWorkspaceSyncEngine';
export * from './sessionLocalAutosave';
export * from './useCloudSync';
