import styled from '@emotion/styled';
import { color, font, space } from '@/shared/styles';

/** 기존 인라인 style 속성을 그대로 옮겨온 것 (마크업/동작 변화 없음). */

export const HelpBulletList = styled.ul`
  margin: 0;
  padding-left: ${space[5]};
  display: grid;
  gap: ${space[2]};
  color: ${color.textSecondary};
  font-size: ${font.size.base};
  line-height: ${font.leading.relaxed};

  strong {
    color: ${color.text};
    font-weight: ${font.weight.semibold};
  }
`;

export const HelpBulletIcon = styled.span`
  display: inline-flex;
  vertical-align: middle;
  margin-right: ${space[1]};
  color: ${color.brandText};
`;
