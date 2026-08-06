import styled from '@emotion/styled';
import { Link } from 'react-router-dom';
import { color, font, radius, space } from '@/shared/styles';

/* --------------------------------------------------------------------------
 * 날짜 드로어 안쪽 — **한 날의 모든 것**을 위에서 아래로 읽는 면.
 *
 * 🔴 이 안에서 색면을 만들지 않는다. 드로어는 이미 떠 있는 패널이고, 그 위에 틴트 면을 또 깔면
 * 층이 두 겹이 되어 무엇이 주인공인지 사라진다. 구분은 **머리글 + 헤어라인**이 한다.
 * -------------------------------------------------------------------------- */

export const Stack = styled.div`
  display: grid;
  gap: ${space[5]};
  min-width: 0;
`;

export const Block = styled.section`
  display: grid;
  gap: ${space[2]};
  min-width: 0;
`;

export const BlockTitle = styled.h3`
  margin: 0;
  padding-bottom: ${space[2]};
  border-bottom: 1px solid ${color.border};
  color: ${color.textMuted};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.bold};
  letter-spacing: 0.04em;
`;

/** 거래 상태 한 줄 — 이 드로어에서 가장 먼저 읽혀야 하는 사실. */
export const StatusLine = styled.p`
  margin: 0;
  color: ${color.text};
  font-size: ${font.size.lg};
  font-weight: ${font.weight.bold};
`;

export const StatusNote = styled.p`
  margin: 0;
  color: ${color.textSecondary};
  font-size: ${font.size.sm};
  line-height: ${font.leading.relaxed};
`;

export const ItemList = styled.ul`
  display: grid;
  gap: ${space[2]};
  margin: 0;
  padding: 0;
  list-style: none;
`;

/**
 * 일정 한 줄 — 시각(왼쪽 고정 폭) + 내용.
 *
 * ⚠ 시각을 고정 폭 열로 두는 이유: 여러 줄이 쌓였을 때 눈이 시각을 세로로 훑을 수 있어야 한다.
 *   내용 뒤에 붙이면 줄마다 시각의 x 좌표가 달라져 훑기가 불가능해진다.
 */
export const Item = styled.li`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: baseline;
  gap: ${space[3]};
  padding: ${space[2]} 0;
  border-bottom: 1px solid ${color.border};

  &:last-of-type {
    border-bottom: 0;
  }
`;

export const ItemTime = styled.span`
  color: ${color.textMuted};
  font-family: ${font.dataNumeric};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
  white-space: nowrap;
  ${font.numeric}
`;

export const ItemBody = styled.span`
  display: grid;
  gap: 2px;
  min-width: 0;
  color: ${color.text};
  font-size: ${font.size.sm};
  line-height: ${font.leading.snug};
`;

export const ItemNote = styled.span`
  color: ${color.textMuted};
  font-size: ${font.size.xs};
`;

/** "주요" 표식. 폭이 짧아 예산 밖(L1)이고, 색이 아니라 글자가 뜻을 진다. */
export const MajorTag = styled.span`
  display: inline-flex;
  align-items: center;
  margin-left: ${space[2]};
  padding: 1px ${space[2]};
  border-radius: ${radius.pill};
  border: 1px solid ${color.accentBorder};
  color: ${color.accentText};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.bold};
`;

export const TickerLink = styled(Link)`
  color: ${color.brandText};
  font-family: ${font.dataNumeric};
  font-weight: ${font.weight.bold};
  text-decoration: none;

  &:hover,
  &:focus-visible {
    text-decoration: underline;
  }
`;

export const TickerPlain = styled.span`
  font-family: ${font.dataNumeric};
  font-weight: ${font.weight.bold};
`;

export const EmptyNote = styled.p`
  margin: 0;
  color: ${color.textSecondary};
  font-size: ${font.size.sm};
  line-height: ${font.leading.relaxed};
`;
