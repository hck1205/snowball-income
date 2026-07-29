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

/**
 * 탭 스트립 오른쪽의 액션 묶음 — [이미지 저장] [간략히] 순서다.
 *
 * 두 컨트롤을 한 덩어리로 묶는 이유: 밑줄 위에서 **같은 기준선**을 쓰고, 좁은 폭에서 줄바꿈될 때
 * 둘이 함께 움직여야 하기 때문이다(따로 두면 토글만 아래로 떨어져 밑줄이 두 번 꺾인다).
 */
export const RowActions = styled.div`
  flex: 0 0 auto;
  display: flex;
  /* 토글이 두 줄(라벨 위·스위치 아래)이라 두 컨트롤의 높이가 다르다 — center 로 두면 카메라가
     라벨과 스위치 사이 빈 곳에 뜬다. 아래를 맞춰야 스위치와 카메라가 같은 선에 선다. */
  align-items: flex-end;
  gap: ${space[2]};
  /* 밑줄에서 띄우는 여백은 **묶음이** 갖는다 — 각자 가지면 둘의 기준선이 갈린다. */
  padding-bottom: ${space[2]};
`;

export const CompactToggleSlot = styled.div`
  flex: 0 0 auto;
`;
