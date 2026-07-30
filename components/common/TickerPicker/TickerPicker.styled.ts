import styled from '@emotion/styled';
import { color, font, media, motion, pressable, radius, shadow, space } from '@/shared/styles';

/**
 * 퀵액션 툴바 — "데이터 저장"이 자동저장으로 대체돼 제거된 뒤 보이는 버튼은 [공유] 하나뿐이라 단일 열로
 * 전폭을 채운다. (Coffee는 display:none 이라 그리드 셀을 차지하지 않는다 → 공유가 전폭.)
 */
export const TickerQuickActionRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: ${space[2]};
  width: 100%;
  margin-bottom: ${space[2]};
`;

export const TickerQuickActionButton = styled.button`
  border: 1px solid ${color.border};
  background: ${color.surfaceMuted};
  color: ${color.textSecondary};
  border-radius: ${radius.sm};
  /* 전폭 단일 버튼(공유) — 아이콘을 세로로 쌓지 않고 가로로 나란히 둬 높이를 낮춘다. */
  min-height: 38px;
  padding: ${space[2]} ${space[3]};
  display: inline-flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: ${space[2]};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.medium};
  font-family: inherit;
  line-height: 1.1;
  cursor: pointer;
  touch-action: manipulation;
  transition: background-color ${motion.fast} ${motion.ease}, border-color ${motion.fast} ${motion.ease},
    color ${motion.fast} ${motion.ease};

  &:hover {
    background: ${color.brandSubtle};
    border-color: ${color.brandBorder};
    color: ${color.brandText};
  }
`;

export const TickerQuickActionIcon = styled.span`
  width: 16px;
  height: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 16px;
    height: 16px;
    stroke: currentColor;
    fill: none;
    stroke-width: 1.8;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
`;

/**
 * 설정 드로어의 사실상 primary CTA — Button primary와 같은 오로라 CTA 리본 레시피를 쓴다.
 * hover는 색을 바꾸지 않고 background-position만 움직여 라벨 대비(전 stop 흰 라벨 ≥4.5:1)가 불변이다.
 */
export const TickerCreateButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid transparent;
  background-image: ${color.gradientCta};
  background-size: 160% 160%;
  background-position: 0% 0%;
  color: ${color.onBrand};
  border-radius: ${radius.sm};
  min-height: 44px;
  padding: ${space[2]} ${space[4]};
  font-size: ${font.size.base};
  font-weight: ${font.weight.semibold};
  font-family: inherit;
  cursor: pointer;
  width: 100%;
  margin-bottom: ${space[3]};
  touch-action: manipulation;
  transition: background-position ${motion.base} ${motion.ease}, box-shadow ${motion.fast} ${motion.ease};

  &:hover {
    background-position: 100% 100%;
    box-shadow: ${shadow.e2};
  }

  /*
   * 누름은 공용 믹스인으로. 종전 'transform: translateY(1px)' 은 위 'transition' 목록에
   * 'transform' 이 없어 **중간에 되돌릴 수 없는 스냅**이었고(누르다 말면 뚝 끊긴다),
   * 44px 버튼에서 1px 은 지각 한계 아래였다 — 공용 'Button' 에서 고친 것과 같은 부류의 결함이다.
   */
  ${pressable}

  ${media.down('drawer')} {
    margin-bottom: ${space[5]};
  }
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
