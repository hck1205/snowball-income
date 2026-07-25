import styled from '@emotion/styled';
import { space } from '@/shared/styles';

/**
 * 로그인 게이트 조각 — `CommunityWritePage.styled.ts`에서 옮겨왔다(스타일 값 동일, 마크업/동작 변화 없음).
 */

/* 로그인 게이트 / 로딩 */
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
