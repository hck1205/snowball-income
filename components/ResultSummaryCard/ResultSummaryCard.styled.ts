import styled from '@emotion/styled';
import { space } from '@/shared/styles';

/**
 * 결과 카드의 지표 그리드.
 *
 * hero 타일(최종 자산 가치)은 **한 줄을 통째로 차지**한다(`grid-column: 1 / -1`).
 * 나머지 지표는 그 아래에 작게 깔린다. 이렇게 해야 "이 앱을 켠 이유"가 첫눈에 들어온다.
 */
export const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(170px, 100%), 1fr));
  gap: ${space[2]};
`;

/** hero 지표는 그리드 한 줄 전체를 쓴다. */
export const HeroSlot = styled.div`
  grid-column: 1 / -1;
  min-width: 0;
`;
