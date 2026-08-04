import styled from '@emotion/styled';
import { Link } from 'react-router-dom';
import { color, font, space } from '@/shared/styles';

/**
 * 이 화면에만 있는 조각.
 *
 * 🔴 섹션 뼈대는 여기 없다 — `components/common/DataSection` 이 소유한다.
 *    달력 격자는 `../components/MonthGrid` 가 소유한다.
 */

/** 달력 아래 한 줄 — 그 달의 요약이거나, 빈칸의 뜻을 설명하는 말이다. */
export const MonthNote = styled.p`
  margin: 0;
  color: ${color.textMuted};
  font-size: ${font.size.xs};
  line-height: 1.6;
`;

export const YearHeading = styled.h3`
  margin: 0 0 ${space[2]};
  color: ${color.text};
  font-size: ${font.size.md};
  font-weight: ${font.weight.bold};
`;

/** 소개 페이지가 있는 종목만 링크가 된다 — 없는 곳으로 보내지 않는다. */
export const EarningsTicker = styled(Link)`
  font-family: ${font.dataNumeric};
  font-weight: ${font.weight.semibold};
  color: ${color.brandText};
  text-decoration: none;
  border-bottom: 1px solid transparent;

  &:hover,
  &:focus-visible {
    border-bottom-color: currentColor;
  }
`;
