export type SettingsDrawerProps = {
  /** 드로어 패널 id — 여는 버튼들의 `aria-controls` 와 짝. */
  drawerId: string;
  isOpen: boolean;
  onClose: () => void;
  /** 하이드레이션 완료 신호(우패널 게이트용). 좌패널이 트리거를 소유한다. */
  onHydratedChange: (isHydrated: boolean) => void;
  onRegisterRetryCloudSave: (fn: (() => void) | null) => void;
  onRegisterResumeConflict: (fn: (() => void) | null) => void;
};
