import { atom } from 'jotai/vanilla';
import { atomWithStorage } from 'jotai/utils';
import type { Session } from '@supabase/supabase-js';
import { useAtomValue, useAtomWrite } from '@/jotai/atom';
import type { MyProfile } from '@/shared/lib/supabase';

/**
 * 커뮤니티 전역 상태 — **순수 상태 컨테이너**.
 *
 * ⚠ 여기엔 IO를 넣지 않는다. onAuthStateChange 구독 / getSupabaseClient 호출 / 프로필 조회는
 *   프론트가 useEffect로 배선하고, 그 결과(Session/프로필)를 이 atom에 set 한다.
 *
 * ⚠ 런타임 supabase-js 정적 import 금지. `Session`은 `import type`으로만 가져와 번들에서 지운다.
 *   `MyProfile`도 타입 전용 import라 '@/shared/lib/supabase'의 런타임 코드가 딸려오지 않는다.
 *
 * ⚠ 이 폴더는 jotai 기존 배럴('@/jotai')에 **연결하지 않는다** — 초기 번들 오염 방지.
 *   커뮤니티 화면에서만 '@/jotai/community' 폴더 경로로 직접 import 한다.
 */

// ── 세션 / 프로필 ────────────────────────────────────────────────────────────

/** 로그인 세션. 프론트가 onAuthStateChange 콜백에서 set 한다. (초기 null = 로그아웃) */
export const sessionAtom = atom<Session | null>(null);

/**
 * 내 공개 프로필(닉네임/아바타/운영자여부). 세션이 잡히면 프론트가 fetchMyProfile 결과를 set 한다.
 * 작성자 임베드 타입(CommunityAuthor)이 아니라 한 필드 넓은 `MyProfile` 인 이유는 types.ts 주석 참고.
 */
export const profileAtom = atom<MyProfile | null>(null);

/** 파생: 로그인 여부. UI 진입점(글쓰기/좋아요 버튼) 게이팅에 쓴다. */
export const isLoggedInAtom = atom((get) => get(sessionAtom) !== null);

/**
 * 파생: **현재 로그인 사용자가 운영자인가.** 관리자 전용 UI 노출에만 쓴다.
 *
 * - 비로그인 / 프로필 미조회 / 조회 실패 / `is_admin` 컬럼 부재(마이그레이션 전) → 전부 `false`.
 *   즉 "모르면 일반 사용자"로 안전하게 떨어진다.
 * - Provider(Context)가 아니라 atom 파생이라 **CommunityAuthProvider 없이 격리 렌더돼도 throw 하지
 *   않는다**(useCommunityAuth 와 다른 점). 테스트에서는 `store.set(profileAtom, {...is_admin:true})`
 *   로 관리자를 위조하면 된다.
 * - ⚠ 이건 **표시 힌트**다. 이 값에 걸린 RLS/서버 권한은 없다(사용자 결정: UI 수준 차단만).
 */
export const isCommunityAdminAtom = atom((get) => get(profileAtom)?.is_admin === true);

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
 * "내가 좋아요한 게시글 id" 집합. 목록/상세에서 하트를 즉시 채우고 낙관적 토글에 쓴다.
 * 프론트가 fetchMyPostLikes 결과로 채우고, 토글 시 이 집합을 갱신한다.
 * (서버가 정본 — 이건 UI 반응성을 위한 클라이언트 캐시일 뿐이다.)
 */
export const likedPostIdsAtom = atom<Set<string>>(new Set<string>());

// ── 소비 훅 (프로젝트 컨벤션: useXAtomValue / useSetXWrite) ─────────────────────

export const useSessionAtomValue = () => useAtomValue(sessionAtom);
export const useSetSessionWrite = () => useAtomWrite(sessionAtom);
export const useProfileAtomValue = () => useAtomValue(profileAtom);
export const useSetProfileWrite = () => useAtomWrite(profileAtom);
export const useIsLoggedInAtomValue = () => useAtomValue(isLoggedInAtom);
/** 현재 로그인 사용자가 운영자인가. 관리자 전용 UI 게이팅용 — 모르면 false. */
export const useIsCommunityAdmin = (): boolean => useAtomValue(isCommunityAdminAtom);
export const useViewTypeAtomValue = () => useAtomValue(viewTypeAtom);
export const useSetViewTypeWrite = () => useAtomWrite(viewTypeAtom);
export const useLikedPostIdsAtomValue = () => useAtomValue(likedPostIdsAtom);
export const useSetLikedPostIdsWrite = () => useAtomWrite(likedPostIdsAtom);
