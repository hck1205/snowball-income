export type SimulatorHeroProps = {
  /** 설정 드로어 패널의 id — 히어로 액션 버튼이 `aria-controls` 로 맺는다. */
  drawerId: string;
  isSettingsOpen: boolean;
  onOpenSettings: () => void;
};
