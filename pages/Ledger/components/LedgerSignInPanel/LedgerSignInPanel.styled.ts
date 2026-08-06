import styled from '@emotion/styled';
import { color, font, media, radius, space } from '@/shared/styles';

/**
 * 앱 로그인 게이트.
 *
 * ## 무대와 어떻게 다른가 (2026-08-03)
 * 연결 무대(`LedgerConnectPanel`)는 네이비 반전 면이고 여기는 **밝은 중립 면**이다. 일부러 가른다 —
 * 두 화면은 사용자가 연달아 보는 두 관문인데 같은 무게로 서면 "로그인했는데 왜 또?"라는 이 화면의
 * 가장 큰 혼란이 더 커진다. 신원 확인(여기)은 가볍게 지나가고, 시트 권한(무대)이 무겁게 선다.
 *
 * 예전 구조는 제목 + 문장 + 버튼 세 개의 민짜 스택이었다. 지금은 **글리프 배지 + 큰 제목 + 문장**의
 * 카드 한 장이고, 제공자 버튼은 그 안에서 자기 블록을 갖는다.
 */
export const SignInSection = styled.section`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  justify-items: start;
  gap: ${space[4]};
  min-width: 0;
  max-width: 560px;
  padding: clamp(24px, 4vw, 36px);
  border: 1px solid ${color.border};
  border-radius: ${radius.xl};
  background: ${color.surface};
`;

/** 신원 확인임을 형태로 말하는 배지. 폭 48px 이라 면 예산과 무관하다. */
export const SignInGlyph = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: ${radius.md};
  border: 1px solid ${color.identityBorder};
  color: ${color.identityText};
`;

export const SignInHeading = styled.h2`
  margin: 0;
  max-width: 20ch;
  font-size: clamp(${font.size.xl}, 2.8vw, ${font.size['3xl']});
  font-weight: ${font.weight.extrabold};
  line-height: ${font.leading.tight};
  letter-spacing: -0.02em;
  color: ${color.text};
`;

/** 설명문. 한글 산문이라 overflow-wrap 을 건드리지 않는다(줄바꿈은 브라우저 기본에 맡긴다). */
export const SignInBody = styled.p`
  margin: 0;
  max-width: 52ch;
  font-size: ${font.size.md};
  line-height: ${font.leading.normal};
  color: ${color.textSecondary};
`;

/**
 * 제공자 버튼 스택. 버튼 자체는 공용 `SocialLoginButton`(3사 규정색·로고·정본 카피)이라
 * 여기서 색·라벨을 다시 정의하지 않는다 — 규정 준수의 단일 출처를 쪼개지 않는다.
 *
 * 위에 가로선을 하나 두어 "설명은 여기까지, 아래가 고르는 자리"를 형태로 가른다.
 */
export const SignInButtons = styled.div`
  display: grid;
  gap: ${space[2]};
  width: 100%;
  min-width: 0;
  padding-top: ${space[4]};
  border-top: 1px solid ${color.border};

  ${media.up('mobileWide')} {
    max-width: 380px;
  }
`;
