import styled from '@emotion/styled';
import { color, font, space } from '@/shared/styles';

/**
 * "내가 쓴 글" 페이지 컨테이너 — 제목 + 목록 카드의 **단일 세로 컬럼**.
 * 폭·간격은 프로필 설정(`CommunityProfilePage.styled.ts` ProfileMain)과 같은 값을 쓴다
 * (드롭다운에서 이웃한 두 화면이 같은 폭으로 보이도록). 페이지 styled 를 가로질러 import 하지
 * 않고 각 페이지가 자기 스타일을 소유한다.
 */
export const MyPostsMain = styled.div`
  max-width: 480px;
  margin: 0 auto;
  display: grid;
  gap: ${space[5]};
`;

export const PageTitle = styled.h1`
  margin: 0;
  color: ${color.text};
  font-size: ${font.size['2xl']};
  font-weight: ${font.weight.bold};
  line-height: ${font.leading.tight};
`;

/** 비로그인 딥링크 게이트 — 프로필 게이트와 동일한 폭·여백. */
export const GateWrap = styled.div`
  max-width: 480px;
  margin: clamp(${space[6]}, 8vw, ${space[16]}) auto 0;
`;

/** 프로바이더 버튼 세로 스택. 버튼 자체는 공용 `SocialLoginButton`(브랜드 규정색·로고·카피). */
export const GateButtons = styled.div`
  display: grid;
  gap: ${space[2]};
  margin-top: ${space[4]};
`;
