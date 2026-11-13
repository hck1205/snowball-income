import styled from '@emotion/styled';
import { color, font, radius, space } from '@/shared/styles';

/**
 * 은퇴 후 월 소득(2026-11-13 · 같은 날 컴포넌트 분리). 페이지 골격은 공용 `CalculatorLayout`, 구간 차트·건강보험 패널은
 * `pages/RetirementIncome/components/*` 가 각자 스타일을 갖는다. 여기에는 입력 묶음 제목과 각주만 남는다.
 */
/** 입력 묶음 제목 — 두 열을 가로지르고, 첫 묶음이 아니면 위에 구분선. */
export const GroupTitle = styled.h3`
  grid-column: 1 / -1;
  margin: 0;
  padding-top: ${space[2]};
  font-size: ${font.size.base};
  font-weight: ${font.weight.bold};
  color: ${color.text};

  &:not(:first-of-type) {
    margin-top: ${space[2]};
    padding-top: ${space[4]};
    border-top: 1px solid ${color.border};
  }
`;

export const Footnotes = styled.ul`
  display: grid;
  gap: ${space[2]};
  margin: 0;
  padding: ${space[4]} ${space[4]} ${space[4]} ${space[6]};
  border-radius: ${radius.md};
  background: ${color.surfaceSunken};
  font-size: ${font.size.base};
  line-height: ${font.leading.normal};
  color: ${color.textSecondary};
`;
