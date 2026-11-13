import styled from '@emotion/styled';
import { color, font, radius, space } from '@/shared/styles';

/** 날짜 블록 — 월은 작게, 일은 크게, 요일은 아래. 세 줄이 세로 가운데. */
export const DateBlock = styled.div`
  display: grid;
  justify-items: center;
  padding: ${space[1]} 0;
  border-radius: ${radius.sm};
  background: ${color.surfaceSunken};
  line-height: 1.1;
  ${font.numeric};
`;

export const DateMonth = styled.span`
  font-size: ${font.size.xs};
  color: ${color.textSecondary};
`;

export const DateDay = styled.strong`
  font-size: ${font.size.xl};
  font-weight: ${font.weight.extrabold};
  color: ${color.text};
`;

export const DateWeekday = styled.span`
  font-size: ${font.size.xs};
  color: ${color.textSecondary};
`;
