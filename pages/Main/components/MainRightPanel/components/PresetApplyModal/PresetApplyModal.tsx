import { createPortal } from 'react-dom';
import { Button } from '@/components';
import { ModalActions, ModalBackdrop, ModalBody, ModalPanel, ModalTitle } from '@/components/common';
import type { PresetApplyModalProps } from './PresetApplyModal.types';

/**
 * 프리셋 적용 확인 모달 — 모바일에서 스크롤 중 실수 탭으로 프리셋이 즉시 적용되는 걸 막는다.
 * MainRightPanel 본체에서 뷰 조각만 분리했다 — 적용 로직(applyPortfolioPreset)은 부모에 있다.
 */
function PresetApplyModal({ modalRoot, presetTitle, onCancel, onConfirm }: PresetApplyModalProps) {
  return createPortal(
    <ModalBackdrop
      role="dialog"
      aria-modal="true"
      aria-label="프리셋 적용 확인"
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        onCancel();
      }}
    >
      <ModalPanel>
        <ModalTitle>프리셋 적용</ModalTitle>
        <ModalBody>“{presetTitle}” 프리셋으로 포트폴리오를 구성하시겠습니까?</ModalBody>
        <ModalActions>
          <Button variant="secondary" type="button" onClick={onCancel}>
            취소
          </Button>
          <Button variant="primary" type="button" onClick={onConfirm}>
            적용
          </Button>
        </ModalActions>
      </ModalPanel>
    </ModalBackdrop>,
    modalRoot
  );
}

export default PresetApplyModal;
