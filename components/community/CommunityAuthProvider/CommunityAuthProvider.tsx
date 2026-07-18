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

  // 프롬프트를 여닫을 때 항상 pending(진행 중 → 전 버튼 disabled)을 리셋한다.
  // OAuth 는 보통 풀 리다이렉트라 pending 이 살아있을 일이 없지만, 리다이렉트가 뜨기 전 닫거나
  // (네이버 오설정 에러 등으로) 리다이렉트 없이 돌아오면 pending 이 true 로 굳어, 재오픈 시 버튼이
  // 계속 비활성으로 남았다(사용자 리포트). 열림/닫힘 전이는 stale pending 을 항상 털어낸다.
  const openLoginPrompt = useCallback(() => {
    setPending(false);
    setPromptOpen(true);
  }, []);

  const closeLoginPrompt = useCallback(() => {
    setPending(false);
    setPromptOpen(false);
  }, []);

  // 프로필 저장 후 재조회. getSession 은 로컬 세션을 읽으므로 가볍다(네트워크 왕복 없음).
  const refreshProfile = useCallback(async () => {
    const client = clientRef.current ?? (await getSupabaseClient());
    if (!client) return;
    clientRef.current = client;
    try {
      const session = await getSession(client);
      await syncProfile(session);
    } catch {
      // 조회 실패 시 기존 profileAtom 을 유지한다(낙관적 갱신 금지 원칙과 정합).
    }
  }, [syncProfile]);

  const value = useMemo<CommunityAuthContextValue>(
    () => ({ authReady, openLoginPrompt, login, logout, refreshProfile }),
    [authReady, login, logout, openLoginPrompt, refreshProfile]
  );

  return (
    <CommunityAuthContext.Provider value={value}>
      {children}
      {promptOpen ? (
        <LoginModal
          pending={pending}
          onClose={closeLoginPrompt}
          onSelectProvider={(provider) => void login(provider)}
        />
      ) : null}
    </CommunityAuthContext.Provider>
  );
}
