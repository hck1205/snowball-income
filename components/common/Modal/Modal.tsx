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
 *
 * 🔴 **퇴장 중인 껍데기는 다이얼로그가 아니다.** `phase === 'exit'` 이면 `role`/`aria-modal`/
 * `aria-labelledby` 를 떼고 `aria-hidden` 을 건다 — 남은 시간은 순수한 장식이고, 보조기기가
 * "닫았는데 아직 열려 있는 대화상자"를 읽으면 안 된다(그 사이 다음 오버레이가 열리면 다이얼로그가
 * 둘로 보인다). 이 처리는 원래 `HelpModal` 이 자기 백드롭에 손으로 갖고 있었는데, 셸이 `phase` 를
 * 받으면서 **셸을 쓰는 다음 사람은 그 처리를 물려받지 못하는** 구멍이 생겼다(2026-07-31 리뷰 m2).
 * 백드롭 클릭도 함께 끈다 — 이미 닫힌 것을 다시 닫을 수는 없다.
 */
export default function Modal({ title, children, actions, onBackdropClick, phase,
  size}: ModalProps) {
  const titleId = useId();
  const isExiting = phase === 'exit';

  return (
    <ModalBackdrop
      role={isExiting ? undefined : 'dialog'}
      aria-modal={isExiting ? undefined : 'true'}
      aria-labelledby={isExiting ? undefined : titleId}
      aria-hidden={isExiting ? 'true' : undefined}
      onClick={isExiting ? undefined : onBackdropClick}
      $phase={phase}
    >
      <ModalPanel
      $size={size} $phase={phase}>
        <ModalTitle id={titleId}>{title}</ModalTitle>
        {children}
        {actions ? <ModalActions>{actions}</ModalActions> : null}
      </ModalPanel>
    </ModalBackdrop>
  );
}
