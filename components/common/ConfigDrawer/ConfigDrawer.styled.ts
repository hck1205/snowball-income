import styled from '@emotion/styled';
import { color, font, media, motion, radius, shadow, space, zIndex } from '@/shared/styles';

export const ConfigColumn = styled.aside`
  position: static;
  display: grid;
  gap: ${space[4]};
  max-height: none;
  overflow: visible;
  padding: 0;
  contain: layout paint style;

  ${media.down('drawer')} {
    position: fixed;
    top: 0;
    left: 0;
    width: min(92vw, 360px);
    height: 100dvh;
    max-height: 100dvh;
    z-index: ${zIndex.drawer};
    /* 페이지와 같은 극야 + 오로라 글로우 위에 입력 폼 — 글로우 마지막 레이어가 bg 단색이라 폴백 안전. */
    background: ${color.bgGlow} no-repeat;
    background-color: ${color.bg};
    border-right: 1px solid ${color.border};
    box-shadow: ${shadow.e3};
    padding: ${space[12]} ${space[3]} ${space[5]};
    transform: translateX(-100%);
    transition: transform ${motion.base} ${motion.ease};
    overflow-x: hidden;
    overflow-y: auto;
    overscroll-behavior: contain;
  }
`;

export const ConfigDrawerColumn = styled(ConfigColumn)<{ open: boolean }>`
  ${media.down('drawer')} {
    display: ${({ open }) => (open ? 'grid' : 'none')};
    will-change: transform;
    transform: ${({ open }) => (open ? 'translateX(0)' : 'translateX(-100%)')};
  }
`;

export const DrawerBackdrop = styled.div<{ open: boolean }>`
  display: none;

  ${media.down('drawer')} {
    display: ${({ open }) => (open ? 'block' : 'none')};
    position: fixed;
    inset: 0;
    z-index: ${zIndex.drawerBackdrop};
    background: ${color.overlay};
    backdrop-filter: blur(2px);
  }
`;

export const DrawerCloseButton = styled.button`
  display: none;

  ${media.down('drawer')} {
    display: flex;
    align-items: center;
    justify-content: center;
    position: absolute;
    top: ${space[2]};
    right: ${space[2]};
    width: 38px;
    height: 38px;
    border: 1px solid ${color.border};
    background: ${color.surface};
    color: ${color.textSecondary};
    border-radius: ${radius.pill};
    padding: 0;
    font-size: ${font.size.lg};
    line-height: 1;
    cursor: pointer;
    touch-action: manipulation;
    transition: background-color ${motion.fast} ${motion.ease}, color ${motion.fast} ${motion.ease};

    &:hover {
      background: ${color.surfaceHover};
      color: ${color.text};
    }
  }
`;
