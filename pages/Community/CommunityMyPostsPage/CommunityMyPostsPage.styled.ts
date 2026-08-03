import styled from '@emotion/styled';
import { Link } from 'react-router-dom';
import {
  DATA_RADIUS,
  PICK_RADIUS,
  brandPanel,
  cardElevation,
  color,
  font,
  heroTitleFontSize,
  media,
  motion,
  radius,
  space
} from '@/shared/styles';

/* ==========================================================================
   계정 콘솔 셸 — 프로필 설정과 **같은 골격**이다.
   --------------------------------------------------------------------------
   두 화면은 프로필 드롭다운에서 이웃한 형제이고 성격도 같다(내 계정). 그래서 좌측 네이비
   레일 + 우측 작업 영역이라는 한 골격을 공유하고, 레일의 aria-current 만 다르다.

   ⚠ 값은 CommunityProfilePage.styled.ts 와 같지만 **각 페이지가 자기 스타일을 소유**한다 —
     페이지 styled 파일을 가로질러 import 하지 않는 이 레포 관례를 그대로 따른다.
   ========================================================================== */

export const ConsoleRoot = styled.div`
  max-width: 1040px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: clamp(${space[5]}, 3vw, ${space[8]});
  align-items: start;

  ${media.up('layout')} {
    grid-template-columns: minmax(240px, 300px) minmax(0, 1fr);
  }
`;

export const TopBarSlot = styled.div`
  ${media.up('layout')} {
    grid-column: 1 / -1;
  }
`;

export const IdentityRail = styled.aside`
  ${brandPanel()}
  border-radius: ${PICK_RADIUS};
  padding: clamp(${space[5]}, 2.4vw, ${space[7]});
  display: grid;
  gap: ${space[4]};
`;

export const RailGlyph = styled.span`
  display: inline-grid;
  place-items: center;
  width: 56px;
  height: 56px;
  border-radius: ${radius.lg};
  color: ${color.onPanelGold};
  border: 1px solid color-mix(in srgb, ${color.onPanelGold} 34%, transparent);
  background: color-mix(in srgb, ${color.onPanelGold} 10%, transparent);
`;

export const RailEyebrow = styled.p`
  margin: 0;
  color: ${color.onPanelGold};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.bold};
  letter-spacing: 0.14em;
  text-transform: uppercase;
`;

export const RailTitle = styled.h1`
  margin: ${space[1]} 0 0;
  color: ${color.onPanel};
  font-family: ${font.display};
  font-size: ${heroTitleFontSize};
  font-weight: ${font.weight.bold};
  line-height: ${font.leading.tight};
  letter-spacing: -0.02em;
  word-break: keep-all;
`;

export const RailLead = styled.p`
  margin: ${space[2]} 0 0;
  color: ${color.onPanelMuted};
  font-size: ${font.size.sm};
  line-height: ${font.leading.relaxed};
  word-break: keep-all;
`;

export const RailDivider = styled.hr`
  height: 1px;
  margin: 0;
  border: 0;
  background: color-mix(in srgb, ${color.onPanelGold} 32%, transparent);
`;

export const RailNav = styled.nav`
  display: grid;
  gap: ${space[1]};
`;

export const RailNavLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: ${space[2]};
  min-height: 44px;
  padding: 0 ${space[3]};
  border-radius: ${radius.md};
  border-left: 3px solid transparent;
  color: ${color.onPanelMuted};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  text-decoration: none;
  transition:
    background-color ${motion.fast} ${motion.ease},
    color ${motion.fast} ${motion.ease};

  &:hover {
    background: color-mix(in srgb, ${color.onPanel} 10%, transparent);
    color: ${color.onPanel};
  }

  &:focus-visible {
    outline: 2px solid ${color.onPanelGold};
    outline-offset: 2px;
  }

  &[aria-current='page'] {
    background: color-mix(in srgb, ${color.onPanel} 14%, transparent);
    border-left-color: ${color.onPanelGold};
    color: ${color.onPanel};
    font-weight: ${font.weight.bold};
  }
`;

export const ConsoleBody = styled.div`
  display: grid;
  gap: clamp(${space[4]}, 2vw, ${space[5]});
  min-width: 0;
`;

/* ==========================================================================
   로그인 게이트 — 프로필 설정과 같은 형태(반전 헤드 + 흰 바디).
   ========================================================================== */

export const GateWrap = styled.div`
  max-width: 460px;
  margin: clamp(${space[6]}, 6vw, ${space[12]}) auto 0;
`;

/**
 * 🔴 자매 게이트 셋(글쓰기·프로필·내가 쓴 글)과 **같은 값**이다. 2026-08-03 에 셋 다
 * `border` + `elevation[2]` 동시 선언을 걷어내고 `raised` 한 수단으로 정리했다
 * (근거는 `surfaces.ts` 의 cardElevation — 흰 캔버스에서 두 수단이 겹치면 윤곽이 두 겹이 된다).
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

/* ==========================================================================
   세션 확인 중 — 들어올 화면의 골격을 미리 세운다.
   ========================================================================== */

export const BootWrap = styled.div`
  max-width: 1040px;
  margin: 0 auto;
  display: grid;
  gap: clamp(${space[5]}, 3vw, ${space[8]});
  align-items: start;

  ${media.up('layout')} {
    grid-template-columns: minmax(240px, 300px) minmax(0, 1fr);
  }
`;

export const BootRail = styled.div`
  ${brandPanel()}
  border-radius: ${PICK_RADIUS};
  padding: clamp(${space[5]}, 2.4vw, ${space[7]});
  display: grid;
  gap: ${space[4]};
  justify-items: start;
`;

export const BootRailBar = styled.span<{ w: string; h: string }>`
  display: block;
  width: ${({ w }) => w};
  height: ${({ h }) => h};
  border-radius: ${radius.sm};
  background: color-mix(in srgb, ${color.onPanel} 18%, transparent);
`;

export const BootBody = styled.div`
  display: grid;
  gap: ${space[4]};
  padding: clamp(${space[5]}, 2.2vw, ${space[7]});
  border-radius: ${DATA_RADIUS};
  border: 1px solid ${color.border};
  background: ${color.surface};
`;

/** 자리표시 블록 — 흰 `BootBody` 위에서 sunken(1.11)은 얇아 `border`(1.49)로 올렸다. */
export const BootBar = styled.span<{ w: string; h: string }>`
  display: block;
  width: ${({ w }) => w};
  height: ${({ h }) => h};
  border-radius: ${radius.sm};
  background: ${color.border};
`;

export const BootStatus = styled.p`
  margin: 0;
  color: ${color.textMuted};
  font-size: ${font.size.sm};
`;
