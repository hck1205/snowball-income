import styled from '@emotion/styled';
import {
  PICK_RADIUS,
  brandPanel,
  cardElevation,
  color,
  font,
  heroTitleFontSize,
  radius,
  space
} from '@/shared/styles';

/* ==========================================================================
   로그인 게이트 — 반전 헤드 + 흰 바디의 한 장짜리 카드
   구 게이트는 점선 파스텔 상자 아래 버튼 셋이 떠 있는 형태라 "카드"로 읽히지 않았다.
   ========================================================================== */

export const GateWrap = styled.div`
  max-width: 460px;
  margin: clamp(${space[6]}, 6vw, ${space[12]}) auto 0;
`;

/**
 * 🔴 자매 게이트 셋(프로필·내가 쓴 글·글쓰기)과 같은 값. 2026-08-03 에 셋 다
 * `border` + `elevation[2]` 동시 선언을 걷어내고 `raised` 한 수단으로 정리했다
 * (근거는 `surfaces.ts` 의 cardElevation).
 */
export const GateCard = styled.div`
  ${cardElevation('raised')}
  border-radius: ${PICK_RADIUS};
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

export const GateGlyph = styled.span`
  display: inline-grid;
  place-items: center;
  /* 배지:마크 = 2:1 — 원장 로그인 관문(48/24)과 같은 비례라 두 관문이 한 벌로 읽힌다. */
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

/** 프로바이더 버튼 세로 스택. 버튼 자체는 공용 SocialLoginButton(브랜드 규정색·로고·카피). */
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
