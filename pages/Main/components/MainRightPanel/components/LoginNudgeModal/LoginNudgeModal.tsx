import { createPortal } from 'react-dom';
import { Button } from '@/components';
import { ModalActions, ModalBackdrop, ModalBody, ModalPanel, ModalTitle } from '@/components/common';
import type { LoginNudgeModalProps } from './LoginNudgeModal.types';

/**
 * 비로그인 2번째 탭 생성 시도 시 뜨는 로그인 유도 프롬프트. 커뮤니티 비활성 배포에선 게이트가 없어 안 뜬다.
 * MainRightPanel 본체에서 뷰 조각만 분리했다 — 게이트 판정(createScenarioTab)·로그인 연결은 부모에 있다.
 */
function LoginNudgeModal({ modalRoot, onClose, onLogin }: LoginNudgeModalProps) {
  return createPortal(
    <ModalBackdrop
      role="dialog"
      aria-modal="true"
      aria-label="로그인 유도"
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        onClose();
      }}
    >
      <ModalPanel>
        <ModalTitle>탭을 더 만들려면 로그인하세요</ModalTitle>
        <ModalBody>
          로그인하면 <strong>클라우드에 저장돼 데이터가 사라지지 않습니다.</strong>
          {'\n'}지금(로그인 전) 만든 탭도 로그인하면 <strong>그대로 함께 동기화</strong>됩니다.
        </ModalBody>
        <ModalActions>
          <Button variant="secondary" type="button" onClick={onClose}>
            나중에
          </Button>
          <Button variant="primary" type="button" onClick={onLogin}>
            로그인
          </Button>
        </ModalActions>
      </ModalPanel>
    </ModalBackdrop>,
    modalRoot
  );
}

export default LoginNudgeModal;
