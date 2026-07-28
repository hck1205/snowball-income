import styled from '@emotion/styled';
import { color, space } from '@/shared/styles';

/**
 * 시나리오 탭 줄 — 탭 스트립 + "간략히" 토글이 같은 줄에 선다.
 *
 * 🔴 밑줄(`border-bottom`)은 **탭 스트립이 아니라 이 래퍼**가 갖는다. 스트립에 두면 스트립 폭
 * (= 탭 개수만큼)까지만 선이 그려져 토글 아래가 끊긴다.
 *
 * 토글은 전 폭에서 같은 줄을 유지한다 — 탭 스트립이 가로 스크롤이라 줄바꿈이 필요 없다.
 */
export const TabsRowRoot = styled.div`
  display: flex;
  align-items: flex-end;
  gap: ${space[3]};
  border-bottom: 1px solid ${color.border};
  min-width: 0;

  > :first-of-type {
    flex: 1 1 auto;
    min-width: 0;
  }
`;

export const CompactToggleSlot = styled.div`
  flex: 0 0 auto;
  padding-bottom: ${space[2]};
`;
