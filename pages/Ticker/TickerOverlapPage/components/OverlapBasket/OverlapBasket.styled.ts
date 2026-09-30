import styled from '@emotion/styled';
import {
  color,
  font,
  hitAreaWithin,
  media,
  motion,
  pressTransition,
  pressableSubtle,
  radius,
  space
} from '@/shared/styles';

/* OverlapBasket 의 스타일 — 원래 TickerOverlapPage.styled.ts 에서 값 변경 없이 옮겼다. 규율은 ../../styled/index.ts 머리말. */

export const SlotGrid = styled.ul`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: ${space[2]};
  margin: 0;
  padding: 0;
  list-style: none;
  min-width: 0;

  ${media.up('mobileWide')} {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }
`;

/** 담은 ETF 한 자리 — 비교 화면의 슬롯과 같은 모양(왼쪽 3px 귀가 종목 색). */
export const Slot = styled.li<{ $series: string }>`
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: ${space[1]};
  overflow: hidden;
  padding: ${space[2]} ${space[1]} ${space[2]} ${space[3]};
  border: 1px solid ${color.border};
  border-radius: ${radius.md};
  background: ${color.surface};
  min-width: 0;
  animation: overlap-slot-in ${motion.base} ${motion.ease};

  &::before {
    content: '';
    position: absolute;
    inset: 0 auto 0 0;
    width: 3px;
    background: ${({ $series }) => $series};
  }

  @keyframes overlap-slot-in {
    from {
      opacity: 0;
      transform: scale(0.94);
    }
    to {
      opacity: 1;
      transform: none;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

export const SlotBody = styled.div`
  display: grid;
  gap: 1px;
  min-width: 0;
`;

export const SlotTicker = styled.span`
  color: ${color.text};
  font-family: ${font.dataNumeric};
  font-size: ${font.size.md};
  font-weight: ${font.weight.bold};
  ${font.numeric}
`;

export const SlotMeta = styled.span`
  color: ${color.textMuted};
  font-size: ${font.size['2xs']};
  line-height: ${font.leading.tight};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
`;

export const SlotRemove = styled.button`
  ${pressableSubtle}
  ${hitAreaWithin(space[2])}
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: 1px solid transparent;
  border-radius: ${radius.pill};
  background: transparent;
  color: ${color.textMuted};
  cursor: pointer;
  transition:
    color ${motion.fast} ${motion.ease},
    background ${motion.fast} ${motion.ease},
    border-color ${motion.fast} ${motion.ease},
    ${pressTransition};

  &:hover {
    border-color: ${color.border};
    background: ${color.surfaceHover};
    color: ${color.text};
  }

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: 2px;
  }
`;

export const SlotGhost = styled.li`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${space[2]} ${space[3]};
  border: 1px dashed ${color.border};
  border-radius: ${radius.md};
  background: ${color.surfaceSunken};
  color: ${color.textMuted};
  font-size: ${font.size.xs};
  min-height: 46px;
  min-width: 0;
`;
