import styled from '@emotion/styled';
import { color, font, radius, space } from '@/shared/styles';

/* 성장·복리(시뮬 결과) 계열 정보 배지 — 오로라 teal 계열(§4.6). 선택 상태가 아니므로 brand가 아니다. */
export const SimBadgeRoot = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${space[1]};
  padding: 2px ${space[2]};
  border-radius: ${radius.pill};
  background: ${color.accentSubtle};
  border: 1px solid ${color.accentBorder};
  color: ${color.accentText};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.semibold};
  white-space: nowrap;
  flex: 0 0 auto;
`;
