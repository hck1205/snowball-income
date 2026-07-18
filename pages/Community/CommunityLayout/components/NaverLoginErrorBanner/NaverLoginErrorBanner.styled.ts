import styled from '@emotion/styled';
import { space } from '@/shared/styles';

/** 에러 배너와 그 아래 페이지 본문 사이 간격 확보. 에러가 없으면 컴포넌트가 null 이라 슬롯도 없다. */
export const BannerSlot = styled.div`
  margin-bottom: ${space[4]};
`;
