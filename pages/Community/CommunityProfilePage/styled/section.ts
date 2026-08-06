import styled from '@emotion/styled';
import { DATA_RADIUS, color, font, radius, sectionTitleFontSize, space } from '@/shared/styles';

/* ── 작업 영역 ─────────────────────────────────────────────────────────────── */

export const ConsoleBody = styled.div`
  display: grid;
  gap: clamp(${space[5]}, 2.4vw, ${space[7]});
  min-width: 0;
`;

/**
 * 편집 카드 = 읽고 쓰는 면(data). 색면을 얹지 않고 **좌측 4px 액센트 귀**(L1)로만 말한다 —
 * 이 화면의 색 예산 2면은 레일과 위험 영역이 이미 쓴다.
 */
export const Section = styled.section`
  position: relative;
  display: grid;
  gap: ${space[5]};
  padding: clamp(${space[5]}, 2.2vw, ${space[7]});
  padding-left: calc(clamp(${space[5]}, 2.2vw, ${space[7]}) + 4px);
  border-radius: ${DATA_RADIUS};
  border: 1px solid ${color.border};
  background: ${color.surface};
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    inset: 0 auto 0 0;
    width: 4px;
    background: ${color.accent};
  }
`;

export const SectionHead = styled.div`
  display: flex;
  align-items: center;
  gap: ${space[3]};
  min-width: 0;
`;

export const SectionGlyph = styled.span`
  display: inline-grid;
  place-items: center;
  flex: 0 0 auto;
  width: 36px;
  height: 36px;
  border-radius: ${radius.md};
  color: ${color.accentText};
  background: color-mix(in srgb, ${color.accent} 12%, ${color.surface});
`;

export const SectionTitle = styled.h2`
  margin: 0;
  color: ${color.text};
  font-family: ${font.display};
  font-size: ${sectionTitleFontSize};
  font-weight: ${font.weight.bold};
  letter-spacing: -0.01em;
`;
