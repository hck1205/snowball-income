import styled from '@emotion/styled';
import { color, font, space } from '@/shared/styles';

/**
 * 게시 설정(공개 범위) 조각 — `CommunityWritePage.styled.ts`에서 옮겨왔다(스타일 값 동일, 마크업/동작 변화 없음).
 */

/** 비공개 토글 + 상태 안내 문구를 **한 행에 나란히**(문구를 토글 아래가 아니라 옆에). */
export const VisibilityRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${space[3]};
  flex-wrap: wrap;
`;

export const VisibilityText = styled.p`
  margin: 0;
  min-width: 0;
  color: ${color.textSecondary};
  font-size: ${font.size.sm};
`;
