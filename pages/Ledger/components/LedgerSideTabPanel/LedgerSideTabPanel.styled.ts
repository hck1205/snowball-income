import styled from '@emotion/styled';
import { color, font, radius, space } from '@/shared/styles';

/**
 * 옆탭 패널 — `자산` · `투자` · `분류 규칙`.
 *
 * 🔴 **손익색 금지 · 색 단독 채널 금지.** 순자산이 음수인 달도 막대 색을 바꾸지 않고,
 *    `-3,000,000원` 이라는 **글자**와 `부채가 더 많은 달` 이라는 표시로 말한다.
 */

export const PanelBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${space[4]};
  min-width: 0;
`;

export const HeadLine = styled.p`
  margin: 0;
  font-size: ${font.size.sm};
  color: ${color.textMuted};
`;

/** 최근 순자산 — 이 패널의 한 숫자. */
export const NetWorthValue = styled.strong`
  display: block;
  font-size: clamp(${font.size.xl}, 4vw, ${font.size['3xl']});
  font-weight: ${font.weight.extrabold};
  letter-spacing: -0.02em;
  color: ${color.text};
  font-variant-numeric: tabular-nums;
`;

export const TrendList = styled.ul`
  display: flex;
  flex-direction: column;
  gap: ${space[2]};
  margin: 0;
  padding: 0;
  list-style: none;
`;

export const TrendRow = styled.li`
  display: grid;
  grid-template-columns: minmax(5rem, auto) minmax(0, 1fr) auto;
  align-items: center;
  gap: ${space[2]};
  min-width: 0;
`;

export const TrendMonth = styled.span`
  font-size: ${font.size.sm};
  color: ${color.textMuted};
  white-space: nowrap;
`;

export const TrendTrack = styled.span`
  display: block;
  height: 0.5rem;
  border-radius: ${radius.pill};
  background: ${color.surfaceSunken};
  overflow: hidden;
`;

/**
 * 막대. 🔴 **음수여도 색이 같다** — 손익색 금지. 길이만 크기를 말하고, 부호는 옆의 숫자가 말한다.
 */
export const TrendFill = styled.span`
  display: block;
  height: 100%;
  border-radius: ${radius.pill};
  background: ${color.brand};
`;

export const TrendValue = styled.span`
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  color: ${color.text};
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
`;

/** 부채가 더 많은 달임을 **글자로** 말한다. */
export const NegativeMark = styled.span`
  margin-left: ${space[1]};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.medium};
  color: ${color.textMuted};
`;

export const EmptyNote = styled.p`
  margin: 0;
  padding: ${space[4]};
  border-radius: ${radius.md};
  background: ${color.surfaceSunken};
  font-size: ${font.size.sm};
  line-height: 1.6;
  color: ${color.textMuted};
  text-align: center;
`;

export const SrOnly = styled.span`
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
