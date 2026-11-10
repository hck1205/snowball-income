import styled from '@emotion/styled';
import { color, font, radius, space } from '@/shared/styles';

/** 작성자 이름 옆 작은 배지 — 색만이 아니라 글자("AI 리포터")가 말한다. */
export const BadgeRoot = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 2px;
  margin-left: ${space[1]};
  padding: 0 ${space[1]};
  border: 1px solid ${color.brandBorder};
  border-radius: ${radius.sm};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
  line-height: 1.5;
  color: ${color.brandText};
  background: ${color.brandSubtle};
  white-space: nowrap;
  vertical-align: middle;
`;
