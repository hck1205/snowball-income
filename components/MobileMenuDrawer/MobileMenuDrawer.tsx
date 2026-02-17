import { memo, useEffect, useId, useRef, useState } from 'react';
import type { MobileMenuDrawerProps } from './MobileMenuDrawer.types';
import {
  ConfigDrawerColumn,
  ContentLayout,
  DrawerBackdrop,
  DrawerCloseButton,
  DrawerToggleButton,
  Header,
  HeaderDescription,
  HeaderTitle
} from '@/pages/Main/Main.shared.styled';

function MobileMenuDrawerComponent({ isOpen, onOpen, onClose, left, right }: MobileMenuDrawerProps) {
  const drawerId = useId();
  const toggleAnchorRef = useRef<HTMLDivElement | null>(null);
  const [isFloating, setIsFloating] = useState(false);

  useEffect(() => {
    if (!isOpen || window.matchMedia('(min-width: 961px)').matches) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    const anchor = toggleAnchorRef.current;
    if (!anchor) return undefined;

    const mediaQuery = window.matchMedia('(max-width: 960px)');
    const updateDesktopState = () => {
      if (!mediaQuery.matches) setIsFloating(false);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!mediaQuery.matches) {
          setIsFloating(false);
          return;
        }
        setIsFloating(!entry.isIntersecting);
      },
      { threshold: 1 }
    );

    observer.observe(anchor);
    mediaQuery.addEventListener('change', updateDesktopState);

    return () => {
      observer.disconnect();
      mediaQuery.removeEventListener('change', updateDesktopState);
    };
  }, []);

  return (
    <>
      <Header>
        <HeaderTitle>Snowball Income</HeaderTitle>
        <HeaderDescription>장기 배당 투자 전략을 설계하고 시뮬레이션 결과를 비교하세요.</HeaderDescription>
        <div ref={toggleAnchorRef} aria-hidden />
        <DrawerToggleButton
          type="button"
          data-floating={isFloating ? 'true' : 'false'}
          aria-label="설정 열기"
          aria-expanded={isOpen}
          aria-controls={drawerId}
          onClick={onOpen}
        >
          설정 열기
        </DrawerToggleButton>
      </Header>

      <DrawerBackdrop open={isOpen} onClick={onClose} />

      <ContentLayout>
        <ConfigDrawerColumn id={drawerId} open={isOpen} aria-label="투자 설정 패널">
          <DrawerCloseButton type="button" aria-label="설정 닫기" onClick={onClose}>
            ×
          </DrawerCloseButton>
          {left}
        </ConfigDrawerColumn>
        {right}
      </ContentLayout>
    </>
  );
}

const MobileMenuDrawer = memo(MobileMenuDrawerComponent);

export default MobileMenuDrawer;
