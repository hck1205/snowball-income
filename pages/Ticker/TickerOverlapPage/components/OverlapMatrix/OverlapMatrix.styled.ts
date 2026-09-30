import styled from '@emotion/styled';
import {
  color,
  font,
  motion,
  radius,
  space,
  subtleScrollbar
} from '@/shared/styles';

/* OverlapMatrix 의 스타일 — 원래 TickerOverlapPage.styled.ts 에서 값 변경 없이 옮겼다. 규율은 ../../styled/index.ts 머리말. */

export const MatrixScroller = styled.div`
  overflow-x: auto;
  ${subtleScrollbar}
  min-width: 0;
`;

export const MatrixTable = styled.table`
  border-collapse: separate;
  border-spacing: ${space[1]};
  margin: 0 calc(-1 * ${space[1]});
`;

export const MatrixHead = styled.th<{ $series: string }>`
  padding: ${space[1]} ${space[2]};
  color: ${color.textSecondary};
  font-family: ${font.dataNumeric};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  text-align: left;
  white-space: nowrap;
  ${font.numeric}

  &::before {
    content: '';
    display: inline-block;
    width: 8px;
    height: 8px;
    margin-right: 6px;
    border-radius: ${radius.pill};
    background: ${({ $series }) => $series};
  }
`;

/**
 * 짝 한 칸. 진하기가 겹침 크기다(최대 45% 섞음 — 그 위로 가면 다크 테마에서 글자 대비가 무너진다).
 * 칸 폭이 180px 미만이라 tintscan 의 면이 아니다.
 */
export const MatrixCell = styled.td<{ $intensity: number }>`
  min-width: 72px;
  height: 52px;
  padding: ${space[1]} ${space[2]};
  border-radius: ${radius.sm};
  background: ${({ $intensity }) =>
    `color-mix(in srgb, ${color.warning} ${Math.round(Math.min(0.45, Math.max(0, $intensity)) * 100)}%, ${color.surface})`};
  color: ${color.text};
  text-align: center;
  vertical-align: middle;
  transition: background ${motion.base} ${motion.ease};

  strong {
    display: block;
    font-family: ${font.dataNumeric};
    font-size: ${font.size.md};
    font-weight: ${font.weight.bold};
    ${font.numeric}
  }

  span {
    color: ${color.textSecondary};
    font-size: ${font.size['2xs']};
  }
`;

export const MatrixSelf = styled.td`
  min-width: 72px;
  height: 52px;
  border-radius: ${radius.sm};
  background: ${color.surfaceSunken};
  color: ${color.textMuted};
  font-size: ${font.size['2xs']};
  text-align: center;
`;
