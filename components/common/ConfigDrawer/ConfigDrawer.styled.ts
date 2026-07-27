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
    /* 아래 여백은 홈 인디케이터(iOS)만큼 더 준다 — 그렇지 않으면 마지막 입력이 제스처 바에 물린다.
       env()를 모르는 브라우저는 calc가 무효라 폴백 선언(위 padding)이 그대로 쓰인다. */
    padding: ${space[12]} ${space[3]} ${space[5]};
    padding-bottom: calc(${space[5]} + env(safe-area-inset-bottom, 0px));
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

/**
 * 드로어 닫기(×). **테두리·면색 없는 아이콘 버튼**이다 — 예전의 원형 pill 보더는 사용자 요청으로 제거했다.
 * 크롬은 사라져도 터치 타깃(38×38)은 그대로 두고, 포커스 링은 전역 `button:focus-visible`
 * (globalStyles.ts:141-152)이 그린다 — 여기서 outline을 끄지 말 것.
 */
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
    border: 0;
    background: none;
    color: ${color.textSecondary};
    border-radius: ${radius.sm};
    padding: 0;
    font-size: ${font.size.lg};
    line-height: 1;
    cursor: pointer;
    touch-action: manipulation;
    transition: color ${motion.fast} ${motion.ease};

    &:hover {
      color: ${color.text};
    }
  }
`;
