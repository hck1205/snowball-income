import { CommunityAuthProvider } from "@/components/community/CommunityAuthProvider";
import { useFxRateSync } from "@/jotai";
import MainView from "./Main.view";
import { useEnsureSelectedTicker, useTickerActions } from "./hooks";

export default function MainPage() {
  useEnsureSelectedTicker();

  // 원↔달러 환율 조회의 **유일한** 구동 지점. 환율 위젯과 결과 표시 통화 토글이 같은 atom을 구독하므로
  // fetch는 여기서 한 번만 일어난다. 좌패널(위젯)이 모바일 드로어에서 언마운트돼도 값과 갱신 루프는 살아 있다.
  // 이 훅은 atom을 구독하지 않고 쓰기만 해서(useSetAtom) 환율이 도착해도 이 컨테이너는 리렌더되지 않는다.
  useFxRateSync();

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
