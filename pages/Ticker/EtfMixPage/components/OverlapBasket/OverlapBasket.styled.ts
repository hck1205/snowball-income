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

/* OverlapBasket 의 스타일 — 슬롯은 비교 화면의 덱과 같은 모양, 아래에 비중 편집. 규율은 ../../styled/index.ts 머리말. */

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

/* ── 비중 ─────────────────────────────────────────────────────────────────── */

export const WeightHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${space[3]};
  padding-top: ${space[1]};
  border-top: 1px solid ${color.border};
  min-width: 0;
`;

export const WeightTitle = styled.h3`
  margin: 0;
  color: ${color.textMuted};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.semibold};
  letter-spacing: 0.12em;
`;

export const WeightList = styled.ul`
  display: grid;
  gap: ${space[2]};
  margin: 0;
  padding: 0;
  list-style: none;
  min-width: 0;
`;

/** 티커 · 슬라이더 · 몫. 몫 칸은 폭을 고정해 값이 바뀌어도 슬라이더 길이가 흔들리지 않게 한다. */
export const WeightRow = styled.li`
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr) 56px;
  align-items: center;
  gap: ${space[3]};
  min-width: 0;
`;

export const WeightTicker = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${space[2]};
  color: ${color.text};
  font-family: ${font.dataNumeric};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.bold};
  ${font.numeric}
`;

/**
 * 네이티브 range — 키보드(화살표·Home/End)와 낭독(aria-valuetext 로 몫을 읽는다)을 그대로 얻는다.
 * 채움 색은 그 ETF 의 종목 색이다(accent-color). 색만으로 말하지 않는다 — 옆에 티커와 몫이 글자로 있다.
 */
export const WeightSlider = styled.input<{ $series: string }>`
  width: 100%;
  min-width: 0;
  margin: 0;
  accent-color: ${({ $series }) => $series};
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: 3px;
  }
`;

export const WeightValue = styled.span`
  color: ${color.text};
  font-family: ${font.dataNumeric};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  text-align: right;
  ${font.numeric}
`;

export const WeightHint = styled.p`
  margin: 0;
  color: ${color.textSecondary};
  font-size: ${font.size.xs};
  line-height: ${font.leading.normal};
`;
