import { ModalBackdrop, ModalBody, ModalClose, ModalPanel, ModalTitle } from '@/pages/Main/Main.shared.styled';
import { useCurrentHelpAtomValue } from '@/jotai';
import type { HelpModalProps } from './HelpModal.types';

export default function HelpModal({ onBackdropClick, onClose }: HelpModalProps) {
  const help = useCurrentHelpAtomValue();
  if (!help) return null;

  return (
    <ModalBackdrop role="dialog" aria-modal="true" aria-label={help.title} onClick={onBackdropClick}>
      <ModalPanel>
        <ModalTitle>{help.title}</ModalTitle>
        <ModalBody>{help.body}</ModalBody>
        <ModalClose type="button" onClick={onClose}>
          닫기
        </ModalClose>
      </ModalPanel>
    </ModalBackdrop>
  );
}
