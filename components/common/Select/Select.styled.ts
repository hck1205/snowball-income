import styled from '@emotion/styled';
import { color, font, motion, radius, space } from '@/shared/styles';
import type { SelectSize, SelectWidth } from './Select.types';

/**
 * chevron(꺾쇠)과 컨트롤 오른쪽 가장자리 사이의 여백.
 *
 * 구현 이전에는 곳마다 달랐고(구 BaseSelect/InlineSelect의 gradient 삼각형은 실효 ~7px),
 * "화살표가 가장자리에 너무 붙는다"는 신고가 있었다. 여기 한 곳에서 늘리면 전 셀렉트에 반영된다.
 */
const CHEVRON_INSET: Record<SelectSize, string> = {
  sm: space[2], // 8px — 64px급 컴팩트 셀렉트라 텍스트 자리를 남겨야 한다
  md: space[3], // 12px
  lg: space[3] // 12px
};

/** chevron 아이콘 폭 + 좌우 여유 = 오른쪽 패딩. 텍스트가 화살표 밑으로 들어가지 않게 한다. */
const PADDING_RIGHT: Record<SelectSize, string> = {
  sm: space[7], // 28px
  md: space[8], // 32px
  lg: space[8] // 32px
};

const sizeCss: Record<SelectSize, string> = {
  sm: `
    height: 32px;
    padding: 0 ${PADDING_RIGHT.sm} 0 ${space[2]};
    border-radius: ${radius.sm};
    font-size: ${font.size.xs};
    font-weight: ${font.weight.semibold};
  `,
  md: `
    height: 36px;
    padding: 0 ${PADDING_RIGHT.md} 0 ${space[3]};
    border-radius: ${radius.md};
    font-size: ${font.size.sm};
    font-weight: ${font.weight.medium};
  `,
  lg: `
    min-height: 40px;
    padding: ${space[2]} ${PADDING_RIGHT.lg} ${space[2]} ${space[3]};
    border-radius: ${radius.sm};
    font-size: ${font.size.base};
    font-weight: ${font.weight.regular};
  `
};

const widthCss = (width: SelectWidth) => {
  if (width === 'full') return 'width: 100%;';
  if (width === 'auto') return 'width: max-content; max-width: 100%;';
  return `width: ${width}; max-width: 100%;`;
};

/**
 * 셀렉트 + chevron을 겹쳐 놓는 껍데기. 폭 정책은 전부 여기서 결정하고
 * 안쪽 `<select>`는 항상 100%를 채운다 — 폭 계산이 두 군데로 갈라지지 않게.
 */
export const SelectRoot = styled.span<{ widthMode: SelectWidth; minWidthValue?: string }>`
  position: relative;
  display: inline-flex;
  align-items: center;
  min-width: 0;
  ${({ widthMode }) => widthCss(widthMode)}
  ${({ minWidthValue }) => (minWidthValue ? `min-width: ${minWidthValue};` : '')}
`;

export const StyledSelect = styled.select<{ sizeVariant: SelectSize }>`
  width: 100%;
  min-width: 0;
  border: 1px solid ${color.borderStrong};
  background-color: ${color.surface};
  color: ${color.text};
  font-family: inherit;
  line-height: 1.2;
  cursor: pointer;
  /* 브라우저 기본 화살표 제거 → 오른쪽에 공용 chevron을 얹는다. */
  appearance: none;
  -webkit-appearance: none;
  transition: border-color ${motion.fast} ${motion.ease}, box-shadow ${motion.fast} ${motion.ease};
  ${({ sizeVariant }) => sizeCss[sizeVariant]}

  &:hover:not(:disabled) {
    border-color: ${color.brandBorder};
  }

  &:disabled {
    background-color: ${color.surfaceSunken};
    color: ${color.textMuted};
    cursor: not-allowed;
  }

  /* 다크모드 등에서 옵션 팝업 대비를 확실히 한다(브라우저별 기본 대비가 약한 경우 대비). */
  option {
    color: ${color.text};
    background: ${color.surface};
  }
`;

/** 공용 chevron. 클릭이 셀렉트로 통과하도록 pointer-events는 끈다. */
export const SelectChevron = styled.span<{ sizeVariant: SelectSize }>`
  position: absolute;
  top: 50%;
  right: ${({ sizeVariant }) => CHEVRON_INSET[sizeVariant]};
  transform: translateY(-50%);
  display: inline-flex;
  color: ${color.textMuted};
  pointer-events: none;
`;
