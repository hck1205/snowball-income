import styled from '@emotion/styled';
import { color, container, font, media, motion, radius, space } from '@/shared/styles';

export const TableWrap = styled.div`
  overflow-x: auto;
  container-type: inline-size;
  min-width: 0;
  width: 100%;
  /* 가로 스크롤이 카드 밖으로 새지 않도록 */
  overscroll-behavior-x: contain;
`;

/**
 * 좁은 폭(<=820px)에서는 표를 행 단위 카드로 접는다. 기존 동작 그대로 유지하되
 * 컨테이너 쿼리와 미디어 쿼리를 함께 쓴다(컨테이너 미지원 폴백).
 */
const stackedTable = `
  display: block;
  min-width: 0;

  thead {
    display: none;
  }

  tbody {
    display: grid;
    gap: ${space[2]};
  }

  tbody tr {
    display: block;
    border: 1px solid ${color.border};
    border-radius: ${radius.md};
    padding: ${space[1]} ${space[3]};
    background: ${color.surfaceMuted};
  }

  tbody tr:hover {
    background: ${color.surfaceMuted};
  }
`;

export const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  min-width: 720px;
  font-size: ${font.size.sm};
  ${font.numeric};

  caption {
    caption-side: top;
    text-align: left;
    padding: 0 0 ${space[2]};
    color: ${color.textMuted};
    font-size: ${font.size.xs};
  }

  tbody tr {
    transition: background-color ${motion.fast} ${motion.ease};
  }

  tbody tr:hover {
    background: ${color.surfaceHover};
  }

  ${container.down('tablet')} {
    ${stackedTable};
  }

  ${media.down('tablet')} {
    ${stackedTable};
  }
`;

export const TH = styled.th`
  text-align: right;
  border-bottom: 1px solid ${color.borderStrong};
  padding: ${space[2]} ${space[2]} ${space[2]};
  color: ${color.textMuted};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
  white-space: nowrap;
  letter-spacing: 0.02em;

  ${container.down('tablet')} {
    display: none;
  }

  ${media.down('tablet')} {
    display: none;
  }
`;

const stackedCell = `
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: ${space[3]};
  text-align: right;
  padding: ${space[2]} ${space[1]};
  border-bottom: 1px solid ${color.border};

  &:last-of-type {
    border-bottom: 0;
  }

  &::before {
    content: attr(data-label);
    text-align: left;
    color: ${color.textMuted};
    font-size: ${font.size.xs};
    font-weight: ${font.weight.medium};
  }
`;

export const TD = styled.td`
  text-align: right;
  border-bottom: 1px solid ${color.border};
  padding: ${space[2]};
  color: ${color.text};
  white-space: nowrap;
  ${font.numeric};

  ${container.down('tablet')} {
    ${stackedCell};
  }

  ${media.down('tablet')} {
    ${stackedCell};
  }
`;
