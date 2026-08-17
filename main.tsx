// 본문 서체(font.sans) = Wanted Sans. CDN이 아니라 npm 패키지에서 직접 번들한다(성능·프라이버시).
// 동적 서브셋(unicode-range 92분할)이라 브라우저는 실제로 그리는 글자에 해당하는 조각만 내려받는다.
// 통짜 가변 폰트(WantedSansVariable.woff2)는 1.7MB라 초기 로딩에 쓰기엔 너무 크다.
import "wanted-sans/fonts/webfonts/variable/split/WantedSansVariable.css";
// 나머지 3역할(display=Gmarket Sans · heroNumeric=LINE Seed · dataNumeric=Inter)은 npm 배포가 없거나
// 서브셋이 필요해 직접 자른 woff2를 public/fonts/에 커밋해 두었다. 이 CSS는 그 @font-face 선언 묶음으로,
// `tools/fonts/build.mjs`가 생성한다(빌드는 네트워크를 타지 않는다 — 산출물이 레포에 있다).
import "@/shared/styles/selfHostedFonts.css";
import ReactDOM from "react-dom/client";
import AppRouter from "@/router";
import { ANALYTICS_EVENT, applySeoRuntimeMetadata, initGoogleAnalytics, peekLoginSource, track } from "@/shared/lib/analytics";
import { hasOAuthCallbackParams, isKakaoCallbackPath, isNaverCallbackPath } from "@/shared/lib/supabase";
import { clearChunkReloadMark, installChunkRecovery } from "@/shared/lib/chunkRecovery";
import { migrateLegacyStorageKeys } from "@/shared/lib/storage";

// 🔴 **저장소를 읽는 무엇보다 먼저 돈다.** 2026-08-17 에 브라우저 저장소 접두사를 `snowball:` →
// `hungryhippo:` 로 옮겼는데, 접두사는 코드가 아니라 **이미 사용자 기기에 있는 데이터의 주소**다.
// 이 한 줄이 없으면 앱은 빈 새 주소를 보게 되고 사용자에게는 팔레트·통화 초기화, 장부 연결 끊김,
// 투어 재노출로 나타난다 — 그중 `cloud-sync-base:<userId>` 소실은 동기화 충돌 해소의 기준선을
// 없애므로 가장 위험하다.
//
// ⚠ 아래 `installChunkRecovery()` 보다도 **먼저**다. 그쪽이 `chunk-reload` 마커를 읽기 때문이다.
//   이관은 동기이고 옮길 키가 없으면 "키 목록 한 번 훑기"라, 청크 복구가 늦어지는 비용은 없다.
// ⚠ import 순서에 기대는 side-effect 배선을 쓰지 않은 이유: 앱 코드에 **모듈 스코프 저장소 읽기가
//   없어서**(2026-08-17 확인) 여기서 불러도 충분하고, import 정렬 도구 하나에 깨지지 않는다.
migrateLegacyStorageKeys();

// 🔴 **가장 먼저 건다.** 새 배포가 나가면 lazy 청크의 해시 파일명이 전부 바뀌는데, 그때 이미 열려
// 있던 탭은 옛 해시를 기억한다 — 그 탭에서 화면을 옮기는 순간 없는 파일을 가져오려다 앱이 통째로
// 죽는다("Failed to fetch dynamically imported module", 2026-08-07 프로덕션 실측).
// 이 배선이 그 실패를 잡아 **한 번만** 새로고침한다. 라우터보다 앞이어야 라우터가 에러 화면을
// 그리기 전에 가로챈다.
installChunkRecovery();

applySeoRuntimeMetadata();
initGoogleAnalytics();

