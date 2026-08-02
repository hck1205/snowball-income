import { useCallback } from 'react';
import { useOptionalCommunityAuth } from '@/components/community/CommunityAuthProvider';
import { useIsLoggedInAtomValue } from '@/jotai/community';
import type { CommunityOAuthProvider } from '@/shared/lib/supabase';
import type { LedgerAppAuthGate } from '../types';

export type LedgerAppAuth = {
  /**
   * 앱 로그인 게이트. `null` = **이 배포에 앱 로그인 계층이 없다**(커뮤니티/Supabase 비활성) →
   * 게이트를 세우지 않고 곧바로 시트 연결로 간다. 없는 절차를 요구하면 죽은 버튼만 남는다.
   */
  gate: LedgerAppAuthGate | null;
  signIn: (provider: CommunityOAuthProvider) => void;
};

/**
 * `/ledger` 의 **앱 신원** 층.
 *
 * ## 왜 구글 시트 권한과 합치지 않는가 (🔴 재설계 금지)
 * 두 개는 서로 다른 층이고 중첩되지 않는다.
 *  - **앱 신원**("당신은 누구인가") = Supabase 세션. 구글·네이버·카카오 아무 계정이나 된다.
 *  - **구글 리소스 권한**("당신 구글 시트를 읽고 써도 되는가") = GIS 액세스 토큰(`drive.file`).
 *
 * Supabase 의 `provider_token` 을 시트 호출에 재사용하지 **않는다**: ①공식 문서가 Supabase 는 그
 * 토큰을 갱신하지 않는다고 명시하고 ②Supabase 세션은 localStorage 에 저장돼 "토큰은 메모리에만"
 * 전제를 구조적으로 깨며 ③카카오·네이버로 로그인한 사용자를 전부 배제한다
 * (`shared/lib/googleSheets/auth.ts` 가 이미 이 구조다).
 * 그래서 네이버로 로그인한 사용자는 **로그인을 갈아타지 않고** 구글 동의만 따로 받는다.
 *
 * ## 왜 `useCommunityAuth` 를 그대로 쓰는가
 * 세션 하이드레이션·로그인 모달·OAuth 실패 안내·GA 귀속(`writeLoginSource`)이 전부 그 Provider 에
 * 모여 있다. 여기서 `signInWithOAuth` 를 직접 부르면 그 배선이 통째로 빠져 **두 번째 로그인
 * 경로**가 생긴다. 이름만 커뮤니티일 뿐 실제로는 앱 전역 세션이고, `/ledger` 가 쓰는 셸
 * (`TickerPageShell`)이 이미 그 Provider 를 마운트한다 — 그래서 **승격(파일 이동)을 하지 않았다.**
 * ⚠ Provider 는 셸 안쪽에만 있으므로 이 훅은 셸 **하위**에서 불러야 한다.
 *
 * `useOptionalCommunityAuth` 를 쓰는 이유: Provider 없이 격리 렌더돼도 throw 하지 않는다.
 */
export function useLedgerAppAuth(): LedgerAppAuth {
  const auth = useOptionalCommunityAuth();
  const isLoggedIn = useIsLoggedInAtomValue();

  const login = auth?.login;
  const signIn = useCallback(
    (provider: CommunityOAuthProvider) => {
      void login?.(provider);
    },
    [login]
  );

  return {
    gate: auth === null ? null : { isReady: auth.authReady, isLoggedIn },
    signIn
  };
}
