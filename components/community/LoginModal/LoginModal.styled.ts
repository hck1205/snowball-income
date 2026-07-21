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

/**
 * **선제(pre-emptive) 인앱 브라우저 안내** — 모달이 열리는 즉시(실패 전에) 뜬다.
 * 실패 배너(warning 톤)와 구분하려고 brand 틴트로 두어 "먼저 이걸 하세요"라는 주 경로처럼 보이게 한다.
 * 자동 낭독이 잦으면 방해되므로 컴포넌트에서 role="status"(polite)로 붙인다 — alert 아님.
 */
export const InAppNotice = styled.section`
  margin: 0 0 ${space[4]};
  padding: ${space[3]};
  border: 1px solid ${color.brandBorder};
  border-radius: ${radius.md};
  background: ${color.brandSubtle};
  color: ${color.text};
  text-align: left;
  font-size: ${font.size.sm};
  line-height: ${font.leading.normal};
`;

export const InAppTitle = styled.strong`
  display: block;
  margin-bottom: ${space[1]};
  color: ${color.brandText};
  font-weight: ${font.weight.semibold};
`;

/** 현재 URL을 클립보드로 복사하는 버튼 — 외부 브라우저에 붙여넣어 열도록 유도한다. */
export const CopyLinkButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: ${space[1]};
  margin-top: ${space[3]};
  padding: ${space[2]} ${space[3]};
  border: 1px solid ${color.brand};
  border-radius: ${radius.md};
  background: ${color.brand};
  color: ${color.onBrand};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  cursor: pointer;

  &:hover {
    background: ${color.brandHover};
  }

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: 2px;
  }
`;

/** 링크 복사 결과 피드백(성공/실패). aria-live 로 조용히 낭독한다. */
export const CopyFeedback = styled.span`
  display: block;
  margin-top: ${space[2]};
  color: ${color.brandText};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.medium};
`;

/** 프로바이더 버튼 세로 스택. 버튼 자체는 공용 `SocialLoginButton`(브랜드 규정색·로고·카피). */
export const ProviderList = styled.div`
  display: grid;
  gap: ${space[2]};
`;
