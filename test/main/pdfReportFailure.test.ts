import { describe, expect, it } from 'vitest';
import {
  PdfReportError,
  toPdfReportFailure,
  toPdfReportFailureReason
} from '@/pages/Main/hooks/interaction/pdfReportError';

/**
 * PDF 리포트 **실패 사유 분기**.
 *
 * 이 레포의 규율은 "무음 실패 금지"가 아니라 **"실패는 이유와 함께 보여라"** 다.
 * 비활성 사유는 이미 두 갈래(종목을 담아라 / 입력을 고쳐라)로 나뉘어 있는데, 실패 경로만
 * 한 문구로 뭉개져 있었다. 특히 payload로 계산이 불가능한 실패에 "잠시 후 다시 시도해 주세요"는
 * **틀린 안내**다 — 몇 번을 눌러도 같은 결과다.
 */

describe('PDF 리포트 실패 사유 매핑', () => {
  it('PdfReportError는 자기 사유를 그대로 돌려준다', () => {
    expect(toPdfReportFailureReason(new PdfReportError('report-unavailable'))).toBe('report-unavailable');
    expect(toPdfReportFailureReason(new PdfReportError('render-failed'))).toBe('render-failed');
  });

  it('알 수 없는 예외도 사유 하나로 접힌다 (UI가 분기를 빠뜨릴 수 없게)', () => {
    expect(toPdfReportFailureReason(new Error('boom'))).toBe('unknown');
    expect(toPdfReportFailureReason('문자열 예외')).toBe('unknown');
    expect(toPdfReportFailureReason(undefined)).toBe('unknown');
  });

  it('계산 불가는 재시도를 권하지 않는다', () => {
    const failure = toPdfReportFailure('report-unavailable');

    expect(failure.canRetry).toBe(false);
    expect(failure.message).not.toContain('다시 시도');
    // 사용자가 무엇을 고쳐야 하는지 말해야 한다.
    expect(failure.message).toContain('포트폴리오와 투자 조건');
  });

  it('렌더 실패·미상 예외는 재시도를 권한다', () => {
    (['render-failed', 'unknown'] as const).forEach((reason) => {
      const failure = toPdfReportFailure(reason);

      expect(failure.canRetry).toBe(true);
      expect(failure.message).toContain('다시 시도');
    });
  });

  it('두 실패는 서로 다른 문구다 (하나로 뭉개지면 안내가 틀린다)', () => {
    expect(toPdfReportFailure('report-unavailable').message).not.toBe(toPdfReportFailure('render-failed').message);
  });
});
