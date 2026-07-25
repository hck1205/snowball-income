import styled from '@emotion/styled';
import { color, font } from '@/shared/styles';

/**
 * 페이지 설명 한 줄. 헤더가 전폭 sticky 바가 되면서 **헤더 밖 본문 흐름 최상단**으로 내려왔다
 * (커뮤니티 헤더에도 설명이 없다 — 통일 관점에서도 헤더 밖이 맞다). sticky가 아니므로
 * 모바일에서 스크롤과 함께 사라져 뷰포트를 계속 잠식하지 않는다.
 */
export const HeaderDescription = styled.p`
  margin: 0;
  color: ${color.textSecondary};
  font-size: ${font.size.base};
  line-height: ${font.leading.snug};
`;
