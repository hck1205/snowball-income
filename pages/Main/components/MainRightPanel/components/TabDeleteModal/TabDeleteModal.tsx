import { createPortal } from 'react-dom';
import { Button } from '@/components';
import { ModalActions, ModalBackdrop, ModalBody, ModalPanel, ModalTitle } from '@/components/common';
import type { TabDeleteModalProps } from './TabDeleteModal.types';

/**
 * 시나리오 탭 삭제 확인 모달.
 * MainRightPanel 본체에서 뷰 조각만 분리했다 — 삭제 대상(deleteTargetTabId)·실행은 부모에 있다.
 */
function TabDeleteModal({ modalRoot, onCancel, onConfirm }: TabDeleteModalProps) {
  return createPortal(
    <ModalBackdrop
      role="dialog"
      aria-modal="true"
      aria-label="탭 삭제 확인"
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        onCancel();
      }}
    >
      <ModalPanel>
        <ModalTitle>탭 삭제</ModalTitle>
        <ModalBody>정말 삭제하시겠습니까?</ModalBody>
        <ModalActions>
          {/* onMouseDown preventDefault: 탭 이름변경 입력(onBlur=commitRenameMode)이 아직 포커스를
              쥔 채로 이 버튼을 누르면 blur가 rename을 커밋한다. 공유 탭('shared-tab')은 rename 커밋 시
              새 id로 승격되어(useScenarioTabs.renameScenarioTab) deleteTargetTabId가 옛 id로 어긋난다.
              X 닫기 버튼과 같은 방식으로 포커스 이동을 막아 blur 커밋을 차단한다. */}
          <Button
            variant="secondary"
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={onCancel}
          >
            취소
          </Button>
          <Button
            variant="primary"
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={onConfirm}
          >
            삭제
          </Button>
        </ModalActions>
      </ModalPanel>
    </ModalBackdrop>,
    modalRoot
  );
}

export default TabDeleteModal;
