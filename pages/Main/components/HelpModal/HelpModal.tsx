import { useEffect, useId } from 'react';
import { ModalBackdrop, ModalBody, ModalClose, ModalPanel, ModalTitle } from '@/pages/Main/Main.shared.styled';
import { useCurrentHelpAtomValue } from '@/jotai';
import type { HelpModalProps } from './HelpModal.types';

export default function HelpModal({ onBackdropClick, onClose }: HelpModalProps) {
  const help = useCurrentHelpAtomValue();
  const titleId = useId();

  useEffect(() => {
    if (!help) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [help, onClose]);

  if (!help) return null;

  return (
    <ModalBackdrop role="dialog" aria-modal="true" aria-labelledby={titleId} onClick={onBackdropClick}>
      <ModalPanel>
        <ModalTitle id={titleId}>{help.title}</ModalTitle>
        <ModalBody>{help.body}</ModalBody>
        <ModalClose type="button" onClick={onClose}>
          닫기
        </ModalClose>
      </ModalPanel>
    </ModalBackdrop>
  );
}
