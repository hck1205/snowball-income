import styled from '@emotion/styled';
import { media, space } from '@/shared/styles';

/**
 * 카드 헤더 오른쪽 컨트롤 묶음 — 배당 표시 토글 + 비율 조절 잠금(2026-08-14).
 *
 * 종전에는 잠금 스위치 하나뿐이라 `titleRight` 에 그대로 꽂혀 있었다. 둘이 되면서 가로 배치와
 * 간격을 줄 자리가 필요해졌다.
 *
 * ⚠ 좁은 폭에서 **줄바꿈을 허용**한다(`flex-wrap`). 제목과 컨트롤이 한 줄에 다 못 들어가는 폭이
 *   실재하는데, 안 접으면 스위치가 카드 밖으로 밀리거나 제목을 밟는다.
 */
export const TitleRightGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: ${space[2]} ${space[3]};

  ${media.down('mobileWide')} {
    gap: ${space[1]} ${space[2]};
  }
`;
