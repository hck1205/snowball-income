import styled from '@emotion/styled';
import {
  PICK,
  PICK_RADIUS,
  cardElevation,
  color,
  font,
  radius,
  sectionTitleFontSize,
  space,
  surface
} from '@/shared/styles';

/* 여러 섹션이 함께 쓰는 조각 — 고르는 면·면 머리·종목 색 점·빈 안내·보조 설명. */

export const VisuallyHidden = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
`;

export const PickSurface = styled.section`
  ${cardElevation('base')}
  ${surface(PICK_RADIUS, PICK.pad)}
  display: grid;
  gap: ${space[4]};
  min-width: 0;
`;

export const SurfaceHead = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: ${space[3]};
  min-width: 0;
`;

export const SurfaceTitle = styled.h2`
  margin: 0;
  color: ${color.text};
  font-size: ${sectionTitleFontSize};
  font-weight: ${font.weight.bold};
  letter-spacing: -0.01em;
`;

export const SurfaceCount = styled.p`
  margin: 0;
  color: ${color.textSecondary};
  font-family: ${font.dataNumeric};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  white-space: nowrap;
  ${font.numeric}
`;

/** 종목 색 점. 채움 = 보유, 테두리만 = 미보유. 뜻은 늘 낭독 문구가 함께 진다. */
export const SeriesDot = styled.span<{ $series: string; $off?: boolean }>`
  display: inline-block;
  flex: none;
  width: 10px;
  height: 10px;
  border-radius: ${radius.pill};
  background: ${({ $series, $off }) => ($off ? 'transparent' : $series)};
  box-shadow: ${({ $off }) => ($off ? `inset 0 0 0 1.5px ${color.borderStrong}` : 'none')};
`;

export const EmptyNote = styled.p`
  margin: 0;
  color: ${color.textMuted};
  font-size: ${font.size.sm};
  line-height: ${font.leading.snug};
`;

export const SectionHint = styled.p`
  margin: ${space[3]} 0 0;
  color: ${color.textSecondary};
  font-size: ${font.size.xs};
  line-height: ${font.leading.normal};
`;
