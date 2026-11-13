import styled from '@emotion/styled';
import { Link } from 'react-router-dom';
import { CHART_SERIES_VARS, color, font, media, radius, space } from '@/shared/styles';

/**
 * 은퇴 후 월 소득(2026-11-13). 세금 계산기와 같은 골격(읽는 폭 960px · 패널 · 공용 InputField 치수)을 따른다.
 *   - 입력은 네 묶음(은퇴 계획 · 국민연금 · 연금계좌 · 배당). 묶음 제목이 두 열을 가로지른다.
 *   - 결과는 **나이 구간 한 줄 = 고정 열**(나이 · 막대 · 합계). 좁은 폭에서는 나이가 위로 올라간다.
 *   - 막대는 세 수입원을 쌓고, 목표 생활비 위치를 세로선으로 긋는다 — "얼마나 모자라나"가 길이로 보인다.
 */
export const SOURCE_COLOR = {
  nps: CHART_SERIES_VARS[0],
  account: CHART_SERIES_VARS[1],
  dividend: CHART_SERIES_VARS[2]
} as const;

export const Stack = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${space[5]};
  width: 100%;
  max-width: 960px;
  margin: 0 auto;
  padding-bottom: ${space[7]};
`;

export const Panel = styled.section`
  display: grid;
  gap: ${space[4]};
  padding: clamp(${space[4]}, 3vw, ${space[6]});
  border: 1px solid ${color.border};
  border-radius: ${radius.lg};
  background: ${color.surface};
`;

export const PanelTitle = styled.h2`
  margin: 0;
  font-size: ${font.size.lg};
  font-weight: ${font.weight.bold};
  color: ${color.text};
`;

export const FormGrid = styled.div`
  display: grid;
  gap: ${space[4]};
  align-items: start;

  ${media.up('mobileWide')} {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    column-gap: ${space[5]};
  }
`;

/** 입력 묶음 제목 — 두 열을 가로지르고, 첫 묶음이 아니면 위에 구분선. */
export const GroupTitle = styled.h3`
  grid-column: 1 / -1;
  margin: 0;
  padding-top: ${space[2]};
  font-size: ${font.size.base};
  font-weight: ${font.weight.bold};
  color: ${color.text};

  &:not(:first-of-type) {
    margin-top: ${space[2]};
    padding-top: ${space[4]};
    border-top: 1px solid ${color.border};
  }
`;

export const Legend = styled.ul`
  display: flex;
  flex-wrap: wrap;
  gap: ${space[2]} ${space[4]};
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: ${font.size.sm};
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
  font-size: ${font.size.sm};
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
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  color: ${({ tone }) => (tone === 'short' ? color.accentText : color.brandText)};
  white-space: nowrap;
`;

export const StatusBadge = styled('span', { shouldForwardProp: (prop) => prop !== 'tone' })<{ tone: 'ok' | 'warn' }>`
  justify-self: start;
  display: inline-flex;
  align-items: center;
  padding: 2px ${space[2]};
  border-radius: ${radius.pill};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.bold};
  border: 1px solid ${({ tone }) => (tone === 'warn' ? color.accentBorder : color.brandBorder)};
  background: ${({ tone }) => (tone === 'warn' ? color.accentSubtle : color.brandSubtle)};
  color: ${({ tone }) => (tone === 'warn' ? color.accentText : color.brandText)};
`;

export const Note = styled.p`
  margin: 0;
  font-size: ${font.size.sm};
  line-height: ${font.leading.normal};
  color: ${color.textSecondary};
`;

export const Strong = styled.p`
  margin: 0;
  font-size: ${font.size.base};
  font-weight: ${font.weight.semibold};
  color: ${color.text};
`;

export const LinkRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${space[2]} ${space[3]};
`;

export const SecondaryLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  padding: 0 ${space[4]};
  border: 1px solid ${color.border};
  border-radius: ${radius.pill};
  color: ${color.text};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  text-decoration: none;

  &:hover {
    border-color: ${color.borderStrong};
  }
`;

export const Footnotes = styled.ul`
  display: grid;
  gap: ${space[2]};
  margin: 0;
  padding: ${space[4]} ${space[4]} ${space[4]} ${space[6]};
  border-radius: ${radius.md};
  background: ${color.surfaceSunken};
  font-size: ${font.size.sm};
  line-height: ${font.leading.normal};
  color: ${color.textSecondary};
`;
