import styled from '@emotion/styled';
import { color, elevation, font, motion, radius, space, zIndex } from '@/shared/styles';

/**
 * 오른쪽 슬라이드 드로어(모든 폭 공통). 메인 시뮬레이터의 모바일 드로어와 같은 규약을 쓰되
 * (오버레이·닫기·Escape·스크롤 잠금) 이 페이지 안에서만 산다.
 *
 * 닫힘 상태는 `visibility: hidden` 이다 — 화면 밖으로 밀기만 하면 스크린리더·탭 이동이 여전히
 * 닿아서 "안 보이는데 포커스가 들어가는" 패널이 된다.
 */
export const DrawerBackdrop = styled.div<{ $open: boolean }>`
  position: fixed;
  inset: 0;
  z-index: ${zIndex.drawerBackdrop};
  background: ${color.overlay};
  backdrop-filter: blur(2px);
  opacity: ${({ $open }) => ($open ? 1 : 0)};
  visibility: ${({ $open }) => ($open ? 'visible' : 'hidden')};
  transition:
    opacity ${motion.base} ${motion.ease},
    visibility ${motion.base} ${motion.ease};

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

export const DrawerPanel = styled.aside<{ $open: boolean }>`
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: ${zIndex.drawer};
  width: min(420px, 92vw);
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  border-left: 1px solid ${color.border};
  background: ${color.surface};
  box-shadow: ${elevation[3]};
  transform: translateX(${({ $open }) => ($open ? '0' : '100%')});
  visibility: ${({ $open }) => ($open ? 'visible' : 'hidden')};
  transition:
    transform ${motion.base} ${motion.ease},
    visibility ${motion.base} ${motion.ease};

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

/** 상단 그라데이션 한 줄 — 히어로와 같은 시그니처로 "같은 제품의 표면"임을 잇는다. */
export const DrawerHead = styled.header`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${space[3]};
  padding: ${space[4]} ${space[4]} ${space[3]};
  border-bottom: 1px solid ${color.border};
  background: ${color.brandSubtle};

  &::before {
    content: '';
    position: absolute;
    inset: 0 0 auto 0;
    height: 3px;
    background: ${color.gradientAurora};
  }
`;

export const DrawerTitle = styled.h2`
  margin: 0;
  font-size: ${font.size.lg};
  font-weight: ${font.weight.extrabold};
  letter-spacing: -0.02em;
  color: ${color.text};
`;

export const DrawerCloseButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 36px;
  height: 36px;
  border: 1px solid ${color.border};
  border-radius: ${radius.pill};
  background: ${color.surface};
  color: ${color.textSecondary};
  cursor: pointer;
  transition:
    background ${motion.fast} ${motion.ease},
    color ${motion.fast} ${motion.ease};

  &:hover {
    background: ${color.surfaceHover};
    color: ${color.text};
  }

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: 2px;
  }
`;

/**
 * 세로 공간을 자식이 나눠 갖는다 — 검색·칩은 제 높이만 쓰고 **목록이 남은 높이를 전부** 채운다
 * (짧은 max-height + 안쪽 스크롤이면 드로어 아래가 텅 빈다). 스크롤은 목록 안에서만 일어난다.
 */
export const DrawerBody = styled.div`
  padding: ${space[4]};
  display: flex;
  flex-direction: column;
  gap: ${space[4]};
  overflow: hidden;
  min-height: 0;
`;
