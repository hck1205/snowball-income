import { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';
import { useDrawerBackClose } from '@/shared/hooks';
import type { PickerDrawerProps } from './PickerDrawer.types';
import {
  DrawerBackdrop,
  DrawerBody,
  DrawerCloseButton,
  DrawerHead,
  DrawerPanel,
  DrawerTitle
} from './PickerDrawer.styled';

/**
 * 종목 선택 드로어.
 *
 * 패널은 **항상 마운트**돼 있고 열림 여부는 CSS(transform + visibility)가 정한다 — 언마운트하면
 * 검색어·스크롤 위치가 매번 초기화되고 슬라이드 전환도 못 준다. 대신 닫혀 있으면 `visibility: hidden`
 * 이라 탭 이동·스크린리더가 닿지 않는다(화면 밖으로 밀기만 하는 구현의 흔한 버그).
 *
 * Escape 는 **이미 처리된 이벤트를 가로채지 않는다**(`defaultPrevented` 확인) — 안쪽 검색 입력의
 * "Escape = 검색어만 지우기"가 먼저고, 지울 게 없을 때만 드로어가 닫힌다.
 *
 * 이 드로어는 폭과 무관하게 항상 오버레이라(`PickerDrawer.styled`에 미디어 분기가 없다)
 * 뒤로가기 닫기도 항상 켠다.
 */
export default function PickerDrawer({
  id,
  isOpen,
  title,
  closeLabel,
  onClose,
  children
}: PickerDrawerProps) {
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
