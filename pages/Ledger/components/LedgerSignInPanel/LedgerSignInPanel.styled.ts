import styled from '@emotion/styled';
import { color, font, sectionTitleFontSize, space } from '@/shared/styles';

/**
 * 앱 로그인 게이트 — 카드가 아니라 **섹션**이다(제목 + 설명 + 제공자 버튼 세로 스택).
 *
 * 연결 전 화면(`LedgerConnectPanel`)과 같은 뼈대를 쓰되 카드 타일이 없다. 여기서 고르는 것은
 * "무엇으로 시작할까"(선택지)가 아니라 "누구인가"(신원)라 타일 대비가 필요 없다.
 */
export const SignInSection = styled.section`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: ${space[4]};
  min-width: 0;
  max-width: 480px;
`;

export const SignInHeading = styled.h2`
  margin: 0;
  font-size: ${sectionTitleFontSize};
  font-weight: ${font.weight.extrabold};
  letter-spacing: -0.01em;
  color: ${color.text};
`;

/** 설명문. 한글 산문이라 overflow-wrap 을 건드리지 않는다(줄바꿈은 브라우저 기본에 맡긴다). */
export const SignInBody = styled.p`
  margin: 0;
  max-width: 52ch;
  font-size: ${font.size.sm};
  line-height: ${font.leading.normal};
  color: ${color.textSecondary};
`;

/**
 * 제공자 버튼 세로 스택. 버튼 자체는 공용 `SocialLoginButton`(3사 규정색·로고·정본 카피)이라
 * 여기서 색·라벨을 다시 정의하지 않는다 — 규정 준수의 단일 출처를 쪼개지 않는다.
 */
export const SignInButtons = styled.div`
  display: grid;
  gap: ${space[2]};
  min-width: 0;
`;
