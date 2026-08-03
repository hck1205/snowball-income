import styled from '@emotion/styled';
import { Link } from 'react-router-dom';
import {
  PICK_RADIUS,
  brandPanel,
  color,
  font,
  heroTitleFontSize,
  media,
  motion,
  radius,
  space
} from '@/shared/styles';

/* ── 콘솔 셸(좌 레일 + 우 작업 영역) ───────────────────────────────────────── */

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

/** 상단 바("← 목록")는 콘솔 전체 폭을 쓴다 — 레일 안에 들어가면 되돌아가기가 숨는다. */
export const TopBarSlot = styled.div`
  ${media.up('layout')} {
    grid-column: 1 / -1;
  }
`;

/* ── 아이덴티티 레일 (brand 면 · 이 화면의 유일한 반전 면) ─────────────────── */

export const IdentityRail = styled.aside`
  ${brandPanel()}
  border-radius: ${PICK_RADIUS};
  padding: clamp(${space[5]}, 2.4vw, ${space[7]});
  display: grid;
  gap: ${space[4]};
`;

/** 하마 글리프 자리. 금색은 이 네이비 면 위에서만 합법이다(밝은 면 위 1.83:1). */
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

/** 화면 이름 = h1. 레일이 제목을 진다 — 작업 영역은 곧바로 내용으로 시작한다. */
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

/** 금색 헤어라인 — 이 면 위에서만 존재할 수 있는 구분선. */
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

/**
 * 두 자매 화면(프로필 설정 ↔ 내가 쓴 글)의 전환. 현재 화면은 aria-current 로 말하고,
 * 시각적으로도 금색 좌측 표식 + 굵기로 말한다(색 단독 채널 금지).
 */
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
