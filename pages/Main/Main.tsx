import { useMarketIndicesSync } from '@/jotai';
import { CommunityAuthProvider } from "@/components/community/CommunityAuthProvider";
import { useFxRateSync } from "@/jotai";
import { useDocumentMeta } from "@/pages/Ticker/hooks";
import { SIMULATOR_COPY } from "@/shared/constants";
import { SIMULATOR_PATH } from "@/shared/constants/routes";
import MainView from "./Main.view";
import { useEnsureSelectedTicker, useTickerActions } from "./hooks";

export default function MainPage() {
  /* 🔴 참고 시세 조회 드라이버 — 이 화면이 `MarketIndexStrip` 을 그리므로 여기서 한 번만 부른다.
     부품 안에서 부르면 한 화면에 두 곳에 놓았을 때 중복 조회가 된다. */
  useMarketIndicesSync();

  useEnsureSelectedTicker();

  // 이 화면의 문서 메타. `/` 를 랜딩이 가져간 뒤로 `index.html` 의 정적 메타는 **랜딩의 것**이라,
  // 선언하지 않으면 `/simulator` 가 랜딩 제목·설명을 그대로 쓰게 된다(중복 제목·GA4 page_title 오염).
  // 훅이 언마운트 시 이전 값으로 되돌리므로 랜딩↔시뮬레이터 왕복에도 안전하다.
  useDocumentMeta({
    title: SIMULATOR_COPY.meta.title,
    description: SIMULATOR_COPY.meta.description,
    pathname: SIMULATOR_PATH
  });

  // 원↔달러 환율 조회의 **유일한** 구동 지점. 환율 위젯과 결과 표시 통화 토글이 같은 atom을 구독하므로
  // fetch는 여기서 한 번만 일어난다. 설정 드로어 안 위젯이 어떻게 되든 값과 갱신 루프는 여기서 살아 있다.
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
