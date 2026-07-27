import { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';
import { useDrawerBackClose } from '@/shared/hooks';
import type { HoldingPickerDrawerProps } from './HoldingPickerDrawer.types';
import {
  DrawerBackdrop,
  DrawerBody,
  DrawerCloseButton,
  DrawerHead,
  DrawerPanel,
  DrawerTitle
} from './HoldingPickerDrawer.styled';

/**
 * 종목 추가 드로어 — 배당 캘린더 `PickerDrawer` 의 페이지 로컬 **복제**(import 금지: 페이지 간 결합·
 * 청크 혼입 방지). 원본이 세운 계약을 그대로 유지한다:
 *
 * - 패널은 **항상 마운트**되고 열림은 CSS 가 정한다 — 언마운트하면 검색어·스크롤이 매번 날아간다.
 * - `useDrawerBackClose` 는 **폭과 무관하게 항상** 켠다(이 드로어는 모든 폭에서 오버레이다). URL 은 안 바뀐다.
 * - Escape 는 **이미 처리된 이벤트를 가로채지 않는다**(`defaultPrevented` 확인) — 안쪽 검색 입력의
 *   "Escape = 검색어만 지우기"가 먼저고, 지울 게 없을 때만 드로어가 닫힌다.
 * - 열릴 때 닫기 버튼으로 포커스, 닫힐 때 **열었던 요소로 복귀**.
 */
export default function HoldingPickerDrawer({
  id,
  isOpen,
  title,
  closeLabel,
  onClose,
  children
}: HoldingPickerDrawerProps) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  // 뒤로가기 = 드로어 닫기(페이지 이탈 아님). URL은 그대로다.
  useDrawerBackClose(isOpen, onClose);

  useEffect(() => {
    if (!isOpen) return undefined;

    restoreRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeRef.current?.focus();

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      onClose();
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);

      // 닫힌 뒤 포커스가 body 로 떨어지면 키보드 사용자는 위치를 잃는다 — 열었던 버튼으로 돌린다.
      const restore = restoreRef.current;
      if (restore && restore.isConnected) restore.focus();
    };
  }, [isOpen, onClose]);

  return (
    <>
      <DrawerBackdrop $open={isOpen} aria-hidden onClick={onClose} />
      <DrawerPanel id={id} $open={isOpen} aria-labelledby={titleId}>
        <DrawerHead>
          <DrawerTitle id={titleId}>{title}</DrawerTitle>
          <DrawerCloseButton type="button" ref={closeRef} aria-label={closeLabel} onClick={onClose}>
            <X size={16} strokeWidth={1.8} aria-hidden focusable={false} />
          </DrawerCloseButton>
        </DrawerHead>
        <DrawerBody>{children}</DrawerBody>
      </DrawerPanel>
    </>
  );
}
