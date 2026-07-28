import styled from '@emotion/styled';
import { space } from '@/shared/styles';

/**
 * 본문 첫 줄. 버튼 하나뿐이라 좌측 정렬만 하고, 아래 콘텐츠와의 간격은 본문 스택이 아니라
 * 여기서 준다(페이지마다 첫 요소가 달라 스택 gap 에 맡기면 화면마다 리듬이 갈린다).
 */
export const BackRow = styled.div`
  display: flex;
  margin-bottom: ${space[3]};
`;
