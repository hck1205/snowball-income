export type PresetApplyModalProps = {
  /** 포털 대상 (document.body) — 부모가 SSR 가드 후 넘긴다. */
  modalRoot: HTMLElement;
  presetTitle: string;
  onCancel: () => void;
  onConfirm: () => void;
};
