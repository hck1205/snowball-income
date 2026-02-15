import { Global } from "@emotion/react";
import { lazy, Suspense } from "react";
import { FeatureLayout } from "@/pages/Main/Main.shared.styled";
import MobileMenuDrawer from "@/components/MobileMenuDrawer";
import { useIsConfigDrawerOpenAtomValue, useSetIsConfigDrawerOpenWrite } from "@/jotai";
import { MainLeftPanel, MainRightPanel } from "./components";
import { globalStyle } from "./Main.styled";
import type { MainViewProps } from "./Main.types";

const HelpModal = lazy(() => import("./components/HelpModal"));
const TickerModal = lazy(() => import("./components/TickerModal"));

export default function MainView({ viewModel }: MainViewProps) {
  const isConfigDrawerOpen = useIsConfigDrawerOpenAtomValue();
  const setIsConfigDrawerOpen = useSetIsConfigDrawerOpenWrite();

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
      <FeatureLayout>
        <MobileMenuDrawer
          isOpen={isConfigDrawerOpen}
          onOpen={() => setIsConfigDrawerOpen(true)}
          onClose={() => setIsConfigDrawerOpen(false)}
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
      </FeatureLayout>
    </>
  );
}
