import { memo, useEffect, useId, useRef, useState } from 'react';
import { TOUR_TARGET } from '@/shared/constants';
import { PrimaryNav } from '@/components/PrimaryNav';
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
  HeaderControlsRow,
  HeaderDescription,
  HeaderStatusSlot
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
          {/* 전역 nav — 로고+앱이름(홈 링크) + 라우트 링크(시뮬레이터·갤러리·게시판).
              brandAs="h1"로 워드마크가 이 페이지의 랜드마크 제목("Snowball Income")을 겸한다. */}
          <PrimaryNav brandAs="h1" />
          {/* 2줄 — 좌: 클라우드 저장 상태 / 우: 로그인·커뮤니티·더보기·테마.
              PrimaryNav와 같은 3컬럼 그리드(1fr auto 1fr)라 두 줄의 **좌우 끝선**이 맞는다.
              시뮬레이터는 2열(가운데)에 놓을 것이 없어 비어 있다 — 가운데 정렬 보장은 커뮤니티
              헤더(검색)에만 해당한다. 상태 슬롯은 내용이 없어도 렌더해 1열 자리를 지킨다. */}
          <HeaderControlsRow>
            <HeaderStatusSlot>{headerStatus}</HeaderStatusSlot>
            {headerAction ? <HeaderActions>{headerAction}</HeaderActions> : null}
          </HeaderControlsRow>
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
