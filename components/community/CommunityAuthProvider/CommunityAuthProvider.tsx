import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import {
  fetchMyProfile,
  getSession,
  getSupabaseClient,
  onAuthStateChange,
  signInWithOAuth,
  signOut,
  type CommunityClient,
  type CommunityOAuthProvider
} from '@/shared/lib/supabase';
import { useSetProfileWrite, useSetSessionWrite } from '@/jotai/community';
import { LoginModal } from '@/components/community/LoginModal';
import { CommunityAuthContext, type CommunityAuthContextValue } from './CommunityAuthProvider.context';

/**
 * 커뮤니티 세션 배선 + 인증 액션의 단일 지점.
 *
 * - 마운트 시 supabase 클라이언트를 지연 로드하고 세션/프로필을 atom에 하이드레이션한다.
 * - onAuthStateChange를 전역 1회 구독한다(cleanup에서 해제).
 * - 로그인 유도 모달을 소유한다 — 하위 컴포넌트는 `openLoginPrompt()`만 호출한다.
 *
 * ⚠ 이 배선은 커뮤니티 라우트 안에서만 돈다(Provider가 lazy 레이아웃 하위). 대시보드는
 *   supabase-js를 로드하지 않는다.
 */
export default function CommunityAuthProvider({ children }: { children: ReactNode }) {
  const setSession = useSetSessionWrite();
  const setProfile = useSetProfileWrite();
  const clientRef = useRef<CommunityClient | null>(null);
  const [promptOpen, setPromptOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [authReady, setAuthReady] = useState(false);

  // 세션 변화 → 프로필 동기화. 최신 세션의 user id로 프로필을 다시 읽는다.
  const syncProfile = useCallback(
    async (session: Session | null) => {
      const client = clientRef.current;
      if (!client || !session) {
        setProfile(null);
        return;
      }
      try {
        const profile = await fetchMyProfile(client, session.user.id);
        setProfile(profile);
      } catch {
        setProfile(null);
      }
    },
    [setProfile]
  );

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | null = null;

    const hydrate = async () => {
      const client = await getSupabaseClient();
      if (!client || cancelled) {
        if (!cancelled) setAuthReady(true);
        return;
      }
      clientRef.current = client;

      try {
        const session = await getSession(client);
        if (cancelled) return;
        setSession(session);
        void syncProfile(session);
      } catch {
        // 세션 조회 실패 시 로그아웃 상태로 둔다.
      } finally {
        if (!cancelled) setAuthReady(true);
      }

      unsubscribe = onAuthStateChange(client, (session) => {
        setSession(session);
        void syncProfile(session);
      });
    };

    void hydrate();

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [setSession, syncProfile]);

  const login = useCallback(async (provider: CommunityOAuthProvider) => {
    const client = clientRef.current ?? (await getSupabaseClient());
    if (!client) return;
    clientRef.current = client;
    setPending(true);
    try {
      await signInWithOAuth(client, provider);
      // 성공 시 브라우저가 OAuth 화면으로 리다이렉트된다(이 시점 이후 코드는 보통 실행되지 않는다).
    } catch {
      setPending(false);
    }
  }, []);

  const logout = useCallback(async () => {
    const client = clientRef.current ?? (await getSupabaseClient());
    if (!client) return;
    try {
      await signOut(client);
    } finally {
      setSession(null);
      setProfile(null);
    }
  }, [setProfile, setSession]);

  const openLoginPrompt = useCallback(() => setPromptOpen(true), []);

  const value = useMemo<CommunityAuthContextValue>(
    () => ({ authReady, openLoginPrompt, login, logout }),
    [authReady, login, logout, openLoginPrompt]
  );

  return (
    <CommunityAuthContext.Provider value={value}>
      {children}
      {promptOpen ? (
        <LoginModal
          pending={pending}
          onClose={() => setPromptOpen(false)}
          onSelectProvider={(provider) => void login(provider)}
        />
      ) : null}
    </CommunityAuthContext.Provider>
  );
}
