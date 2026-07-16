import { createContext, useContext } from 'react';
import type { CommunityOAuthProvider } from '@/shared/lib/supabase';

export type CommunityAuthContextValue = {
  /** 초기 세션 확인이 끝났는가(false면 "아직 모름" — 로그인 게이트를 성급히 보여주지 않기 위함). */
  authReady: boolean;
  /** 로그인 유도 모달을 연다(비로그인 사용자가 게이트된 액션을 시도할 때). */
  openLoginPrompt: () => void;
  /** OAuth 로그인 시작(프로바이더 동의 화면으로 리다이렉트). */
  login: (provider: CommunityOAuthProvider) => Promise<void>;
  /** 로그아웃 후 세션/프로필 atom을 비운다. */
  logout: () => Promise<void>;
};

export const CommunityAuthContext = createContext<CommunityAuthContextValue | null>(null);

/** 커뮤니티 라우트(Provider 하위)에서만 유효하다. */
export const useCommunityAuth = (): CommunityAuthContextValue => {
  const value = useContext(CommunityAuthContext);
  if (!value) {
    throw new Error('useCommunityAuth는 CommunityAuthProvider 안에서만 쓸 수 있습니다.');
  }
  return value;
};
