import { atom } from 'jotai/vanilla';
import { useAtomValue, useAtomWrite } from '@/jotai/atom';
import { INITIAL_CLOUD_SYNC_STATE, type CloudSyncState } from './cloudSyncEngine';

/**
 * 클라우드 동기화 상태 atom (UI 저장 인디케이터 §8.3의 단일 소스).
 * 값은 useCloudSync가 스케줄러 onStatus에서 갱신한다 — UI는 읽기만 한다.
 */
export const cloudSyncStateAtom = atom<CloudSyncState>(INITIAL_CLOUD_SYNC_STATE);

// ── 소비 훅 (프로젝트 컨벤션: useXValue / useSetXWrite) ────────────────────────

export const useCloudSyncStateValue = () => useAtomValue(cloudSyncStateAtom);
export const useSetCloudSyncStateWrite = () => useAtomWrite(cloudSyncStateAtom);
