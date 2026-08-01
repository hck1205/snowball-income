import styled from '@emotion/styled';
import { color, font, motion, pressable, pressTransition, radius, space } from '@/shared/styles';

/*
 * 여기 있던 `TickerQuickAction*`(전폭 공유 툴바)은 2026-07-31 에 삭제됐다 — 공유는 드로어 마지막
 * "도구" 섹션으로 내려갔고 전폭을 쓰지 않는다(`SettingsToolsSection.styled.ts`).
 */

/**
 * 종목 섹션의 "추가" 버튼.
 *
 * 2026-07-31 강등: 종전에는 오로라 그라디언트 채움(`gradient-cta`)으로 드로어에서 **시각적으로 가장
 * 강한 요소**였다 — 그런데 티커 생성은 드로어 안에서 가장 드물게 쓰는 동작이다(대개는 이미 만든
 * 칩을 담고 뺀다). 지금은 담백한 외곽선 버튼이고, 강조는 hover 에서만 든다.
 * 폭 100% 는 유지한다 — 400px 드로어에서 이 섹션의 유일한 액션이고, 칩 그리드와 좌우 끝선을 맞춘다.
 *
 * ⚠ 그라디언트 채움을 되살리지 마라. 이 화면에서 `gradient-cta` 를 쓰는 자리는 결과 쪽 주 액션이다.
 */
export const TickerCreateButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${space[2]};
  border: 1px solid ${color.border};
  background: ${color.surfaceMuted};
  color: ${color.textSecondary};
  border-radius: ${radius.sm};
  min-height: 40px;
  padding: ${space[2]} ${space[4]};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.medium};
  font-family: inherit;
  cursor: pointer;
  width: 100%;
  margin-top: ${space[3]};
  touch-action: manipulation;
  transition: background-color ${motion.fast} ${motion.ease}, border-color ${motion.fast} ${motion.ease},
    color ${motion.fast} ${motion.ease}, ${pressTransition};

  &:hover {
    background: ${color.brandSubtle};
    border-color: ${color.brandBorder};
    color: ${color.brandText};
  }

  /*
   * 누름은 공용 믹스인으로. 종전 'transform: translateY(1px)' 은 위 'transition' 목록에
   * 'transform' 이 없어 **중간에 되돌릴 수 없는 스냅**이었고(누르다 말면 뚝 끊긴다),
   * 44px 버튼에서 1px 은 지각 한계 아래였다 — 공용 'Button' 에서 고친 것과 같은 부류의 결함이다.
   */
  ${pressable}
`;

export const TickerGridWrap = styled.div`
  border: 1px solid ${color.border};
  border-radius: ${radius.md};
  background: ${color.surfaceMuted};
  padding: ${space[2]};
`;

export const TickerList = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(72px, 1fr));
  gap: ${space[2]};
`;

export const TickerChipWrap = styled.div`
  position: relative;

  &:hover button[data-chip='true'],
  &:focus-within button[data-chip='true'] {
    padding-right: 32px;
  }

  &:hover button[data-gear='true'],
  &:focus-within button[data-gear='true'] {
    opacity: 1;
    pointer-events: auto;
    transform: translateY(-50%) scale(1);
  }
`;

/**
 * 티커 칩(설정 드로어 그리드).
 *
 * `Chip` 프리미티브와 같은 시각 언어(pill, 선택 시 브랜드 채움)를 쓰되, 여기서는
 * 고정폭 그리드 셀이라 폭 100%가 필요해서 별도 스타일로 둔다.
 * 선택 상태를 폰트 굵기만으로 말하던 걸 **pill 형태 + 브랜드 채움**으로 바꿨다.
 */
export const TickerItemButton = styled.button<{ selected?: boolean }>`
  width: 100%;
  min-height: 36px;
  text-align: center;
  border: 1px solid ${({ selected }) => (selected ? color.brandBorder : color.border)};
  background: ${({ selected }) => (selected ? color.brandSubtle : color.surface)};
  color: ${({ selected }) => (selected ? color.brandText : color.textSecondary)};
  border-radius: ${radius.pill};
  padding: ${space[2]};
  font-size: ${font.size['2xs']};
  font-weight: ${({ selected }) => (selected ? font.weight.bold : font.weight.medium)};
  font-family: inherit;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
  touch-action: manipulation;
  transition: background-color ${motion.fast} ${motion.ease}, border-color ${motion.fast} ${motion.ease},
    color ${motion.fast} ${motion.ease}, padding-right ${motion.base} ${motion.ease};

  &:hover {
    background: ${({ selected }) => (selected ? color.brandSubtleHover : color.surfaceHover)};
    border-color: ${color.brandBorder};
  }
`;

export const TickerGearButton = styled.button`
  position: absolute;
  top: 50%;
  /* 오른쪽 끝에서 살짝 안쪽으로 들여, 칩 텍스트와의 간격도 자연스럽게 좁아진다. */
  right: 3px;
  transform: translateY(-50%) scale(0.88);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid ${color.borderStrong};
  /* 칩(surface)과 살짝 다른 톤으로 떠 있는 작은 버튼임을 드러낸다. */
  background: ${color.surfaceMuted};
  color: ${color.textSecondary};
  border-radius: ${radius.pill};
  width: 24px;
  height: 24px;
  padding: 0;
  line-height: 0;
  cursor: pointer;
  opacity: 0;
  pointer-events: auto;
  transition: opacity ${motion.base} ${motion.ease}, transform ${motion.base} ${motion.ease},
    background-color ${motion.fast} ${motion.ease};

  &:hover {
    background: ${color.brandSubtle};
    color: ${color.brandText};
  }

  svg {
    width: 12px;
    height: 12px;
    stroke: currentColor;
    fill: none;
    stroke-width: 1.8;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
`;
