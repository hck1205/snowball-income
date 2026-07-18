import { memo, useEffect, useId, useRef, useState } from 'react';
import { TOUR_TARGET } from '@/shared/constants';
import type { MobileMenuDrawerProps } from './MobileMenuDrawer.types';
import {
  ConfigDrawerColumn,
  ContentLayout,
  DrawerBackdrop,
  DrawerCloseButton,
  DrawerToggleButton,
  Header,
  HeaderActions,
  HeaderBrand,
  HeaderDescription,
  HeaderLogo,
  HeaderLogoImage,
  HeaderTitle
} from '@/pages/Main/Main.shared.styled';

function MobileMenuDrawerComponent({
  isOpen,
  onOpen,
  onClose,
  left,
  right,
  notice,
  headerAction,
  headerStatus
}: MobileMenuDrawerProps) {
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
        <HeaderBrand>
          <HeaderLogo>
            <HeaderLogoImage src="/app_icon.png" alt="" width={40} height={40} />
          </HeaderLogo>
          <HeaderTitle>Snowball Income</HeaderTitle>
          {/* 헤더 맨 좌측(타이틀 옆) 상태 슬롯 — 클라우드 저장 상태(저장 중/실패)가 여기 붙는다. */}
          {headerStatus}
          {headerAction ? <HeaderActions>{headerAction}</HeaderActions> : null}
        </HeaderBrand>
        <HeaderDescription>장기 배당 투자 전략을 설계하고 시뮬레이션 결과를 비교하세요.</HeaderDescription>
        <div ref={toggleAnchorRef} aria-hidden />
        <DrawerToggleButton
          type="button"
          data-tour={TOUR_TARGET.openSettings}
          data-capture-role="drawer-toggle-open"
          data-floating={isFloating ? 'true' : 'false'}
          aria-label="설정 열기"
          aria-expanded={isOpen}
          aria-controls={drawerId}
          onClick={onOpen}
        >
          설정 열기
        </DrawerToggleButton>
      </Header>

      {notice}

      <DrawerBackdrop data-capture-role="drawer-backdrop" open={isOpen} onClick={onClose} />

      <ContentLayout data-capture-role="content-layout">
        <ConfigDrawerColumn data-capture-role="drawer-panel" id={drawerId} open={isOpen} aria-label="투자 설정 패널">
          <DrawerCloseButton data-capture-role="drawer-toggle-close" type="button" aria-label="설정 닫기" onClick={onClose}>
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
