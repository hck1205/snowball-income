import styled from '@emotion/styled';
import { color, font, radius, shadow, space } from '@/shared/styles';

export const CardContainer = styled.section`
  background: ${color.surface};
  border: 1px solid ${color.border};
  border-radius: ${radius.lg};
  padding: clamp(14px, 1.8vw, 20px);
  box-shadow: ${shadow.e1};
  color: ${color.text};
  min-width: 0;
  width: 100%;
  content-visibility: auto;
  contain-intrinsic-size: 280px;
  contain: layout paint style;
`;

export const CardHeader = styled.div<{ inlineTitleRight?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: ${({ inlineTitleRight }) => (inlineTitleRight ? 'flex-start' : 'space-between')};
  gap: ${space[2]};
  margin: 0 0 ${space[4]};
`;

export const CardTitle = styled.h2`
  margin: 0;
  color: ${color.text};
  font-size: clamp(16px, 1.8vw, 18px);
  font-weight: ${font.weight.bold};
  line-height: ${font.leading.tight};
  letter-spacing: -0.01em;
`;
