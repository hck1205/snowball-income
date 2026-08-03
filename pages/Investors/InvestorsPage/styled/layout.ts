import styled from '@emotion/styled';
import { color, font, media, space } from '@/shared/styles';

/* ── 페이지 뼈대 · 섹션 머리 ──────────────────────────────────────────────── */

export const Stack = styled.div`
  display: grid;
  gap: clamp(24px, 3.6vw, 40px);
  min-width: 0;
`;

export const SectionHead = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: ${space[3]};
  min-width: 0;
  padding-bottom: ${space[3]};
  /* 🔴 제목을 카드 안에 넣지 않고 **밑줄 한 선** 위에 세운다 — 섹션이 카드가 아니라
     편집 지면의 단락으로 읽히고, 아래 타일·표가 그 단락의 내용이 된다. */
  border-bottom: 1px solid ${color.border};

  ${media.down('mobileWide')} {
    flex-direction: column;
    align-items: stretch;
  }
`;

/**
 * 섹션마다 **다른 축**의 귀를 단다 — 한 화면에 축이 순서대로 나타나 페이지를 마디로 나눈다.
 * 🔴 폭 3px 이라 면 판정(폭 ≥180px) 밖이다(L1). 색이 유일한 채널도 아니다(옆에 제목 글자가 있다).
 */
export type SectionAxis = 'accent' | 'accentAlt' | 'brand';

const SECTION_EAR: Record<SectionAxis, string> = {
  accent: color.accent,
  accentAlt: color.accentAlt,
  brand: color.brand
};

export const SectionHeading = styled.div<{ $axis: SectionAxis }>`
  display: grid;
  gap: ${space[1]};
  min-width: 0;
  padding-left: ${space[3]};
  border-left: 3px solid ${({ $axis }) => SECTION_EAR[$axis]};
`;

/**
 * 섹션 제목. 🔴 1차보다 **한 단 크고 훨씬 굵다** — 이 화면의 위계는 색이 아니라 크기 대비가 만든다
 * (`font.display` 는 Bold 한 벌만 실려 굵기로는 위계를 못 만든다 — tokens.ts 주석).
 */
export const SectionTitle = styled.h2`
  margin: 0;
  color: ${color.text};
  font-family: ${font.display};
  font-size: clamp(${font.size.xl}, 1.9vw, ${font.size['3xl']});
  font-weight: ${font.weight.extrabold};
  letter-spacing: -0.03em;
  line-height: ${font.leading.tight};
`;

export const SectionSubtitle = styled.p`
  margin: 0;
  max-width: 62ch;
  color: ${color.textSecondary};
  font-size: ${font.size.xs};
  line-height: ${font.leading.snug};
`;

/**
 * 블록 위의 **작은 표제**. 대문자 라벨 대신 자간을 벌린 한글 짧은 말로 쓴다 —
 * 본문(14px)과 제목(24px) 사이가 비면 위계가 두 단으로만 읽히는데, 이 11px 자간 라벨이
 * 세 번째 단을 만들어 준다.
 */
export const Eyebrow = styled.p`
  margin: 0;
  color: ${color.textMuted};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.bold};
  letter-spacing: 0.14em;
`;
