import styled from '@emotion/styled';
import { DATA_RADIUS, PICK_RADIUS, brandPanel, color, font, media, radius, space } from '@/shared/styles';

/* ==========================================================================
   로딩 — 구 화면은 점선 상자 안 글자 한 줄이었다. 이제 들어올 화면의 골격을 미리 세운다.
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

/** 자리표시 블록 — 흰 `BootBody` 위에서 sunken(1.11)은 얇아 `border`(1.49)로 올렸다(자매 화면과 동일). */
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
