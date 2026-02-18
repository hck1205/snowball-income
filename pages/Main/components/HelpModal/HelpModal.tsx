import { useEffect, useId } from 'react';
import { createPortal } from 'react-dom';
import { ModalBackdrop, ModalBody, ModalClose, ModalPanel, ModalTitle } from '@/pages/Main/Main.shared.styled';
import { useCurrentHelpAtomValue } from '@/jotai';
import type { HelpModalProps } from './HelpModal.types';
import { ANALYTICS_EVENT, trackEvent } from '@/shared/lib/analytics';

export default function HelpModal({ onBackdropClick, onClose }: HelpModalProps) {
  const help = useCurrentHelpAtomValue();
  const titleId = useId();
  const modalRoot = typeof document !== 'undefined' ? document.body : null;

  useEffect(() => {
    if (!help) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [help, onClose]);

  useEffect(() => {
    if (!help) return;
    trackEvent(ANALYTICS_EVENT.MODAL_VIEW, {
      modal_type: 'help_modal',
      help_title: help.title
    });
  }, [help]);

  if (!help) return null;
  if (!modalRoot) return null;

  return createPortal(
    <ModalBackdrop role="dialog" aria-modal="true" aria-labelledby={titleId} onClick={onBackdropClick}>
      <ModalPanel>
        <ModalTitle id={titleId}>{help.title}</ModalTitle>
        <ModalBody>{help.body}</ModalBody>
        <ModalClose type="button" onClick={onClose}>
          닫기
        </ModalClose>
      </ModalPanel>
    </ModalBackdrop>,
    modalRoot
  );
}
