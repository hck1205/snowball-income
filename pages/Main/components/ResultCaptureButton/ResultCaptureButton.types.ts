import type { ResultCaptureFailure } from '@/pages/Main/hooks/interaction';

export type ResultCaptureButtonProps = {
  /** 캡처 중 — 버튼을 비활성화하고 라벨로 진행을 알린다. */
  isCapturing: boolean;
  /** 직전 실패 안내(없으면 null). 있으면 버튼 아래 `role="alert"` 로 붙는다. */
  failure: ResultCaptureFailure | null;
  onCapture: () => void;
};
