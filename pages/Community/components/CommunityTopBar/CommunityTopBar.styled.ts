import styled from '@emotion/styled';
import { space } from '@/shared/styles';

/**
 * 좌(목록 복귀) ↔ 우(화면 액션) 한 줄.
 *
 * 320px 폭 예산: 좌우 패딩 24px 를 뺀 296px 안에
 * "← 목록"(아이콘16 + gap4 + 라벨 2자 24 + 좌우패딩 24 ≈ 68px)
 * + "수정"(≈ 68px) + "삭제"(≈ 68px) + gap 8×2 = 220px → 들어간다.
 * 그래도 `flex-wrap` 을 켜 두는 이유는 사용자 글꼴 확대(브라우저 줌·시스템 폰트)에서 예산이 깨질 때
 * **잘리는 대신 줄을 바꾸게** 하기 위해서다(잘림 금지 원칙).
 */
export const TopBarRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: ${space[2]};
  margin-bottom: ${space[3]};
`;

/** 우측 액션 묶음(상세의 수정·삭제). 소유자가 아니면 아예 렌더되지 않는다. */
export const TopBarActions = styled.div`
  display: inline-flex;
  align-items: center;
  gap: ${space[2]};
  margin-left: auto;
`;
