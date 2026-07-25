export type LoginNudgeModalProps = {
  /** 포털 대상 (document.body) — 부모가 SSR 가드 후 넘긴다. */
  modalRoot: HTMLElement;
  onClose: () => void;
  /** [로그인] — 프롬프트를 닫고 기존 로그인 모달(소셜 로그인 선택)로 잇는다. */
  onLogin: () => void;
};
