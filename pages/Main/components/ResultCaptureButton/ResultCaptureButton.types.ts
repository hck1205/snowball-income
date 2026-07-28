import type { ResultCaptureFailure } from '@/pages/Main/hooks/interaction';

export type ResultCaptureButtonProps = {
  /** 캡처 중 — 버튼을 비활성화하고 라벨로 진행을 알린다. */
  isCapturing: boolean;
  /** 직전 실패 안내(없으면 null). 있으면 버튼 아래 `role="alert"` 로 붙는다. */
  failure: ResultCaptureFailure | null;
  onCapture: () => void;
  /** 실패 안내를 닫는다 — 읽고 나서 치울 수 없으면 다음 시도까지 화면에 남는다. */
  onDismissFailure: () => void;
};
