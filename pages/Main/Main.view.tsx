import { Global } from "@emotion/react";
import { lazy, memo, Suspense, useCallback } from "react";
import { FeatureLayout, MainContent, SkipLink } from "@/pages/Main/Main.shared.styled";
import MobileMenuDrawer from "@/components/MobileMenuDrawer";
import TourGuide from "@/components/TourGuide";
import {
  useIsConfigDrawerOpenAtomValue,
  useIsTickerModalOpenAtomValue,
  useSetIsConfigDrawerOpenWrite,
} from "@/jotai";
import HelpModal from "./components/HelpModal";
import { MainLeftPanel, MainRightPanel, MarketDataAsOf, ModelChangeNotice } from "./components";
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
            headerAction={<TourGuide />}
            left={<MainLeftPanel />}
            right={<MainRightPanel />}
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
