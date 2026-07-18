import { CommunityAuthProvider } from "@/components/community/CommunityAuthProvider";
import MainView from "./Main.view";
import { useEnsureSelectedTicker, useTickerActions } from "./hooks";

export default function MainPage() {
  useEnsureSelectedTicker();

  const {
    closeHelp,
    closeTickerModal,
    deleteTicker,
    handleBackdropClick,
    openHelpExpectedTotalReturn,
    saveTicker,
  } = useTickerActions();

  // 세션 하이드레이션 + 로그인 유도 모달을 메인까지 확장한다(§8.2). 커뮤니티 레이아웃과 같은 Provider를
  // 그대로 재사용 — 헤더 AuthControl과 "내 저장" 로그인 게이트가 같은 세션을 읽는다.
  // supabase 미설정(백엔드 없는 배포)이면 Provider는 로그아웃 상태로 조용히 no-op이다.
  return (
    <CommunityAuthProvider>
      <MainView
        viewModel={{
          closeHelp,
          closeTickerModal,
          deleteTicker,
          handleBackdropClick,
          openHelpExpectedTotalReturn,
          saveTicker,
        }}
      />
    </CommunityAuthProvider>
  );
}
