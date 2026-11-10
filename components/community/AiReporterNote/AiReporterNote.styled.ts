import styled from '@emotion/styled';
import { color, font, radius, space } from '@/shared/styles';

/**
 * 본문 아래 고지 상자 — 본문과 **다른 지면**임이 형태로 드러나야 한다(작은 글자 + 옅은 면 + 왼쪽 배지).
 * 예전에는 본문 끝 기울임 문단이라 본문과 같은 크기로 읽혔다.
 */
export const NoteRoot = styled.aside`
  display: flex;
  gap: ${space[3]};
  align-items: flex-start;
  margin-top: ${space[8]};
  padding: ${space[3]} ${space[4]};
  border-radius: ${radius.lg};
  background: ${color.surfaceSunken};
  color: ${color.textSecondary};
  font-size: ${font.size.sm};
  line-height: ${font.leading.relaxed};
`;

export const NoteIcon = styled.span`
  flex: none;
  font-size: ${font.size.lg};
  line-height: 1.4;
`;

export const NoteText = styled.p`
  margin: 0;
`;
