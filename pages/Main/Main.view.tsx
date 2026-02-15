import { Global } from "@emotion/react";
import { lazy, memo, Suspense, useCallback } from "react";
import { FeatureLayout, MainContent, SkipLink } from "@/pages/Main/Main.shared.styled";
import MobileMenuDrawer from "@/components/MobileMenuDrawer";
import { useIsConfigDrawerOpenAtomValue, useSetIsConfigDrawerOpenWrite } from "@/jotai";
import HelpModalComponent from "./components/HelpModal";
import TickerModalComponent from "./components/TickerModal";
import { MainLeftPanel, MainRightPanel } from "./components";
import { globalStyle } from "./Main.styled";
import type { MainViewProps } from "./Main.types";

const HelpModal = import.meta.env.MODE === "test" ? HelpModalComponent : lazy(() => import("./components/HelpModal"));
const TickerModal = import.meta.env.MODE === "test" ? TickerModalComponent : lazy(() => import("./components/TickerModal"));

function MainViewComponent({ viewModel }: MainViewProps) {
  const isConfigDrawerOpen = useIsConfigDrawerOpenAtomValue();
  const setIsConfigDrawerOpen = useSetIsConfigDrawerOpenWrite();
  const openConfigDrawer = useCallback(() => setIsConfigDrawerOpen(true), [setIsConfigDrawerOpen]);
  const closeConfigDrawer = useCallback(() => setIsConfigDrawerOpen(false), [setIsConfigDrawerOpen]);

  const {
    closeHelp,
    closeTickerModal,
    deleteTicker,
    handleBackdropClick,
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
            left={<MainLeftPanel />}
            right={<MainRightPanel />}
          />

          <Suspense fallback={null}>
            <TickerModal
              onBackdropClick={handleBackdropClick}
              onDelete={deleteTicker}
              onClose={closeTickerModal}
              onSave={saveTicker}
            />

            <HelpModal onBackdropClick={handleBackdropClick} onClose={closeHelp} />
          </Suspense>
        </MainContent>
      </FeatureLayout>
    </>
  );
}

const MainView = memo(MainViewComponent);

export default MainView;
