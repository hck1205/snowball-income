/**
 * 결과 이미지 캡처의 **실패 사유 어휘** — 파이프라인과 UI가 공유하는 최소 계약.
 *
 * `pdfReportError.ts`와 같은 이유로 별도 모듈이다: UI가 `instanceof`로 사유를 읽으려고
 * `resultCapturePipeline`(html2canvas)을 정적으로 import하면 **그 무거운 청크가 초기 번들로 딸려 온다**.
 */

export type ResultCaptureFailureReason =
  /** 캡처할 결과 영역을 찾지 못했다(결과가 아직 없거나 마커가 사라졌다). 다시 눌러도 같다. */
  | 'target-missing'
  /** 그리기/이미지 변환 단계에서 실패. 일시적일 수 있어 재시도가 의미 있다. */
  | 'render-failed'
  /** 예상 못 한 예외(모듈 로드 실패, 다운로드 거부 등). 재시도가 의미 있다. */
  | 'unknown';

export class ResultCaptureError extends Error {
  constructor(public readonly reason: Exclude<ResultCaptureFailureReason, 'unknown'>) {
    super(reason);
    this.name = 'ResultCaptureError';
  }
}

/** 알 수 없는 예외도 사유 하나로 접는다 — UI가 분기를 빠뜨릴 수 없게. */
export const toResultCaptureFailureReason = (error: unknown): ResultCaptureFailureReason =>
  error instanceof ResultCaptureError ? error.reason : 'unknown';

/** 사용자에게 보이는 실패 안내. 조용히 실패하지 않는다. */
export type ResultCaptureFailure = {
  message: string;
  canRetry: boolean;
};

const FAILURE_COPY: Record<ResultCaptureFailureReason, ResultCaptureFailure> = {
  'target-missing': {
    message: '저장할 결과가 아직 없습니다. 투자 조건을 입력하면 결과를 이미지로 저장할 수 있습니다.',
    canRetry: false
  },
  'render-failed': {
    message: '이미지를 만들지 못했습니다. 잠시 후 다시 시도해 주세요.',
    canRetry: true
  },
  unknown: {
    message: '이미지를 만들지 못했습니다. 잠시 후 다시 시도해 주세요.',
    canRetry: true
  }
};

export const toResultCaptureFailure = (reason: ResultCaptureFailureReason): ResultCaptureFailure =>
  FAILURE_COPY[reason];
