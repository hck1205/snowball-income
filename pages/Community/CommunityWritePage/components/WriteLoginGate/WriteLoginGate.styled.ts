import styled from '@emotion/styled';
import {
  PICK_RADIUS,
  brandPanel,
  color,
  elevation,
  font,
  heroTitleFontSize,
  radius,
  space
} from '@/shared/styles';

/**
 * 비로그인 게이트 — **반전 헤드 + 흰 바디의 한 장짜리 카드.**
 *
 * 🔴 이 조판은 프로필(`/community/profile`)·내가 쓴 글(`/community/my-posts`) 게이트와 **같은 벌**이다.
 * 세 화면 다 "로그인해야 이 화면을 쓸 수 있다"는 같은 말을 하는데 모양이 서로 다르면, 사용자는 같은
 * 사실을 매번 새로 읽어야 하고 앱은 화면마다 다른 제품처럼 보인다(2026-08-03 일관성 점검에서 교정).
 * 종전에는 흰 카드 안에 파스텔 상자가 한 겹 더 들어 있는 **카드 안 카드**였고, 마스코트도
 * "로그인 수단" 라벨도 각주도 없었다.
 *
 * ⚠ 페이지 폴더 간 styled import 는 레포 관례상 금지라 같은 조판을 여기서 다시 선언한다
 * (`.cursor/rules` §2·§8 — 외부에서는 폴더 경로로만 import). 세 벌이 더 굳으면 공용으로 올린다.
 *
 * ⚠ 금색(`onPanelGold`)은 `brandPanel()` 이 깐 네이비 면 위에서만 합법이다 — 아래 헤드 안쪽이 그 자리다.
 * ⚠ 색면 예산: 이 화면의 유일한 면이 파스텔 상자에서 이 네이비 헤드로 **자리를 옮겼을 뿐**이다(1 → 1).
 */
export const GateWrap = styled.div`
  max-width: 460px;
  margin: clamp(${space[6]}, 6vw, ${space[12]}) auto 0;
`;

export const GateCard = styled.div`
  border-radius: ${PICK_RADIUS};
  border: 1px solid ${color.border};
  background: ${color.surface};
  box-shadow: ${elevation[2]};
  overflow: hidden;
`;

export const GateHead = styled.div`
  ${brandPanel()}
  display: grid;
  justify-items: center;
  gap: ${space[3]};
  padding: clamp(${space[6]}, 5vw, ${space[10]}) ${space[5]};
  text-align: center;
`;

/** 배지:마크 = 2:1 — 자매 게이트 두 곳, 그리고 가계부 로그인 관문(48/24)과 같은 비례다. */
export const GateGlyph = styled.span`
  display: inline-grid;
  place-items: center;
  width: 64px;
  height: 64px;
  border-radius: ${radius.pill};
  color: ${color.onPanelGold};
  border: 1px solid color-mix(in srgb, ${color.onPanelGold} 34%, transparent);
  background: color-mix(in srgb, ${color.onPanelGold} 10%, transparent);
`;

export const GateTitle = styled.h1`
  margin: 0;
  color: ${color.onPanel};
  font-family: ${font.display};
  font-size: ${heroTitleFontSize};
  font-weight: ${font.weight.bold};
  line-height: ${font.leading.tight};
  letter-spacing: -0.02em;
  word-break: keep-all;
`;

export const GateSubtitle = styled.p`
  margin: 0;
  max-width: 34ch;
  color: ${color.onPanelMuted};
  font-size: ${font.size.sm};
  line-height: ${font.leading.relaxed};
  word-break: keep-all;
`;

export const GateBody = styled.div`
  display: grid;
  gap: ${space[3]};
  padding: clamp(${space[5]}, 4vw, ${space[7]});
`;

export const GateBodyLabel = styled.p`
  margin: 0;
  color: ${color.textMuted};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.bold};
  letter-spacing: 0.12em;
  text-transform: uppercase;
`;

/** 프로바이더 버튼 세로 스택. 버튼 자체는 공용 `SocialLoginButton`(브랜드 규정색·로고·카피). */
export const GateButtons = styled.div`
  display: grid;
  gap: ${space[2]};
`;

export const GateFootnote = styled.p`
  margin: 0;
  color: ${color.textMuted};
  font-size: ${font.size.xs};
  line-height: ${font.leading.normal};
  word-break: keep-all;
`;
