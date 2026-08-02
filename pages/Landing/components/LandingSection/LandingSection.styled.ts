import styled from '@emotion/styled';
import { color, font, iconOpticalAlign, media, radius, sectionTitleFontSize, space } from '@/shared/styles';
import type { LandingSectionEmphasis, LandingSectionTone } from './LandingSection.types';

/**
 * 랜딩 8섹션이 **같은 머리**를 갖게 하는 껍데기.
 *
 * 섹션마다 제목 크기·배지 크기를 각자 정하면 한 문서 안에서 위계가 여섯 갈래로 갈린다.
 * 제목 크기는 전 페이지 공통 규칙(sectionTitleFontSize, clamp 16~18px)을 그대로 따른다 —
 * 섹션마다 다른 축소 곡선을 만들지 마라(decisions.md 2026-07-29).
 *
 * 이 껍데기는 **면을 만들지 않는다.** 랜딩의 틴트 면은 정확히 2개(히어로 그라디언트 + 시작 준비
 * 카드의 wash)이고, 섹션 머리가 색을 쓰는 자리는 36px 배지 하나뿐이다.
 */

/** 배지 톤 — 전부 대비가 검증된 토큰 쌍이다. 파생 면(color-mix) 위에 글리프를 얹지 않는다. */
const TONE = {
  identity: { bg: color.identitySubtle, fg: color.identityText },
  accent: { bg: color.accentSubtle, fg: color.accentText },
  accentAlt: { bg: color.accentAltSubtle, fg: color.accentAltText },
  neutral: { bg: color.surfaceSunken, fg: color.textSecondary }
} as const satisfies Record<LandingSectionTone, { bg: string; fg: string }>;

export const SectionRoot = styled.section`
  display: grid;
  gap: clamp(12px, 2vw, 20px);
  min-width: 0;
`;

/**
 * 🔴 등급 B(chapter)만 제목 아래 2px 페이지 hue 룰을 갖는다 — 이것이 이 문서에서 "본론"을 말하는
 * 유일한 구조 장치다. 2px 이라 tintscan 의 면 하한(높이 8px)에 걸리지 않고, border 는
 * backgroundColor 만 보는 스캐너의 대상이 아니다(이중 안전).
 *
 * 색이 유일한 신호가 아니다 - 섹션 제목 자체와 그룹 여백이 같은 것을 말한다.
 */
export const SectionHead = styled.div<{ $emphasis: LandingSectionEmphasis }>`
  display: flex;
  align-items: center;
  gap: ${space[3]};
  min-width: 0;
  ${({ $emphasis }) =>
    $emphasis === 'chapter' ? `padding-bottom: ${space[3]}; border-bottom: 2px solid ${color.identity};` : ''}
`;

/**
 * 36px 배지. 틴트 면 하한(180px)에 한참 못 미치므로 tintscan 의 "면" 집계에 잡히지 않는다 —
 * 랜딩의 채도는 면이 아니라 이런 글리프들이 만든다.
 */
export const SectionBadge = styled.span<{ $tone: LandingSectionTone }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: ${radius.md};
  background: ${({ $tone }) => TONE[$tone].bg};
  color: ${({ $tone }) => TONE[$tone].fg};
  /* 오른쪽 제목이 헤딩 서체라 잉크 중심이 라인박스 중심보다 위에 있다 — 정본 유틸로 보정한다.
     제목 크기를 넘긴다(배지 자신의 em 이 아니다). */
  ${iconOpticalAlign('display', sectionTitleFontSize)}

  svg {
    display: block;
    width: 18px;
    height: 18px;
  }
`;

export const SectionTitle = styled.h2`
  margin: 0;
  min-width: 0;
  font-family: ${font.display};
  font-size: ${sectionTitleFontSize};
  font-weight: ${font.weight.bold};
  line-height: ${font.leading.snug};
  letter-spacing: -0.02em;
  color: ${color.text};
  word-break: keep-all;
`;

export const SectionLede = styled.p`
  margin: 0;
  max-width: 68ch;
  font-family: ${font.sans};
  font-size: ${font.size.sm};
  line-height: ${font.leading.relaxed};
  color: ${color.textSecondary};
  word-break: keep-all;

  ${media.down('mobileWide')} {
    font-size: ${font.size.xs};
  }
`;
