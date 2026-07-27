import { memo, useEffect, useState } from 'react';
import type { MobileMenuDrawerProps } from './MobileMenuDrawer.types';
import {
  ConfigDrawerColumn,
  ContentLayout,
  DrawerBackdrop,
  DrawerCloseButton,
  HeaderDescription
} from '@/components/common';
import { useDrawerBackClose } from '@/shared/hooks';
import { BREAKPOINT } from '@/shared/styles';

/**
 * 이 패널이 **오버레이 드로어가 아닌** 폭(= 좌측 정적 컬럼). `ConfigDrawerColumn`의
 * `media.down('drawer')` 분기와 같은 경계를 토큰에서 가져와 CSS/JS가 어긋나지 않게 한다.
 */
const STATIC_COLUMN_QUERY = `(min-width: ${BREAKPOINT.drawer + 1}px)`;

function matchesStaticColumn(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia(STATIC_COLUMN_QUERY).matches;
}

/**
 * 지금 오버레이 드로어로 동작 중인지. 데스크톱(정적 컬럼)에서는 스크롤 잠금도, 히스토리 조작도
 * 하면 안 되므로 두 부수효과의 공통 게이트로 쓴다. 리사이즈로 경계를 넘나들 때도 따라온다.
 */
function useIsOverlayDrawer(): boolean {
  const [isOverlay, setIsOverlay] = useState(() => !matchesStaticColumn());

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined;

    const query = window.matchMedia(STATIC_COLUMN_QUERY);
    const sync = () => setIsOverlay(!query.matches);

    sync();
    // ⚠ `MediaQueryList.addEventListener`는 구형 Safari(<14)에 없다 — 옵셔널 호출이라 조용히
    //   no-op 이 되고 **리사이즈 추종만** 사라진다(초기값은 위 `sync()`가 정확히 잡는다).
    //   그 브라우저에서 폭이 경계를 넘나드는 것은 드문 동선이라 레거시 `addListener` 폴백은 두지 않는다.
    query.addEventListener?.('change', sync);

    return () => query.removeEventListener?.('change', sync);
  }, []);

  return isOverlay;
}

function MobileMenuDrawerComponent({ drawerId, isOpen, onClose, left, right, notice }: MobileMenuDrawerProps) {
  const isOverlay = useIsOverlayDrawer();

  /**
   * 뒤로가기로 닫기 — **오버레이일 때만** 히스토리에 엔트리를 심는다(데스크톱 정적 컬럼에서는
   * "열림"이 화면에 아무 의미가 없어 뒤로가기를 소비하면 안 된다).
   */
  useDrawerBackClose(isOpen, onClose, isOverlay);

  useEffect(() => {
    if (!isOpen || !isOverlay) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, isOverlay]);

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
