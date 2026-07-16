// Pretendard 셀프호스팅. CDN이 아니라 npm 패키지에서 직접 번들한다(성능·프라이버시).
// 동적 서브셋(unicode-range 92분할)이라 브라우저는 실제로 그리는 글자에 해당하는 조각만 내려받는다.
// 통짜 가변 폰트(PretendardVariable.woff2)는 2.05MB라 초기 로딩에 쓰기엔 너무 크다.
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
import ReactDOM from "react-dom/client";
import AppRouter from "@/router";
import { applySeoRuntimeMetadata, initGoogleAnalytics } from "@/shared/lib/analytics";

applySeoRuntimeMetadata();
initGoogleAnalytics();

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
