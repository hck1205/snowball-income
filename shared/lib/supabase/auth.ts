import type { Session, User } from '@supabase/supabase-js';
import type { CommunityClient } from './queries';
import type { CommunityAuthor } from './types';

/**
 * 인증 — Supabase Auth OAuth (구글 / 카카오).
 *
 * 네이버는 Supabase 기본 프로바이더가 아니라 이번 범위 밖이다.
 * 나중에 붙일 때 이 파일의 시그니처(`CommunityOAuthProvider`)만 넓히면 되도록
 * 프로바이더를 문자열 유니온으로 열어둔다. (docs/supabase/README.md 참고)
 */
export type CommunityOAuthProvider = 'google' | 'kakao';

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
  const { error } = await client.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: redirectTo ?? (typeof window !== 'undefined' ? window.location.href : undefined)
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
  patch: { displayName?: string; avatarUrl?: string | null }
): Promise<void> => {
  const { error } = await client
    .from('profiles')
    .update({
      ...(patch.displayName !== undefined ? { display_name: patch.displayName } : {}),
      ...(patch.avatarUrl !== undefined ? { avatar_url: patch.avatarUrl } : {})
    })
    .eq('id', userId);

  if (error) throw new Error(error.message);
};
