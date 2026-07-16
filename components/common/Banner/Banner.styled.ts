import styled from '@emotion/styled';
import { color, font, media, motion, radius, space, TOUCH_TARGET } from '@/shared/styles';
import type { BannerTone } from './Banner.types';

/**
 * 배너.
 *
 * 톤은 **좌측 액센트 바 + 아주 옅은 배경**으로만 말한다. 배경을 진하게 칠하면
 * 배너가 화면의 주인공이 되어버려서, 정작 주인공인 데이터를 밀어낸다.
 *
 * 본문에 `textMuted`를 쓰지 않는 이유: 옅은 톤 배경 위에서 대비가 AA에 못 미친다.
 * `textSecondary`를 쓴다(대비 검증은 `shared/styles/contrast.test.ts`).
 */

const TONE: Record<BannerTone, { border: string; bg: string; accent: string; hover: string }> = {
  info: {
    border: color.brandBorder,
    bg: color.brandSubtle,
    accent: color.brand,
    hover: color.brandSubtleHover
  },
  warning: {
    border: color.warning,
    bg: color.warningSurface,
    accent: color.warning,
    hover: color.surfaceHover
  },
  danger: {
    border: color.dangerBorder,
    bg: color.dangerSurface,
    accent: color.danger,
    hover: color.surfaceHover
  }
};

export const BannerRoot = styled.section<{ tone: BannerTone; align: 'start' | 'center' }>`
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: ${space[3]};
  align-items: ${({ align }) => align};
  padding: ${space[4]};
  padding-left: ${space[5]};
  border: 1px solid ${({ tone }) => TONE[tone].border};
  border-radius: ${radius.md};
  background: ${({ tone }) => TONE[tone].bg};
  color: ${color.text};
  overflow: hidden;

  /* 좌측 액센트 바 — 톤을 여기서만 강하게 말한다. */
  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    background: ${({ tone }) => TONE[tone].accent};
  }

  ${media.down('mobileWide')} {
    padding: ${space[3]};
    padding-left: ${space[4]};
    gap: ${space[2]};
  }
`;

export const BannerContent = styled.div`
  display: grid;
  gap: ${space[2]};
  min-width: 0;
`;

export const BannerTitle = styled.h2`
  margin: 0;
  color: ${color.text};
  font-size: ${font.size.md};
  font-weight: ${font.weight.semibold};
  line-height: ${font.leading.tight};
`;

export const BannerBody = styled.div`
  display: grid;
  gap: ${space[2]};
  color: ${color.textSecondary};
  font-size: ${font.size.sm};
  line-height: ${font.leading.relaxed};
  overflow-wrap: anywhere;

  p {
    margin: 0;
  }

  strong {
    color: ${color.text};
    font-weight: ${font.weight.semibold};
  }
`;

export const BannerDismiss = styled.button<{ tone: BannerTone; align: 'start' | 'center' }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: ${TOUCH_TARGET};
  height: ${TOUCH_TARGET};
  /*
   * 음수 마진으로 시각적 여백은 배너 패딩과 맞추면서 터치 타겟 44x44를 지킨다.
   * center 정렬일 때는 위쪽 음수 마진을 빼서(0) 중앙선이 어긋나지 않게 한다.
   */
  margin: ${({ align }) => (align === 'center' ? '0' : `-${space[2]}`)} -${space[2]} 0 0;
  border: 1px solid transparent;
  border-radius: ${radius.sm};
  background: transparent;
  color: ${color.textSecondary};
  font-family: inherit;
  font-size: ${font.size.xl};
  line-height: 1;
  cursor: pointer;
  touch-action: manipulation;
  transition: background-color ${motion.fast} ${motion.ease}, color ${motion.fast} ${motion.ease};

  &:hover {
    background: ${({ tone }) => TONE[tone].hover};
    color: ${color.text};
  }
`;
