import { useId } from 'react';
import type { ModalProps } from './Modal.types';
import { ModalActions, ModalBackdrop, ModalPanel, ModalTitle } from './Modal.styled';

/**
 * 모달 껍데기(백드롭 + 패널 + 제목 + 액션).
 *
 * 포털/ESC/포커스 관리는 **호출부가 소유한다**. 이 컴포넌트로 끌어올리지 않은 이유:
 * 기존 모달들이 각자 다른 라이프사이클(jotai atom으로 열림 상태, lazy import, 분석 이벤트)을
 * 갖고 있어서, 여기서 통합하면 그 동작들을 전부 바꿔야 한다 — 이번 작업은 스킨이지 리팩터가 아니다.
 *
 * `aria-labelledby`로 제목과 다이얼로그를 묶는다 → 스크린리더가 다이얼로그 이름을 제목으로 읽는다.
 */
export default function Modal({ title, children, actions, onBackdropClick }: ModalProps) {
  const titleId = useId();

  return (
    <ModalBackdrop role="dialog" aria-modal="true" aria-labelledby={titleId} onClick={onBackdropClick}>
      <ModalPanel>
        <ModalTitle id={titleId}>{title}</ModalTitle>
        {children}
        {actions ? <ModalActions>{actions}</ModalActions> : null}
      </ModalPanel>
    </ModalBackdrop>
  );
}
