import { atom } from 'jotai/vanilla';
import { atomWithStorage } from 'jotai/utils';
import type { Session } from '@supabase/supabase-js';
import { useAtomValue, useAtomWrite } from '@/jotai/atom';
import type { CommunityAuthor } from '@/shared/lib/supabase';

/**
 * 커뮤니티 전역 상태 — **순수 상태 컨테이너**.
 *
 * ⚠ 여기엔 IO를 넣지 않는다. onAuthStateChange 구독 / getSupabaseClient 호출 / 프로필 조회는
 *   프론트가 useEffect로 배선하고, 그 결과(Session/프로필)를 이 atom에 set 한다.
 *
 * ⚠ 런타임 supabase-js 정적 import 금지. `Session`은 `import type`으로만 가져와 번들에서 지운다.
 *   `CommunityAuthor`도 타입 전용 import라 '@/shared/lib/supabase'의 런타임 코드가 딸려오지 않는다.
 *
 * ⚠ 이 폴더는 jotai 기존 배럴('@/jotai')에 **연결하지 않는다** — 초기 번들 오염 방지.
 *   커뮤니티 화면에서만 '@/jotai/community' 폴더 경로로 직접 import 한다.
 */

// ── 세션 / 프로필 ────────────────────────────────────────────────────────────

/** 로그인 세션. 프론트가 onAuthStateChange 콜백에서 set 한다. (초기 null = 로그아웃) */
export const sessionAtom = atom<Session | null>(null);

/** 내 공개 프로필(닉네임/아바타). 세션이 잡히면 프론트가 fetchMyProfile 결과를 set 한다. */
export const profileAtom = atom<CommunityAuthor | null>(null);

/** 파생: 로그인 여부. UI 진입점(글쓰기/좋아요 버튼) 게이팅에 쓴다. */
export const isLoggedInAtom = atom((get) => get(sessionAtom) !== null);

// ── UI 취향 (localStorage 유지) ───────────────────────────────────────────────

export type CommunityViewType = 'inline' | 'card';

/** 갤러리 보기 방식 저장 키 (테스트/디버깅에서 참조할 수 있게 export). */
export const COMMUNITY_VIEW_STORAGE_KEY = 'snowball:community-view';

/**
 * 갤러리 보기 방식. 새로고침/재방문에도 유지되도록 localStorage에 저장한다.
 * (localStorage를 못 쓰는 환경에서도 기본값 'card'로 안전하게 동작한다.)
 */
export const viewTypeAtom = atomWithStorage<CommunityViewType>(COMMUNITY_VIEW_STORAGE_KEY, 'card');

// ── 좋아요 캐시 ───────────────────────────────────────────────────────────────

/**
 * "내가 좋아요한 시나리오 id" 집합. 목록/상세에서 하트를 즉시 채우고 낙관적 토글에 쓴다.
 * 프론트가 fetchMyScenarioLikes 결과로 채우고, 토글 시 이 집합을 갱신한다.
 * (서버가 정본 — 이건 UI 반응성을 위한 클라이언트 캐시일 뿐이다.)
 */
export const likedScenarioIdsAtom = atom<Set<string>>(new Set<string>());

// ── 소비 훅 (프로젝트 컨벤션: useXAtomValue / useSetXWrite) ─────────────────────

export const useSessionAtomValue = () => useAtomValue(sessionAtom);
export const useSetSessionWrite = () => useAtomWrite(sessionAtom);
export const useProfileAtomValue = () => useAtomValue(profileAtom);
export const useSetProfileWrite = () => useAtomWrite(profileAtom);
export const useIsLoggedInAtomValue = () => useAtomValue(isLoggedInAtom);
export const useViewTypeAtomValue = () => useAtomValue(viewTypeAtom);
export const useSetViewTypeWrite = () => useAtomWrite(viewTypeAtom);
export const useLikedScenarioIdsAtomValue = () => useAtomValue(likedScenarioIdsAtom);
export const useSetLikedScenarioIdsWrite = () => useAtomWrite(likedScenarioIdsAtom);
