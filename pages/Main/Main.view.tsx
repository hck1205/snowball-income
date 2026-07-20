import { Global } from "@emotion/react";
import { lazy, memo, Suspense, useCallback, useRef, useState } from "react";
import { FeatureLayout, MainContent, SkipLink } from "@/pages/Main/Main.shared.styled";
import MobileMenuDrawer from "@/components/MobileMenuDrawer";
import TourGuide from "@/components/TourGuide";
import { CloudSyncIndicator } from "@/components/CloudSyncIndicator";
import { AuthControl } from "@/components/community/AuthControl";
import { isCommunityEnabled } from "@/shared/lib/supabase";
import {
  useIsConfigDrawerOpenAtomValue,
  useIsTickerModalOpenAtomValue,
  useSetIsConfigDrawerOpenWrite,
} from "@/jotai";
import HelpModal from "./components/HelpModal";
import {
  MainContentLoader,
  MainLeftPanel,
  MainOverflowMenu,
  MainRightPanel,
  MarketDataAsOf,
  ModelChangeNotice,
} from "./components";
import { globalStyle } from "./Main.styled";
import type { MainViewProps } from "./Main.types";

/**
 * TickerModal만 지연 로딩한다.
 *
 * 이 모달은 상장 티커 자동완성 JSON(~1.2MB)을 끌고 온다. 프리셋만 쓰는 사용자는 열지도 않는 화면이라
 * 첫 로드에서 받을 이유가 없다.
 *
 * ⚠ 예전에는 `MODE === "test" ? StaticImport : lazy(...)` 형태였는데, 그 정적 import 한 줄이
 *    코드 스플리팅을 통째로 무력화하고 있었다. 롤업은 어떤 모듈이 정적·동적으로 동시에 import되면
 *    그 모듈을 부모 청크에 넣어버린다. 그래서 lazy()를 걸어놨는데도 티커 JSON이 계속 엔트리에 박혀 있었다.
 *    (같은 이유로 ./components 배럴에서도 TickerModal re-export를 뺐다.)
 *
 * HelpModal은 일부러 정적 import로 남긴다 — 청크가 2KB뿐이라 쪼개도 얻는 게 없고,
 * 도움말 `?`를 누를 때마다 네트워크 왕복이 끼는 게 오히려 손해다.
 */
const TickerModal = lazy(() => import("./components/TickerModal"));

