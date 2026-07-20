import { memo, useEffect } from 'react';
import type { MobileMenuDrawerProps } from './MobileMenuDrawer.types';
import {
  ConfigDrawerColumn,
  ContentLayout,
  DrawerBackdrop,
  DrawerCloseButton,
  HeaderDescription
} from '@/pages/Main/Main.shared.styled';

function MobileMenuDrawerComponent({ drawerId, isOpen, onClose, left, right, notice }: MobileMenuDrawerProps) {
  useEffect(() => {
    if (!isOpen || window.matchMedia('(min-width: 961px)').matches) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  return (
    <>
      {/* 헤더(`SimulatorHeader`)에서 내려온 페이지 설명. 헤더가 sticky 전폭 바가 되면서
          모바일 뷰포트를 잠식하지 않도록 본문 흐름 최상단으로 옮겼다(커뮤니티 헤더에도 설명이 없다). */}
      <HeaderDescription>장기 배당 투자 전략을 설계하고 시뮬레이션 결과를 비교하세요.</HeaderDescription>

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
