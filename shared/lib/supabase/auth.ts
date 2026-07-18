import type { Session, User } from '@supabase/supabase-js';
import type { CommunityClient } from './queries';
import type { CommunityAuthor } from './types';
import { startNaverLogin } from './naver';
import { sanitizeOAuthRedirectTo } from './oauthCallback';

/**
 * 인증 — 소셜 로그인(구글 / 카카오 / 네이버).
 *
 * 구글·카카오는 Supabase 기본 프로바이더라 `client.auth.signInWithOAuth` 로 바로 붙는다.
 * **네이버는 Supabase 기본 프로바이더가 아니라 경로가 다르다** — Supabase 에 네이버를 흘리면
 * 타입·런타임 모두에서 거부된다. 그래서 아래 `signInWithOAuth` 가 provider==='naver' 를 가로채
 * `startNaverLogin`(우리 authorize 리다이렉트 + state)으로 라우팅한다. 이 분기 덕분에 호출부는
 * provider 문자열 하나만 넘기면 되고(로그인 액션 통일), 'naver' 가 실수로 Supabase 로 새지 않는다.
 * 세부 흐름은 shared/lib/supabase/naver.ts 참고.
 */
export type CommunityOAuthProvider = 'google' | 'kakao' | 'naver';

/**
 * 프로바이더별 요청 scope.
 *
 * 카카오: **닉네임만 요청한다.** 프로필 사진 기능을 앱에서 제거했으므로 profile_image 는 받지 않는다
 * (표시는 전 소비처가 이니셜 아바타로 통일). 이메일도 요청하지 않는다 — 카카오계정(이메일)은 개인
 * 개발자 앱에서 "필수 동의"로 못 쓰고(비즈니스 앱 검수 필요), 요청하면 KOE205로 로그인 자체가 막힌다.
 * 카카오 콘솔의 동의항목에서 profile_nickname 이 켜져 있어야 한다.
 *
 * 구글: 기본 scope(이메일·프로필)로 충분해 별도 지정하지 않는다.
 */
const OAUTH_SCOPES: Partial<Record<CommunityOAuthProvider, string>> = {
  kakao: 'profile_nickname'
};

/**
 * OAuth 로그인 시작 → 프로바이더 동의 화면으로 리다이렉트된다.
 *
 * redirectTo는 **Supabase 대시보드의 Redirect URLs에 등록된 값**이어야 한다.
 * 등록되지 않은 URL로 돌아오면 Supabase가 로그인을 거부한다.
 * 기본값은 현재 페이지 — 로그인 후 보던 화면으로 돌아온다.
 */
export const signInWithOAuth = async (
  client: CommunityClient,
  provider: CommunityOAuthProvider,
  redirectTo?: string
): Promise<void> => {
  // 네이버는 Supabase 콜백을 타지 않는다 → 우리 authorize 리다이렉트(+ /api/naver-auth) 경로로.
  if (provider === 'naver') {
    startNaverLogin(redirectTo);
    return; // 이 시점 이후 브라우저는 네이버 authorize 로 떠난다.
  }

  const { error } = await client.auth.signInWithOAuth({
    provider, // 여기선 'google' | 'kakao' 로 좁혀진다(위 분기가 'naver' 를 걸러냄)
    options: {
      // 현재 페이지로 복귀하되, 이전 로그인이 남긴 잔여 해시/OAuth 잔재를 제거한다
      // (제거 안 하면 다음 콜백 URL 이 `…/#?code=…` 로 어긋나 재로그인이 조용히 실패한다).
      redirectTo:
        redirectTo ?? (typeof window !== 'undefined' ? sanitizeOAuthRedirectTo(window.location.href) : undefined),
      scopes: OAUTH_SCOPES[provider]
    }
  });
  if (error) throw new Error(error.message);
};

/**
 * 개발/테스트용 이메일·비밀번호 로그인.
 *
 * OAuth(구글/카카오)를 아직 설정하지 않았어도 글쓰기 등 인증 기능을 실제로 테스트하려면
 * **진짜 Supabase 세션**이 필요하다(RLS가 auth.uid()를 요구 → 클라이언트에서 로그인 상태만
 * 흉내내면 INSERT가 DB에서 거부된다). Supabase 대시보드에서 테스트 사용자(이메일+비번, auto-confirm)를
 * 만든 뒤 이걸로 로그인하면 진짜 세션이 생겨 글이 실제로 저장된다. (main.tsx의 dev `__devLogin` 헬퍼가 호출)
 */
export const signInWithPassword = async (
  client: CommunityClient,
  email: string,
  password: string
): Promise<void> => {
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
};

export const signOut = async (client: CommunityClient): Promise<void> => {
  const { error } = await client.auth.signOut();
  if (error) throw new Error(error.message);
};

export const getSession = async (client: CommunityClient): Promise<Session | null> => {
  const { data, error } = await client.auth.getSession();
  if (error) throw new Error(error.message);
  return data.session;
};

export const getCurrentUser = async (client: CommunityClient): Promise<User | null> => {
  const session = await getSession(client);
  return session?.user ?? null;
};

/**
 * 로그인/로그아웃 구독. 반환된 함수를 호출하면 구독 해제 (useEffect cleanup에 그대로 쓴다).
 */
export const onAuthStateChange = (
  client: CommunityClient,
  handler: (session: Session | null) => void
): (() => void) => {
  const { data } = client.auth.onAuthStateChange((_event, session) => handler(session));
  return () => data.subscription.unsubscribe();
};

/**
 * 내 공개 프로필. 가입 시 서버 트리거가 만들어 두므로 보통 존재한다.
 * (없으면 null — UI는 닉네임 설정을 유도하면 된다)
 */
export const fetchMyProfile = async (
  client: CommunityClient,
  userId: string
): Promise<CommunityAuthor | null> => {
  const { data, error } = await client
    .from('profiles')
    .select('id,display_name,avatar_url')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as CommunityAuthor | null) ?? null;
};

export const updateMyProfile = async (
  client: CommunityClient,
  userId: string,
  patch: { displayName: string }
): Promise<void> => {
  const { error } = await client
    .from('profiles')
    .update({ display_name: patch.displayName })
    .eq('id', userId);

  if (error) throw new Error(error.message);
};
