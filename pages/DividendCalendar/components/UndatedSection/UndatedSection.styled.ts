import styled from '@emotion/styled';
import { color, font, radius, space } from '@/shared/styles';

/** 점선이 "확정되지 않음"을 형태로도 말한다(색에만 기대지 않는다). */
export const UndatedRoot = styled.section`
  border: 1px dashed ${color.border};
  background: ${color.surfaceMuted};
  border-radius: ${radius.md};
  padding: ${space[3]};
  display: grid;
  gap: ${space[2]};
`;

export const UndatedHeading = styled.h3`
  margin: 0;
  display: flex;
  align-items: baseline;
  gap: ${space[2]};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.bold};
  color: ${color.text};
`;

export const UndatedCount = styled.span`
  font-size: ${font.size.xs};
  font-weight: ${font.weight.medium};
  color: ${color.textSecondary};
  ${font.numeric}
`;

export const UndatedHint = styled.p`
  margin: 0;
  font-size: ${font.size.xs};
  color: ${color.textMuted};
  line-height: ${font.leading.snug};
`;

export const UndatedList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: ${space[1]};
`;

export const UndatedItem = styled.li`
  display: flex;
  align-items: center;
  gap: ${space[2]};
  flex-wrap: wrap;
  font-size: ${font.size.xs};
  color: ${color.textSecondary};
`;

export const UndatedTicker = styled.span`
  font-weight: ${font.weight.semibold};
  color: ${color.text};
  ${font.numeric}
`;
