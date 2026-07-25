import styled from '@emotion/styled';
import { color, font, radius, space } from '@/shared/styles';

export const AgendaRoot = styled.section`
  display: grid;
  gap: ${space[3]};
  min-width: 0;
`;

export const AgendaHeading = styled.h3`
  margin: 0;
  font-size: ${font.size.sm};
  font-weight: ${font.weight.bold};
  color: ${color.text};
`;

export const AgendaDayList = styled.ol`
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: ${space[2]};
`;

export const AgendaDayItem = styled.li`
  display: grid;
  gap: ${space[1]};
  padding: ${space[2]} ${space[3]};
  border: 1px solid ${color.border};
  border-radius: ${radius.sm};
  background: ${color.surface};
  min-width: 0;
`;

export const AgendaDayLabel = styled.h4`
  margin: 0;
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  color: ${color.text};
  ${font.numeric}
`;

export const AgendaItemList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: ${space[1]};
`;

export const AgendaItem = styled.li`
  display: flex;
  align-items: center;
  gap: ${space[2]};
  flex-wrap: wrap;
  font-size: ${font.size.xs};
  color: ${color.textSecondary};
`;

export const AgendaTicker = styled.span`
  font-weight: ${font.weight.semibold};
  color: ${color.text};
  ${font.numeric}
`;

export const AgendaEmpty = styled.p`
  margin: 0;
  font-size: ${font.size.xs};
  color: ${color.textMuted};
  line-height: ${font.leading.snug};
`;
