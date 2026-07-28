import AppHeader from '@/components/AppHeader';
import { CommunityAuthProvider } from '@/components/community/CommunityAuthProvider';
import { isCommunityEnabled } from '@/shared/lib/supabase';
import type { TickerPageShellProps } from './TickerPageShell.types';
import { ShellMain, ShellRoot } from './TickerPageShell.styled';

/**
 * ETF 소개(허브·상세) · 내 포트폴리오 · 배당 캘린더의 공통 크롬.
 *
 * 헤더는 **전 페이지 공용 `AppHeader`** 그대로다 — 워드마크·라우트 메뉴만이 아니라 로그인(프로필)과
 * 더보기(⋯)까지 시뮬레이터·커뮤니티와 같은 자리·같은 접근명으로 온다. 예전에는 이 셸이 헤더를
 * 자기 손으로 조립해 그 두 컨트롤이 빠져 있었고, "이 화면에만 로그인이 없다"는 신고가 반복됐다.
 *
 * 헤더 워드마크는 `brandAs` 기본값 `'span'` 이다 — 티커 상세의 유일 `<h1>` 은 히어로의 티커 제목이어야
 * 하므로 워드마크가 제목을 겸하지 않는다.
 *
 * ⚠ `AuthControl` 은 `useCommunityAuth`(Provider 없으면 throw)로 로그인 모달을 연다. 시뮬레이터가
 * `MainPage` 를 Provider 로 감싸는 것과 같은 이유로, 이 셸도 세션 하이드레이션 + 로그인 모달을 소유한다.
 * 커뮤니티 비활성 배포에선 `AppHeader` 가 `AuthControl` 자체를 렌더하지 않으므로 Provider 도 두지 않는다.
 *
 * ⚠ 번들: Provider 는 시뮬레이터(eager)가 이미 쓰고 있어 엔트리 그래프에 있고, supabase-js SDK 는
 * `getSupabaseClient()` 의 동적 import 뒤에 있다 — 이 lazy 청크에서 참조해도 엔트리가 커지지 않는다.
 */
export default function TickerPageShell({ children }: TickerPageShellProps) {
  const shell = (
    <ShellRoot>
      <AppHeader />
      <ShellMain>{children}</ShellMain>
    </ShellRoot>
  );

  if (!isCommunityEnabled) return shell;
  return <CommunityAuthProvider>{shell}</CommunityAuthProvider>;
}
