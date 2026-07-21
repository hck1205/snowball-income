import styled from '@emotion/styled';
import { color, font, radius, space } from '@/shared/styles';

export const Subtitle = styled.p`
  margin: 0 0 ${space[4]};
  color: ${color.textSecondary};
  font-size: ${font.size.base};
  line-height: ${font.leading.normal};
`;

/**
 * 직전 로그인 실패 안내 배너(role=alert). 무음 실패를 없애기 위한 표면 — 특히 카카오톡 인앱 브라우저
 * 컨텍스트 분리로 "돌아왔는데 로그인이 안 되는" 경우를 사용자에게 설명한다. warning 톤(하드 에러 아님).
 */
export const FailureNotice = styled.div`
  margin: 0 0 ${space[4]};
  padding: ${space[3]};
  border: 1px solid ${color.warning};
  border-radius: ${radius.md};
  background: ${color.warningSurface};
  color: ${color.text};
  font-size: ${font.size.sm};
  line-height: ${font.leading.normal};
`;

export const FailureTitle = styled.strong`
  display: block;
  margin-bottom: ${space[1]};
  font-weight: ${font.weight.semibold};
`;

/** 프로바이더 버튼 세로 스택. 버튼 자체는 공용 `SocialLoginButton`(브랜드 규정색·로고·카피). */
export const ProviderList = styled.div`
  display: grid;
  gap: ${space[2]};
`;
