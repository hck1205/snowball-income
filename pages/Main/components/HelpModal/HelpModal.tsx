import { useEffect, useId } from 'react';
import { createPortal } from 'react-dom';
import { ModalBackdrop, ModalBody, ModalClose, ModalPanel, ModalTitle } from '@/pages/Main/Main.shared.styled';
import { useCurrentHelpAtomValue } from '@/jotai';
import type { HelpModalProps } from './HelpModal.types';
import { ANALYTICS_EVENT, trackEvent } from '@/shared/lib/analytics';

const renderWithBoldTokens = (text: string, tokens: string[]) => {
  if (tokens.length === 0) return text;

  const escaped = tokens.map((token) => token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const pattern = new RegExp(`(${escaped.join('|')})`, 'g');
  const parts = text.split(pattern);

  return parts.map((part, index) =>
    tokens.includes(part) ? (
      <strong key={`${part}-${index}`}>{part}</strong>
    ) : (
      <span key={`${part}-${index}`}>{part}</span>
    )
  );
};

const renderPortfolioTabsHelpBody = (body: string) => {
  const lines = body
    .split('\n')
    .map((line) => line.replace(/^•\s*/, '').trim())
    .filter(Boolean);

  return (
    <ModalBody as="div">
      <ul style={{ margin: 0, paddingLeft: '18px', display: 'grid', gap: '4px' }}>
        {lines.map((line, index) => {
          const boldTokens = index === 0 ? ['10개'] : index === 1 ? ['이름 변경', '삭제'] : ['드래그', '순서'];

          if (index !== 0) return <li key={`${index}-${line}`}>{renderWithBoldTokens(line, boldTokens)}</li>;

          const normalizedLine = line.replace(/^\+\s*/, '');

          return (
            <li key={`${index}-${line}`}>
              <span aria-hidden="true" style={{ display: 'inline-flex', verticalAlign: 'middle', marginRight: '4px' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" focusable="false">
                  <path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </span>
              {renderWithBoldTokens(normalizedLine, boldTokens)}
            </li>
          );
        })}
      </ul>
    </ModalBody>
  );
};

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
        {help.title === '포트폴리오 탭' ? renderPortfolioTabsHelpBody(help.body) : <ModalBody>{help.body}</ModalBody>}
        <ModalClose type="button" onClick={onClose}>
          닫기
        </ModalClose>
      </ModalPanel>
    </ModalBackdrop>,
    modalRoot
  );
}
