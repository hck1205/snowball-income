import { memo } from 'react';
import { createPortal } from 'react-dom';
import { ShareDialog } from '@/components/common';
import { ShareToast } from './ShareFlowLayer.styled';
import type { ShareFlowLayerProps } from './ShareFlowLayer.types';

/**
 * 공유 흐름의 **떠 있는 부분** — 공유 창(클립보드가 막혔을 때)과 복사 토스트(2026-11-09 분리).
 *
 * 설정 드로어 "도구" 카드에 있던 렌더를 그대로 옮겼다. 시뮬레이터 상단의 "결과 공유" 버튼도 같은 것을 그린다.
 * 둘 다 body 로 포털한다 — 버튼이 드로어·히어로 안에 있어 그 자리에 그리면 잘린다.
 */
function ShareFlowLayerComponent({ flow }: ShareFlowLayerProps) {
  const modalRoot = typeof document !== 'undefined' ? document.body : null;

  return (
    <>
      {flow.dialogUrl ? (
        <ShareDialog
          url={flow.dialogUrl}
          onCopy={flow.copyDialogUrl}
          onSelectChannel={flow.shareToChannel}
          onClose={flow.closeDialog}
        />
      ) : null}
      {flow.toastMessage && modalRoot
        ? createPortal(
            <ShareToast role="status" aria-live="polite">
              {flow.toastMessage}
            </ShareToast>,
            modalRoot
          )
        : null}
    </>
  );
}

const ShareFlowLayer = memo(ShareFlowLayerComponent);

export default ShareFlowLayer;
