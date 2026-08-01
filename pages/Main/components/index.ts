/**
 * HelpModal / TickerModal은 의도적으로 여기서 re-export하지 않는다.
 *
 * 둘은 Main.view.tsx에서 `lazy(() => import('./components/HelpModal'))`로 지연 로딩된다.
 * 이 배럴이 두 모듈을 정적으로 re-export하면, 배럴을 import하는 것만으로 정적 의존성 간선이 생기고
 * 롤업은 "정적·동적으로 동시에 import된 모듈"을 부모 청크에 그대로 넣어버린다 → lazy()가 무력화된다.
 * TickerModal이 끌고 오는 상장 티커 JSON 1.22MB가 그렇게 엔트리 청크에 박혀 있었다.
 *
 * 두 모달은 각자의 폴더 경로로 직접 import한다(`./components/TickerModal`) — 폴더 단위 import 규칙은 그대로 지킨다.
 */
export * from './ChartPanel';
/* 구 `LandingDisclaimer` 는 공용 `components/common/PageFooter` 로 수렴했다(2026-07-31, 문구 동일). */
export { default as MainContentLoader } from './MainContentLoader';
export { default as MainLeftPanel } from './MainLeftPanel';
export { default as MainOverflowMenu } from './MainOverflowMenu';
export { default as MainResultGrid } from './MainResultGrid';
export { default as MainRightPanel } from './MainRightPanel';
export { default as MarketDataAsOf } from './MarketDataAsOf';
export { default as ModelChangeNotice } from './ModelChangeNotice';
export { default as ResultCaptureButton } from './ResultCaptureButton';
export type { ResultCaptureButtonProps } from './ResultCaptureButton';
export { default as ScenarioTabsRow } from './ScenarioTabsRow';
export { default as SettingsDrawer } from './SettingsDrawer';
export { default as SettingsEntryButton } from './SettingsEntryButton';
export { default as SimulatorHero } from './SimulatorHero';