// OAuth 콜백 복귀를 **엔트리에서** 처리한다 — 어느 라우트로 돌아오든 세션이 확립되게 한다.
// 커뮤니티(`/community`)는 `React.lazy` 라, `/community?code=...` 로 풀 리로드되면 lazy 청크와
// supabase-js 동적 import 가 로드될 때까지 CommunityAuthProvider 가 마운트되지 않아
// detectSessionInUrl(코드 교환)이 지연된다(메인은 provider 가 eager 라 즉시 교환 — 그래서 메인만 됐다).
// 부팅 즉시 콜백 파라미터를 감지해, **콜백일 때만** supabase 를 당겨 코드 교환을 lazy 경계와
// 무관하게 시작한다. getSupabaseClient() 는 커뮤니티 비활성(백엔드 없는 배포)이면 null → 안전한 no-op.
// 콜백이 아닌 일반 방문은 이 블록을 건너뛰므로 SDK 를 내려받지 않는다(엔트리 번들 격리 유지).
//
// ⚠ 순서 중요: 네이버 콜백(`/community/auth/naver/callback?code=&state=`)도 쿼리에 `?code=` 를 실어
//   오므로 hasOAuthCallbackParams 가 true 다. 하지만 네이버 `code` 는 **네이버 인가코드**이지 Supabase
//   PKCE 코드가 아니다 — getSupabaseClient()의 detectSessionInUrl 이 이를 PKCE 코드로 오인해 삼키면
//   교환이 실패한다. 그래서 네이버 콜백 경로를 **먼저** 걸러 `completeNaverCallback` 로 보낸다. 이 함수는
//   supabase 클라이언트 생성 **전에** URL 에서 code/state 를 걷어내고, 서버(/api/naver-auth) 교환 →
//   verifyOtp 로 세션을 확립한 뒤 returnTo 로 replace 한다(lazy 커뮤니티 마운트와 무관).
//
// ⚠ 카카오도 2026-07-24 부터 **같은 커스텀 경로**를 탄다(계정 병합 회피 — shared/lib/supabase/kakao.ts).
//   `/community/auth/kakao/callback?code=&state=` 역시 `?code=` 를 실어 오므로 hasOAuthCallbackParams 가
//   true 다. 그 code 는 **카카오 인가코드**이지 Supabase 콜백 코드가 아니라서, 아래 일반 분기보다
//   **먼저** 걸러 `completeKakaoCallback` 로 보내야 한다(순서를 바꾸면 detectSessionInUrl 이 삼킨다).
//   env(VITE_KAKAO_CLIENT_ID) 미설정 배포에서는 애초에 이 경로로 착지하지 않는다(기존 Supabase 플로우 폴백).
if (isNaverCallbackPath(window.location.pathname)) {
  void import("@/shared/lib/supabase").then(({ completeNaverCallback }) => {
    void completeNaverCallback();
  });
} else if (isKakaoCallbackPath(window.location.pathname)) {
  void import("@/shared/lib/supabase").then(({ completeKakaoCallback }) => {
    void completeKakaoCallback();
  });
} else if (hasOAuthCallbackParams(window.location.search, window.location.hash)) {
  // OAuth 콜백 착지. supabase 가 URL 의 코드/토큰을 세션으로 교환하는데, **실패는 어디로도 전달되지 않고**
  // (생성자 초기화라 호출부에 error 가 안 온다) **실패 시 콜백 파라미터가 URL 에 남아** 새로고침마다 같은
  // 콜백을 다시 처리·재실패한다(사용자가 겪은 무한 루프의 정체). finalizeOAuthCallback 이 세션 생성까지
  // 확인하고, 성공/실패 어느 쪽이든 **콜백 파라미터를 URL 에서 걷어낸다**(루프 차단). 실패는 login_failed 로
  // 계측해 무음 실패를 없앤다 — 안내(로그인 모달)는 CommunityAuthProvider 가 저장된 실패 기록을 읽어 띄운다.
  const startedProvider = peekLoginSource(); // 지우지 않는다 — 성공 랜딩이 login_completed 발화에 쓴다.
  void import("@/shared/lib/supabase").then(async ({ finalizeOAuthCallback }) => {
    const outcome = await finalizeOAuthCallback(startedProvider);
    if (outcome.status === "failed") {
      const f = outcome.failure;
      track(ANALYTICS_EVENT.LOGIN_FAILED, {
        provider: f.provider,
        reason: f.reason,
        in_app_browser: f.inAppBrowser,
        context_switched: f.contextSwitched,
        attempts: f.attempts,
        ...(f.errorCode ? { error_code: f.errorCode } : {})
      });
    }
  });
}

// 개발 전용 테스트 로그인. 콘솔에서 `await __devLogin('email','password')` 로 실제 Supabase 세션을 만든다.
// (OAuth 미설정 상태에서 글쓰기 등을 테스트하기 위함) supabase-js는 호출 시점에만 동적 로드되므로
// 엔트리 번들 격리가 유지되고, 이 블록 전체는 프로덕션 빌드에서 제거된다(import.meta.env.DEV 가드).
if (import.meta.env.DEV) {
  (window as unknown as { __devLogin?: (email: string, password: string) => Promise<void> }).__devLogin = async (
    email,
    password
  ) => {
    const { getSupabaseClient, signInWithPassword } = await import("@/shared/lib/supabase");
    const client = await getSupabaseClient();
    if (!client) throw new Error("커뮤니티가 비활성입니다 (VITE_SUPABASE_* 미설정).");
    await signInWithPassword(client, email, password);
    // CommunityAuthProvider가 onAuthStateChange를 구독 중이라 로그인 상태가 자동 반영된다.
    console.info("[devLogin] 로그인 성공 — 이제 /community에서 글쓰기를 테스트할 수 있습니다.");
  };
}

ReactDOM.createRoot(document.getElementById("root")!).render(<AppRouter />);

// 여기까지 왔다 = 앱이 떴다. 복구 표식을 지워 **다음 배포에서 또 복구할 수 있게** 한다
// (안 지우면 탭 수명 동안 복구가 한 번뿐이라, 하루에 두 번 배포하면 두 번째는 못 산다).
clearChunkReloadMark();
