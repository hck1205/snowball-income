import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import {
  clearOAuthLoginFailure,
  fetchMyProfile,
  getSession,
  getSupabaseClient,
  onAuthStateChange,
  readOAuthLoginFailure,
  signInWithOAuth,
  signOut,
  type CommunityClient,
  type CommunityOAuthProvider,
  type OAuthLoginFailure
} from '@/shared/lib/supabase';
import { useSetProfileWrite, useSetSessionWrite } from '@/jotai/community';
import {
  ANALYTICS_EVENT,
  readAndClearLoginSource,
  setUserProperties,
  trackEvent,
  writeLoginSource
} from '@/shared/lib/analytics';
import { LoginModal } from '@/components/community/LoginModal';
import { CommunityAuthContext, type CommunityAuthContextValue } from './CommunityAuthProvider.context';

/**
 * 로그인 세션이 잡히면 `has_account` 코호트를 태깅한다(GA4 User Property, 멱등 — 매번 set해도 마지막 값 사용).
 * 세션 복원(재방문 로그인 유지)에도 걸려 로그인 사용자를 빠짐없이 태깅한다. PII 없이 boolean만 보낸다.
 */
const markAccountUserProperty = (session: Session | null) => {
  if (session) setUserProperties({ has_account: true });
};

/**
 * 로그인 완료(login_completed) 발화 — 커뮤니티 랜딩용. `login()` 이 리다이렉트 직전에 심은 source 마커가
 * 있을 때만(=이번 로드가 방금 로그인) 1회 발화하고 마커를 지운다. 세션 복원(마커 없음)엔 발화하지 않는다.
 * 메인 랜딩은 useCloudWorkspaceSync가 같은 마커로 발화 — read+clear 게이팅이라 로그인당 정확히 1회.
 */
const markLoginCompleted = (session: Session | null) => {
  if (!session) return;
  const source = readAndClearLoginSource();
  if (source) trackEvent(ANALYTICS_EVENT.LOGIN_COMPLETED, { source });
};

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
  // 직전 OAuth 콜백이 실패했으면(main.tsx finalizeOAuthCallback 이 localStorage 에 기록) 그 기록을 읽어
  // 로그인 모달 상단에 안내 배너로 띄운다(무음 실패 금지). 마운트 시 1회 읽고, 이후 로그인 성공/재시도/닫기에서 정리.
  const [loginFailure, setLoginFailure] = useState<OAuthLoginFailure | null>(() => readOAuthLoginFailure());

  const dismissLoginFailure = useCallback(() => {
    setLoginFailure(null);
    clearOAuthLoginFailure();
  }, []);

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
        markAccountUserProperty(session);
        markLoginCompleted(session);
        void syncProfile(session);
        if (session) {
          // 이미 로그인돼 있으면 남아 있던 실패 기록은 유효하지 않다(다른 프로바이더로 성공했거나 세션 복원).
          dismissLoginFailure();
        } else if (readOAuthLoginFailure()) {
          // 콜백에서 실패해 돌아왔다 — 사용자가 클릭하기 전에 즉시 보이게 로그인 모달을 자동으로 연다.
          // 자동으로 여는 것은 안내 표면화까지이고 **재로그인은 자동 실행하지 않는다**(루프 차단).
          setPromptOpen(true);
        }
      } catch {
        // 세션 조회 실패 시 로그아웃 상태로 둔다.
      } finally {
        if (!cancelled) setAuthReady(true);
      }

      unsubscribe = onAuthStateChange(client, (session) => {
        setSession(session);
        markAccountUserProperty(session);
        markLoginCompleted(session);
        void syncProfile(session);
        if (session) dismissLoginFailure(); // 로그인이 실제로 성립하면 실패 안내를 즉시 거둔다.
      });
    };

    void hydrate();

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [setSession, syncProfile, dismissLoginFailure]);

  const login = useCallback(async (provider: CommunityOAuthProvider) => {
    const client = clientRef.current ?? (await getSupabaseClient());
    if (!client) return;
    clientRef.current = client;
    // 사용자가 재시도를 명시적으로 시작했다 — 직전 실패 안내는 거둔다(실패하면 콜백이 새로 기록한다).
    dismissLoginFailure();
    setPending(true);
    try {
      // 전환 귀속 마커 — 리다이렉트 직전에 제공자(source)를 심는다. 복귀 랜딩(메인/커뮤니티)이
      // read+clear 로 login_completed 를 1회 발화한다. OAuth 는 풀 리다이렉트라 이 sessionStorage 로 건넌다.
      writeLoginSource(provider);
      await signInWithOAuth(client, provider);
      // 성공 시 브라우저가 OAuth 화면으로 리다이렉트된다(이 시점 이후 코드는 보통 실행되지 않는다).
    } catch {
      setPending(false);
    }
  }, [dismissLoginFailure]);

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
          failure={loginFailure}
          onClose={closeLoginPrompt}
          onSelectProvider={(provider) => void login(provider)}
        />
      ) : null}
    </CommunityAuthContext.Provider>
  );
}
