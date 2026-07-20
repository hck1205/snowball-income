/**
 * PDF 리포트 **실패 사유 어휘** — 파이프라인과 UI가 공유하는 최소 계약.
 *
 * 왜 별도 모듈인가: `PdfReportError`가 `pdfReportPipeline.ts`(jspdf·html2canvas·echarts)에 살면
 * UI가 `instanceof`로 사유를 읽는 순간 **그 무거운 청크가 초기 번들로 딸려 온다**. 사유 어휘만
 * 의존성 0짜리 모듈로 떼어 두면 UI는 정적으로, 파이프라인은 동적으로 같은 클래스를 가리킨다.
 */

/** 재시도해도 결과가 같은 실패인가, 잠깐의 문제인가 — 이 구분이 안내 문구를 가른다. */
export type PdfReportFailureReason =
  /** payload로 리포트를 계산할 수 없다. 몇 번을 눌러도 같으므로 **입력을 고쳐야** 한다. */
  | 'report-unavailable'
  /** 문서 렌더/캡처 단계에서 실패. 일시적일 수 있으므로 재시도가 의미 있다. */
  | 'render-failed'
  /** 예상 못 한 예외(모듈 로드 실패, 저장 거부 등). 재시도가 의미 있다. */
  | 'unknown';

export class PdfReportError extends Error {
  constructor(public readonly reason: Exclude<PdfReportFailureReason, 'unknown'>) {
    super(reason);
    this.name = 'PdfReportError';
  }
}

/** 알 수 없는 예외도 사유 하나로 접는다 — UI가 분기를 빠뜨릴 수 없게. */
export const toPdfReportFailureReason = (error: unknown): PdfReportFailureReason =>
  error instanceof PdfReportError ? error.reason : 'unknown';

/** 사용자에게 보이는 실패 안내. `canRetry=false`면 재시도 버튼 자체를 감춘다(눌러도 소용없다). */
export type PdfReportFailure = {
  message: string;
  canRetry: boolean;
};

const FAILURE_COPY: Record<PdfReportFailureReason, PdfReportFailure> = {
  'report-unavailable': {
    message: '이 시나리오로는 리포트를 만들 수 없어요. 포트폴리오와 투자 조건을 확인해 주세요.',
    canRetry: false
  },
  'render-failed': {
    message: '리포트를 만들지 못했어요. 잠시 후 다시 시도해 주세요.',
    canRetry: true
  },
  unknown: {
    message: '리포트를 만들지 못했어요. 잠시 후 다시 시도해 주세요.',
    canRetry: true
  }
};

export const toPdfReportFailure = (reason: PdfReportFailureReason): PdfReportFailure => FAILURE_COPY[reason];
