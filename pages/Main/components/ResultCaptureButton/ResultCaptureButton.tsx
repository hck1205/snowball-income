import { memo } from 'react';
import { Camera, X } from 'lucide-react';
import { Button } from '@/components/common';
import type { ResultCaptureButtonProps } from './ResultCaptureButton.types';
import { CaptureFailureDismiss, CaptureFailureNote, CaptureSlot } from './ResultCaptureButton.styled';

/** 라벨은 상태를 그대로 말한다 — 스피너만으로는 "무엇이 진행 중인지" 알 수 없다. */
const LABEL = '이미지 저장';
const LABEL_BUSY = '저장 중…';
const ACCESSIBLE_NAME = '결과를 이미지로 저장';
const DISMISS_LABEL = '저장 실패 안내 닫기';

/**
 * 결과 컨트롤 줄의 **이미지 저장** 버튼 — "간략히" 토글 바로 왼쪽에 선다.
 *
 * 지금 보이는 결과 카드들을 한 장의 PNG로 내려받는다(시나리오 탭 바는 캡처 대상 밖이라 자연히 빠진다).
 * 이 부품은 **상태를 갖지 않는다** — 진행/실패는 `useResultCapture` 가 쥐고 props 로 내려온다.
 */
function ResultCaptureButtonComponent({
  isCapturing,
  failure,
  onCapture,
  onDismissFailure
}: ResultCaptureButtonProps) {
  return (
    <CaptureSlot>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        loading={isCapturing}
        aria-label={ACCESSIBLE_NAME}
        startIcon={<Camera size={16} strokeWidth={1.8} aria-hidden focusable={false} />}
        onClick={onCapture}
      >
        {isCapturing ? LABEL_BUSY : LABEL}
      </Button>
      {/* 무음 실패 금지 — 사유를 그 자리에서 말한다. 읽고 나면 닫을 수 있어야 한다(안 그러면
          다음 시도까지 결과 위에 계속 떠 있다). */}
      {failure ? (
        <CaptureFailureNote role="alert">
          <span>{failure.message}</span>
          <CaptureFailureDismiss type="button" aria-label={DISMISS_LABEL} onClick={onDismissFailure}>
            <X size={14} strokeWidth={1.8} aria-hidden focusable={false} />
          </CaptureFailureDismiss>
        </CaptureFailureNote>
      ) : null}
    </CaptureSlot>
  );
}

const ResultCaptureButton = memo(ResultCaptureButtonComponent);

export default ResultCaptureButton;