function MainViewComponent({ viewModel }: MainViewProps) {
  const isConfigDrawerOpen = useIsConfigDrawerOpenAtomValue();
  const setIsConfigDrawerOpen = useSetIsConfigDrawerOpenWrite();

  /**
   * 열렸을 때만 마운트한다 — lazy()는 "렌더되는 순간" import를 시작하기 때문이다.
   * TickerModal은 닫혀 있을 때 내부적으로 null을 반환할 뿐 계속 렌더되고 있었고, 그래서
   * 첫 페이지 로드에 티커 JSON 청크(~960KB)가 그대로 받아지고 있었다.
   * 모달 상태는 전부 jotai 원자에 있으므로(내부 useState 없음) 마운트 시점만 늦출 뿐 동작은 동일하다.
   */
  const isTickerModalOpen = useIsTickerModalOpenAtomValue();
  const openConfigDrawer = useCallback(() => setIsConfigDrawerOpen(true), [setIsConfigDrawerOpen]);
  const closeConfigDrawer = useCallback(() => setIsConfigDrawerOpen(false), [setIsConfigDrawerOpen]);

  /**
   * IndexedDB 하이드레이션 게이트. 좌패널(MainLeftPanel)이 하이드레이션 트리거를 소유하므로
   * 그 완료 신호를 `onHydratedChange`로 끌어올려 여기서 받는다. 우패널 결과는 좌패널과 같은
   * atom 하이드레이션에 깜빡이므로, 이 신호로 결과 렌더를 함께 홀딩해 기본값→저장값 이중 렌더를 없앤다.
   *
   * 좌패널은 자기 내부에서 홀딩한다(트리거 유지 필요 → 게이트로 언마운트하면 데드락). 우패널만 여기서 게이트.
   */
  const [isPortfolioHydrated, setIsPortfolioHydrated] = useState(false);

  /**
   * 클라우드 저장 실패 인디케이터(헤더)의 "다시 시도" 배선.
   *
   * 실제 재시도(retryCloudSave)는 usePortfolioPersistence가 소유하고, 그 훅은 리렌더 회귀를 막기 위해
   * MainLeftPanel 안에만 산다(모든 폼/포트폴리오 atom을 구독하므로 여기로 hoist하면 매 타건 리렌더).
   * 그래서 좌패널이 자기 retry 함수를 ref에 등록만 하고, 헤더는 안정적인 래퍼로 그것을 호출한다.
   * ref 갱신은 setState가 아니라 대입이라 Main.view/헤더 크롬은 리렌더되지 않는다(memo 유지).
   */
  const retryCloudSaveRef = useRef<(() => void) | null>(null);
  const registerRetryCloudSave = useCallback((fn: (() => void) | null) => {
    retryCloudSaveRef.current = fn;
  }, []);
  const handleRetryCloudSave = useCallback(() => {
    retryCloudSaveRef.current?.();
  }, []);

  /**
   * 클라우드 동기화 '충돌(동기화 보류)' 인디케이터(헤더)의 "다시 열기" 배선.
   *
   * 충돌 모달과 이연 상태는 MainLeftPanel(useCloudWorkspaceSync 배선처)이 소유하므로, retryCloudSave와
   * 똑같이 좌패널이 재개봉 함수를 ref에 등록만 하고, 헤더는 안정적인 래퍼로 그것을 호출한다(memo 유지).
   */
  const resumeConflictRef = useRef<(() => void) | null>(null);
  const registerResumeConflict = useCallback((fn: (() => void) | null) => {
    resumeConflictRef.current = fn;
  }, []);
  const handleResumeConflict = useCallback(() => {
    resumeConflictRef.current?.();
  }, []);

  const {
    closeHelp,
    closeTickerModal,
    deleteTicker,
    handleBackdropClick,
    openHelpExpectedTotalReturn,
    saveTicker,
  } = viewModel;

  return (
    <>
      <Global styles={globalStyle} />
      <SkipLink href="#main-content">본문으로 건너뛰기</SkipLink>
      <FeatureLayout>
        <MainContent id="main-content">
          <MobileMenuDrawer
            isOpen={isConfigDrawerOpen}
            onOpen={openConfigDrawer}
            onClose={closeConfigDrawer}
            notice={<ModelChangeNotice />}
            // 클라우드 저장 상태를 헤더 맨 좌측(타이틀 옆)에 둔다. 저장 중/실패만 노출(평상시 숨김), 실패는 무음 금지.
            headerStatus={
              isCommunityEnabled ? (
                <CloudSyncIndicator
                  variant="header"
                  onRetry={handleRetryCloudSave}
                  onResume={handleResumeConflict}
                />
              ) : null
            }
            headerAction={
              <>
                {/* 커뮤니티 진입점은 이제 헤더 브랜드 옆 전역 nav(PrimaryNav)의 갤러리·게시판 링크가 담당한다
                    (기존 CommunityNavLink '커뮤니티' 버튼은 nav 링크로 대체·제거). */}
                {/* AuthControl은 useNavigate + 세션에 의존한다 — 백엔드 없는 배포에선 렌더하지 않는다. */}
                {isCommunityEnabled ? <AuthControl /> : null}
                {/* 튜토리얼 보기 + 앱 설치 + 테마를 모은 아이콘 전용 "더보기(⋯)" 메뉴. 로그인/커뮤니티 여부와
                    무관하게 항상 노출된다 — 테마 접근점을 여기로 단일화했다(기존 standalone 테마 스위처 제거).
                    "테마는 어떤 상태에서도 사라지면 안 됨" 제약은 이 메뉴가 항상 있으므로 충족.
                    시뮬레이터에서만 "PDF 리포트 저장"이 하나 더 붙는다 — 그 상태·동작은 MainOverflowMenu가
                    소유하고(HeaderOverflowMenu는 커뮤니티와 공유라 시뮬레이터 데이터에 결합시키지 않는다),
                    구독은 불리언 2개로 좁혀져 있어 타건 리렌더가 헤더로 번지지 않는다. */}
                <MainOverflowMenu />
                {/* TourGuide는 코치마크 오버레이 전용으로 계속 마운트한다 — 헤더엔 아무것도 안 그리고,
                    실행 트리거는 HeaderOverflowMenu가 소유한다(tourLaunchRequestAtom bump). */}
                <TourGuide />
              </>
            }
            left={
              <MainLeftPanel
                onHydratedChange={setIsPortfolioHydrated}
                onRegisterRetryCloudSave={registerRetryCloudSave}
                onRegisterResumeConflict={registerResumeConflict}
              />
            }
            right={
              isPortfolioHydrated ? (
                <MainRightPanel />
              ) : (
                <MainContentLoader label="결과를 불러오는 중…" minHeight="480px" />
              )
            }
          />

          <Suspense fallback={null}>
            {isTickerModalOpen && (
              <TickerModal
                onBackdropClick={handleBackdropClick}
                onDelete={deleteTicker}
                onClose={closeTickerModal}
                onHelpExpectedTotalReturn={openHelpExpectedTotalReturn}
                onSave={saveTicker}
              />
            )}

            <HelpModal onBackdropClick={handleBackdropClick} onClose={closeHelp} />
          </Suspense>
        </MainContent>

        {/* `<main>` 밖에 둔다 — `<footer>`는 main/section/article의 자손이면 contentinfo 랜드마크가 되지 않는다. */}
        <MarketDataAsOf />
      </FeatureLayout>
    </>
  );
}

const MainView = memo(MainViewComponent);

export default MainView;
