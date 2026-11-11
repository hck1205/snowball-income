import styled from '@emotion/styled';
import { Link } from 'react-router-dom';
import { color, font, media, motion, radius, shadow, space } from '@/shared/styles';
import type { HighlightSlotId } from './CommunityHighlights.types';

/**
 * 첫 화면 커뮤니티 칸(2026-11-11). 목표 카드·성향 테스트 **아래**에 선다 — 접힘 예산(목표 여섯) 밖이다.
 * 네 칸이 서로 다른 색 톤으로 "무슨 종류의 글인지"를 먼저 말한다. 색만이 아니라 라벨 글자가 함께 말한다.
 */

/** 칸별 톤 — 면·경계·글자. 새 색 토큰을 만들지 않고 기존 의미 색을 나눠 쓴다. */
const TONE: Record<HighlightSlotId, { readonly subtle: string; readonly border: string; readonly text: string }> = {
  portfolio: {
    subtle: color.brandSubtle,
    border: color.brandBorder,
    text: color.brandText
  },
  insight: {
    subtle: color.accentSubtle,
    border: color.accentBorder,
    text: color.accentText
  },
  question: {
    subtle: color.accentAltSubtle,
    border: color.accentAltBorder,
    text: color.accentAltText
  },
  video: {
    subtle: color.identitySubtle,
    border: color.identityBorder,
    text: color.identityText
  }
};

export const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${space[3]};
`;

export const SectionHead = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: ${space[3]};
`;

export const SectionTitle = styled.h2`
  margin: 0;
  font-size: ${font.size.xl};
  font-weight: ${font.weight.bold};
  letter-spacing: -0.01em;
  color: ${color.text};
`;

export const SectionMore = styled(Link)`
  flex: none;
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  color: ${color.brandText};
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

export const Grid = styled.div`
  display: grid;
  gap: ${space[3]};

  ${media.up('mobileWide')} {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

export const Card = styled(Link, {
  shouldForwardProp: (prop) => prop !== 'slot' && prop !== 'empty'
})<{
  slot: HighlightSlotId;
  empty?: boolean;
}>`
  display: flex;
  flex-direction: column;
  gap: ${space[2]};
  min-width: 0;
  padding: ${space[4]};
  border: 1px ${({ empty }) => (empty ? 'dashed' : 'solid')} ${({ slot }) => TONE[slot].border};
  border-radius: ${radius.lg};
  background: ${({ empty, slot }) => (empty ? TONE[slot].subtle : color.surface)};
  color: ${color.text};
  text-decoration: none;
  transition:
    transform ${motion.ease},
    box-shadow ${motion.ease};

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${shadow.e2};
  }
`;

export const SlotLabel = styled('span', {
  shouldForwardProp: (prop) => prop !== 'slot'
})<{ slot: HighlightSlotId }>`
  display: inline-flex;
  align-items: center;
  gap: ${space[1]};
  align-self: flex-start;
  padding: 2px ${space[2]};
  border-radius: ${radius.pill};
  background: ${({ slot }) => TONE[slot].subtle};
  color: ${({ slot }) => TONE[slot].text};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
`;

export const Thumb = styled.span`
  display: block;
  overflow: hidden;
  border-radius: ${radius.md};
  aspect-ratio: 16 / 9;
  background: ${color.surfaceSunken};

  /* 넓은 화면에서 16:9 를 그대로 두면 이 카드만 다른 카드의 두 배 키가 된다 — 높이에 상한을 둔다. */
  ${media.up('mobileWide')} {
    aspect-ratio: auto;
    height: 160px;
  }

  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

export const CardTitle = styled.span`
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  font-size: ${font.size.lg};
  font-weight: ${font.weight.bold};
  line-height: ${font.leading.snug};
`;

export const Excerpt = styled.span`
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  font-size: ${font.size.sm};
  line-height: ${font.leading.normal};
  color: ${color.textSecondary};
`;

export const Stat = styled.span`
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  color: ${color.brandText};
  ${font.numeric};
`;

export const Meta = styled.span`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${space[2]};
  margin-top: auto;
  font-size: ${font.size.xs};
  color: ${color.textMuted};
  ${font.numeric};
`;

export const MetaStat = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 2px;
`;
