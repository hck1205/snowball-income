import { useEffect, useRef } from 'react';
import type { MouseEvent } from 'react';
import { createPortal } from 'react-dom';
import { Modal } from '@/components/common';
import type { CommunityModalProps } from './CommunityModal.types';

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * 커뮤니티 모달 셸 — 공용 `Modal` 프리미티브(스킨)에 포털 + Esc + 포커스 트랩 + 포커스 복귀를 얹는다.
 * 로그인/삭제 확인/이탈 확인 등이 이걸 공유한다.
 */
export default function CommunityModal({
  title,
  children,
  actions,
  onClose,
  align = 'start',
  initialFocusRef
}: CommunityModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  // 렌더 시점에 .current 를 읽으면 첫 렌더에선 아직 null 이다(자식 버튼이 커밋 전).
  // 마운트 이후(effect)에 읽어야 커밋된 요소를 잡으므로 ref 객체 자체를 최신으로 들고 있는다.
  const initialFocusRefHolder = useRef(initialFocusRef);
  initialFocusRefHolder.current = initialFocusRef;

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;

    const container = containerRef.current;
    const focusables = container ? Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)) : [];
    // initialFocusRef 를 주면 그 요소로(예: 취소 버튼), 아니면 현행대로 첫 포커서블로 포커스한다.
    (initialFocusRefHolder.current?.current ?? focusables[0] ?? container)?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab' || !containerRef.current) return;

      const items = Array.from(containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      previouslyFocused?.focus?.();
    };
  }, []);

  const handleBackdropClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) onClose();
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div ref={containerRef} style={align === 'center' ? { textAlign: 'center' } : undefined}>
      <Modal title={title} actions={actions} onBackdropClick={handleBackdropClick}>
        {children}
      </Modal>
    </div>,
    document.body
  );
}
