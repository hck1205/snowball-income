import styled from '@emotion/styled';
import { color, container, font, media, motion, radius, space } from '@/shared/styles';

export const SelectedChipWrap = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${space[2]};
  margin-top: ${space[2]};

  ${media.down('drawer')} {
    margin-top: ${space[4]};
  }
`;

export const AllocationChartLayout = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(340px, 100%), 1fr));
  gap: clamp(8px, 1.5vw, 16px);
  align-items: start;
  contain: layout style;
`;

export const AllocationLegend = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: ${space[2]};
  container-type: inline-size;
`;

const stackedLegendItem = `
  grid-template-columns: 16px 40px minmax(0, 1fr) 60px;
  grid-template-areas:
    'dot name name value'
    'dot slider slider fix';
  gap: ${space[2]};
`;

export const AllocationLegendItem = styled.li`
  display: grid;
  /*
   * 고정 버튼은 행의 **맨 우측**이다. 한때 슬라이더 앞(name 다음)으로 옮겼던 이유는
   * 모바일에서 슬라이더를 쓸다가 오른쪽 끝의 고정을 잘못 누르는 사고였는데,
   * 카드 헤더의 "비율 조절 잠금" 토글이 그 오조작을 원천 차단하면서 근거가 사라졌다.
   */
  grid-template-columns: 16px 72px minmax(120px, 1fr) 52px 60px;
  grid-template-areas: 'dot name slider value fix';
  gap: ${space[2]};
  align-items: center;
  font-size: ${font.size.xs};
  color: ${color.textSecondary};

  ${container.down('mobile')} {
    ${stackedLegendItem};
  }

  ${media.down('mobile')} {
    ${stackedLegendItem};
  }
`;

export const AllocationColorDot = styled.span<{ color: string }>`
  grid-area: dot;
  width: 12px;
  height: 12px;
  border-radius: ${radius.xs};
  background: ${({ color: dotColor }) => dotColor};
`;

export const AllocationLegendName = styled.span`
  grid-area: name;
  min-width: 0;
  color: ${color.text};
  font-weight: ${font.weight.medium};
  line-height: ${font.leading.tight};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const AllocationLegendSlider = styled.input`
  grid-area: slider;
  width: 100%;
  height: 8px;
  appearance: none;
  -webkit-appearance: none;
  background: linear-gradient(
    to right,
    ${color.brand} 0%,
    ${color.brand} var(--slider-progress),
    ${color.surfaceSunken} var(--slider-progress),
    ${color.surfaceSunken} 100%
  );
  border: 1px solid ${color.border};
  border-radius: ${radius.pill};
  --slider-progress: 0%;
  margin: 0;
  padding: 0;
  cursor: pointer;

  /*
   * 활성 슬라이더만 가로 제스처를 소유한다(pan-y = 세로 스크롤은 브라우저가 유지, 가로 드래그는 썸으로).
   * 모바일 드로어에서 슬라이더를 쓸다가 세로 스크롤에 드래그를 뺏기던 문제 보정.
   * disabled는 어차피 드래그가 안 되므로 제외한다.
   */
  &:not(:disabled) {
    touch-action: pan-y;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  &::-webkit-slider-runnable-track {
    height: 8px;
    background: transparent;
    border-radius: ${radius.pill};
  }

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 16px;
    height: 16px;
    margin-top: -5px;
    border-radius: ${radius.pill};
    border: 2px solid ${color.surface};
    background: ${color.brand};
    box-shadow: 0 1px 3px rgba(15, 25, 35, 0.3);
  }

  &::-moz-range-track {
    height: 8px;
    background: transparent;
    border-radius: ${radius.pill};
  }

  &::-moz-range-progress {
    height: 8px;
    background: transparent;
    border-radius: ${radius.pill};
  }

  &::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border-radius: ${radius.pill};
    border: 2px solid ${color.surface};
    background: ${color.brand};
    box-shadow: 0 1px 3px rgba(15, 25, 35, 0.3);
  }
`;

const stackedFixButton = `
  justify-self: end;
`;

export const AllocationFixButton = styled.button<{ active: boolean }>`
  grid-area: fix;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${space[1]};
  width: 60px;
  height: 28px;
  border: 1px solid ${({ active }) => (active ? color.brand : color.borderStrong)};
  background: ${({ active }) => (active ? color.brand : color.surface)};
  color: ${({ active }) => (active ? color.onBrand : color.textSecondary)};
  border-radius: ${radius.xs};
  padding: 0;
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.semibold};
  font-family: inherit;
  line-height: 1;
  cursor: pointer;
  touch-action: manipulation;
  transition: background-color ${motion.fast} ${motion.ease}, border-color ${motion.fast} ${motion.ease},
    color ${motion.fast} ${motion.ease};

  &:hover {
    border-color: ${color.brand};
  }

  ${container.down('mobile')} {
    ${stackedFixButton};
  }

  ${media.down('mobile')} {
    ${stackedFixButton};
  }
`;

export const AllocationLegendValue = styled.span`
  grid-area: value;
  color: ${color.text};
  font-weight: ${font.weight.semibold};
  justify-self: end;
  ${font.numeric};
`;

/**
 * 범례 하단 단일 힌트 줄 — 슬라이더가 왜 비활성인지(무음 비활성 금지) 우선순위로 하나만 안내한다.
 * 아이콘+문장을 함께 두어(색각 대비) inline-flex로 정렬하고, 필요 시 '고정 전체 해제' 버튼을 옆에 인라인으로 편다.
 */
export const AllocationHint = styled.p`
  margin: ${space[2]} 0 0;
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: ${space[1]} ${space[2]};
  font-size: ${font.size.sm};
  color: ${color.textMuted};
  line-height: ${font.leading.normal};

  svg {
    flex: 0 0 auto;
  }
`;

/**
 * '고정 전체 해제' 단축 액션 — secondary 텍스트 버튼 톤(brand 채움 금지, 크롬에 데이터색/accent 금지).
 */
export const AllocationClearFixedButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: ${space[1]};
  border: none;
  background: none;
  padding: 0;
  color: ${color.textSecondary};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.medium};
  font-family: inherit;
  line-height: ${font.leading.normal};
  text-decoration: underline;
  text-underline-offset: 2px;
  cursor: pointer;
  touch-action: manipulation;
  transition: color ${motion.fast} ${motion.ease};

  &:hover {
    color: ${color.text};
  }
`;
