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

  return (
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
  );
}
