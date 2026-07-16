import styled from '@emotion/styled';
import { media } from '@/shared/styles';

/**
 * 커뮤니티 진입 버튼의 라벨. 튜토리얼 버튼(TourGuide의 `LaunchLabel`)과 동일하게
 * 모바일(mobileWide↓)에서 숨겨 아이콘만 남긴다. 숨겨도 버튼의 `aria-label`이 이름을 준다.
 */
export const NavLabel = styled.span`
  ${media.down('mobileWide')} {
    display: none;
  }
`;
