import styled from '@emotion/styled';
import { CHART_SERIES_VARS, color, font, media, radius, space } from '@/shared/styles';

/**
 * 나이별 월 소득 — **나이 구간 한 줄 = 고정 열**(나이 · 막대 · 합계). 좁은 폭에서는 나이가 위로 올라간다.
 * 막대는 세 수입원을 쌓고, 목표 생활비 위치를 세로선으로 긋는다 — "얼마나 모자라나"가 길이로 보인다.
 */
export const SOURCE_COLOR = {
  nps: CHART_SERIES_VARS[0],
  account: CHART_SERIES_VARS[1],
  dividend: CHART_SERIES_VARS[2]
} as const;

export const Legend = styled.ul`
  display: flex;
  flex-wrap: wrap;
  gap: ${space[2]} ${space[4]};
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: ${font.size.md};
  color: ${color.textSecondary};
`;

export const LegendItem = styled.li`
  display: inline-flex;
  align-items: center;
  gap: ${space[2]};
`;

export const Swatch = styled.span<{ tone: string }>`
  width: 12px;
  height: 12px;
  flex: none;
  border-radius: 3px;
  background: ${({ tone }) => tone};
`;

export const StageList = styled.ol`
  display: grid;
  gap: ${space[2]};
  margin: 0;
  padding: 0;
  list-style: none;
`;

export const StageRow = styled.li`
  display: grid;
  grid-template-columns: 88px minmax(0, 1fr) 150px;
  grid-template-areas: 'age body side';
  align-items: center;
  gap: ${space[3]} ${space[4]};
  padding: ${space[3]} ${space[4]};
  border: 1px solid ${color.border};
  border-radius: ${radius.md};
  background: ${color.surface};

  /* 좁은 폭: 윗줄 = 나이 · 합계, 아랫줄 = 막대(전체 폭). 칸은 이름으로 고른다 — 순서 선택자(nth-of-type)는
     요소 종류별로 세서 엉뚱한 칸을 옮겼다(2026-11-13 실물 확인). */
  ${media.down('mobileWide')} {
    grid-template-columns: minmax(0, 1fr) auto;
    grid-template-areas:
      'age side'
      'body body';
  }
`;

export const StageAge = styled.strong`
  grid-area: age;
  white-space: nowrap;
  font-size: ${font.size.lg};
  font-weight: ${font.weight.extrabold};
  color: ${color.text};
  ${font.numeric};
`;

export const StageBody = styled.div`
  grid-area: body;
  display: grid;
  gap: ${space[2]};
  min-width: 0;
`;

/** 쌓은 막대 + 목표선. 막대 칸의 기준 폭 = max(목표, 가장 큰 합계). */
export const Bar = styled.div`
  position: relative;
  display: flex;
  height: 14px;
  border-radius: ${radius.pill};
  background: ${color.surfaceSunken};
  overflow: visible;
`;

export const BarSegment = styled.span<{ tone: string; share: number }>`
  width: ${({ share }) => `${share * 100}%`};
  background: ${({ tone }) => tone};

  &:first-of-type {
    border-radius: ${radius.pill} 0 0 ${radius.pill};
  }
`;

export const TargetLine = styled.span<{ at: number }>`
  position: absolute;
  top: -4px;
  bottom: -4px;
  left: ${({ at }) => `${at * 100}%`};
  width: 2px;
  background: ${color.text};
`;

export const Breakdown = styled.p`
  margin: 0;
  font-size: ${font.size.md};
  line-height: ${font.leading.normal};
  color: ${color.textSecondary};
  ${font.numeric};
`;

export const StageSide = styled.div`
  grid-area: side;
  display: grid;
  justify-items: end;
  gap: 2px;
  text-align: right;
  ${font.numeric};
`;

export const StageTotal = styled.strong`
  font-size: ${font.size.xl};
  font-weight: ${font.weight.extrabold};
  color: ${color.text};
  white-space: nowrap;
`;

export const GapText = styled.span<{ tone: 'short' | 'ok' }>`
  font-size: ${font.size.base};
  font-weight: ${font.weight.semibold};
  color: ${({ tone }) => (tone === 'short' ? color.accentText : color.brandText)};
  white-space: nowrap;
`;

export const Warning = styled.p`
  margin: 0;
  font-size: ${font.size.base};
  font-weight: ${font.weight.semibold};
  color: ${color.text};
`;
