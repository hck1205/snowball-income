import { atom } from 'jotai/vanilla';
import { useAtomValue, useAtomWrite } from '@/jotai/atom';
import type { CloudWorkspaceConflict } from './cloudWorkspaceReconcile';

/**
 * 세션 시작에 감지된 **미해결 워크스페이스 충돌** atom. 값이 있으면 화해 대기 중(모달이 그릴 데이터가 존재).
 * null = 충돌 없음 또는 이미 화해됨.
 *
 * - `useCloudWorkspaceSync`(경계 훅)가 엔진 conflict 이벤트를 받아 set 하고, 화해/로그아웃 시 null로 clear 한다.
 * - `cloudSyncStateAtom.status === 'conflict'`(push 정지 신호)와 **짝**이다: 이 atom은 "무엇이 충돌했나"(모달
 *   데이터), status는 "push를 멈춰라 + 헤더가 표면화"(정지 신호). 이연(모달 닫기)은 이 atom을 **남겨** 헤더에서
 *   다시 열 수 있게 하고, status는 'conflict'로 유지한다.
 *
 * ⚠ supabase를 import하지 않는다 — 값은 순수 payload 스냅샷이라 초기 번들 격리를 유지한다.
 */
export const cloudConflictAtom = atom<CloudWorkspaceConflict | null>(null);

export const useCloudConflictValue = () => useAtomValue(cloudConflictAtom);
export const useSetCloudConflictWrite = () => useAtomWrite(cloudConflictAtom);
