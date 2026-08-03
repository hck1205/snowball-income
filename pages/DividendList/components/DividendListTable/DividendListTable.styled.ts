import styled from '@emotion/styled';
import { Link } from 'react-router-dom';
import { color, container, font, media, motion, radius, space, subtleScrollbar } from '@/shared/styles';

/**
 * 정렬 가능한 목록 표.
 *
 * 🔴 공용 `DataTable` 을 쓰지 않은 이유: 그 부품의 열 헤더는 **문자열**이라 정렬 버튼을 얹을 자리가
 * 없다(`components/common/DataTable/DataTable.types.ts` 의 `header: string`). 공용 부품에 정렬을
 * 넣는 것은 15곳 넘는 소비처를 건드리는 별건이라, 이 화면 안에 두고 **조판 언어만** 맞춘다
 * (좁은 폭에서 행 카드로 접는 규칙·스크롤바·서체가 DataTable 과 같은 토큰이다).
 */
export const TableWrap = styled.div`
  overflow-x: auto;
  container-type: inline-size;
  min-width: 0;
  width: 100%;
  overscroll-behavior-x: contain;
  /* 표는 넘칠 때 스크롤바가 보여야 한다 — 넘친다는 사실 자체가 정보다. */
  ${subtleScrollbar}
`;

/* 좁은 폭에서는 행을 카드로 접는다. DataTable 과 같은 규칙·같은 중단점. */
const stackedTable = `
  display: block;
  min-width: 0;

  thead {
    display: none;
  }

  tbody {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
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
  min-width: 640px;
  font-size: ${font.size.sm};

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
  text-align: left;
  border-bottom: 1px solid ${color.borderStrong};
  padding: 0;
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

/**
 * 정렬 버튼 = 헤더 셀 전체. 작은 화살표만 누르게 하면 손가락으로 못 맞춘다.
 * ⚠ 활성 표시는 색만으로 하지 않는다 — 화살표 글리프가 방향을 함께 말하고,
 *   `aria-sort` 가 스크린리더에 같은 사실을 전달한다(`DividendListTable.tsx`).
 */
export const SortButton = styled.button<{ $active: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: ${space[1]};
  width: 100%;
  padding: ${space[2]};
  border: 0;
  background: none;
  cursor: pointer;
  color: ${(props) => (props.$active ? color.text : color.textMuted)};
  font: inherit;
  font-weight: ${font.weight.semibold};
  letter-spacing: inherit;
  transition: color ${motion.fast} ${motion.ease};

  &:hover {
    color: ${color.text};
  }

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: -2px;
  }
`;

/** 정렬 방향 글리프. 비활성 열에서도 자리를 차지해 헤더 폭이 클릭할 때마다 흔들리지 않게 한다. */
export const SortGlyph = styled.span<{ $active: boolean }>`
  width: 10px;
  text-align: center;
  font-size: ${font.size.xs};
  opacity: ${(props) => (props.$active ? 1 : 0.35)};
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
  text-align: left;
  border-bottom: 1px solid ${color.border};
  padding: ${space[2]};
  color: ${color.text};

  ${container.down('tablet')} {
    ${stackedCell};
  }

  ${media.down('tablet')} {
    ${stackedCell};
  }
`;

/** 티커 셀 — 숫자·기호가 섞인 짧은 문자열이라 데이터 서체로 세운다. */
export const TickerCell = styled(TD)`
  font-family: ${font.dataNumeric};
  font-weight: ${font.weight.semibold};
  white-space: nowrap;
`;

export const TickerLink = styled(Link)`
  color: ${color.brandText};
  text-decoration: none;
  border-bottom: 1px solid transparent;

  &:hover,
  &:focus-visible {
    border-bottom-color: currentColor;
  }
`;

export const SectorTag = styled.span`
  display: inline-block;
  padding: 2px ${space[2]};
  border: 1px solid ${color.border};
  border-radius: ${radius.pill};
  background: ${color.surfaceMuted};
  color: ${color.textSecondary};
  font-size: ${font.size.xs};
  white-space: nowrap;
`;

/** 어느 자료가 이 종목을 확인해 줬는지. 목록의 신뢰 근거라 표 안에 둔다(각주로 내리지 않는다). */
export const ConfirmedBy = styled.span`
  color: ${color.textMuted};
  font-size: ${font.size.xs};
`;

export const EmptyRowCell = styled.td`
  padding: ${space[6]} ${space[2]};
  text-align: center;
  color: ${color.textMuted};
  font-size: ${font.size.sm};
`;
