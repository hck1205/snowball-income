import styled from '@emotion/styled';
import { color, font, media, motion, radius, space } from '@/shared/styles';

/**
 * 12칸 그리드. 폭에 따라 열 수만 바뀌고 **DOM은 모든 폭에서 동일**하다
 * (폭별로 다른 노드를 렌더해 하나를 감추면 jsdom에서 둘 다 보인다).
 */
export const BoardList = styled.ol`
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: ${space[2]};

  ${media.down('tabletSm')} {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  ${media.down('mobile')} {
    grid-template-columns: 1fr;
  }
`;

/**
 * 지급 없는 달도 칸을 그대로 차지한다 — 12칸 리듬이 유지돼야 "비는 달"이 눈에 들어온다.
 * 흐리게(opacity) 처리하지 않고 면색·테두리로 구분해 텍스트 대비를 지킨다.
 */
export const MonthItem = styled.li<{ $paying: boolean; $current: boolean }>`
  display: grid;
  align-content: start;
  gap: ${space[2]};
  min-height: 112px;
  box-sizing: border-box;
  padding: ${space[3]};
  border: 1px ${({ $paying }) => ($paying ? 'solid' : 'dashed')} ${color.border};
  border-color: ${({ $current }) => ($current ? color.accentBorder : color.border)};
  border-radius: ${radius.md};
  background: ${({ $paying }) => ($paying ? color.surface : color.surfaceMuted)};
  box-shadow: ${({ $current }) => ($current ? `inset 0 0 0 1px ${color.accentBorder}` : 'none')};

  ${media.down('mobile')} {
    grid-template-columns: 64px minmax(0, 1fr);
    align-items: start;
    min-height: 0;
  }
`;

export const MonthHead = styled.div`
  display: flex;
  align-items: center;
  gap: ${space[2]};
  flex-wrap: wrap;

  ${media.down('mobile')} {
    flex-direction: column;
    align-items: flex-start;
    gap: ${space[1]};
  }
`;

export const MonthLabel = styled.h3`
  margin: 0;
  font-size: ${font.size.md};
  font-weight: ${font.weight.bold};
  color: ${color.text};
  ${font.numeric}
`;

export const CurrentMonthBadge = styled.span`
  padding: 1px ${space[2]};
  border-radius: ${radius.pill};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.medium};
  white-space: nowrap;
  color: ${color.accentText};
  background: ${color.accentSubtle};
`;

export const MonthBody = styled.div`
  display: grid;
  gap: ${space[2]};
  min-width: 0;
`;

export const MonthSummary = styled.p<{ $paying: boolean }>`
  margin: 0;
  font-size: ${font.size.xs};
  color: ${({ $paying }) => ($paying ? color.textSecondary : color.textMuted)};
  ${font.numeric}
`;

export const MonthChipList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: ${space[1]};
`;

export const MonthChipItem = styled.li`
  display: inline-flex;
`;

export const MonthChipLabel = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${space[1]};
  ${font.numeric}
`;

/** 로딩 골격. 텍스트가 아닌 자리지킴이라 스크린리더에서 감춘다. */
export const SkeletonBlock = styled.span`
  display: block;
  height: 12px;
  border-radius: ${radius.xs};
  background: ${color.surfaceMuted};
  animation: calendar-skeleton-pulse 1.4s ${motion.ease} infinite;

  @keyframes calendar-skeleton-pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;
