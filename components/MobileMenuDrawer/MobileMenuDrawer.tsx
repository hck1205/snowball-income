import { memo, useId } from 'react';
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

  return (
    <>
      <Header>
        <HeaderTitle>Snowball Income</HeaderTitle>
        <HeaderDescription>장기 배당 투자 전략을 설계하고 시뮬레이션 결과를 비교하세요.</HeaderDescription>
        <DrawerToggleButton
          type="button"
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
