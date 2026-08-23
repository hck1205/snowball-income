import styled from '@emotion/styled';
import { color, font, motion, radius, space } from '@/shared/styles';
import type { QuantityInputSize } from './QuantityInput.types';

/**
 * 라벨 없는 인라인 수량 입력. 폭을 스스로 제한하고 값은 오른쪽 정렬한다 —
 * 열의 숫자가 같은 세로선에서 끝나야 위아래를 비교할 수 있다.
 *
 * 크기는 `$size` 가 가른다(`QuantityInputSize` 머리말): `md` 는 표 셀 기준 140px·40px,
 * `sm` 은 목록 행에 끼는 72px·28px. 두 값을 여기 한 곳에서만 갖는다 — 호출부가 CSS 로
 * 덮어쓰기 시작하면 같은 컴포넌트가 화면마다 다른 크기로 갈린다.
 */
export const QuantityRoot = styled.span<{ $size: QuantityInputSize }>`
  position: relative;
  display: inline-flex;
  align-items: center;
  width: 100%;
  max-width: ${({ $size }) => ($size === 'sm' ? '72px' : '140px')};
`;

export const QuantityField = styled.input<{ $size: QuantityInputSize }>`
  width: 100%;
  min-width: 0;
  min-height: ${({ $size }) => ($size === 'sm' ? '28px' : '40px')};
  box-sizing: border-box;
  /*
   * 오른쪽 안쪽 여백은 단위 표기('주') 자리다 — 글자 크기에 비례해야 값과 겹치지 않는다.
   * sm 이 1.2em 인 이유: 접미가 12px(xs) 한 글자라 실제로 필요한 것은 8px 오프셋 + 글자폭 12px
   * = 20px 이고, 1.2em(13px 기준 15.6px) + 8px = 23.6px 로 3.6px 만 남긴다.
   * md 의 1.6em 을 그대로 쓰면 72px 폭에서 숫자 자리가 다섯 자도 안 남는다.
   */
  padding: ${({ $size }) =>
    $size === 'sm'
      ? `${space[1]} calc(${space[2]} + 1.2em) ${space[1]} ${space[2]}`
      : `${space[2]} calc(${space[3]} + 1.6em) ${space[2]} ${space[3]}`};
  border: 1px solid ${color.borderStrong};
  border-radius: ${radius.sm};
  background-color: ${color.surface};
  color: ${color.text};
  font-size: ${({ $size }) => ($size === 'sm' ? font.size.sm : font.size.base)};
  font-family: inherit;
  text-align: right;
  ${font.numeric}
  transition: border-color ${motion.fast} ${motion.ease};

  &:hover:not(:disabled) {
    border-color: ${color.brandBorder};
  }

  &:disabled {
    background: ${color.surfaceSunken};
    color: ${color.textMuted};
    cursor: not-allowed;
  }
`;

/** 단위 표기('주'). 값의 일부가 아니라 장식이라 클릭이 입력으로 통과한다. */
export const QuantityUnit = styled.span<{ $size: QuantityInputSize }>`
  position: absolute;
  right: ${({ $size }) => ($size === 'sm' ? space[2] : space[3])};
  color: ${color.textMuted};
  font-size: ${({ $size }) => ($size === 'sm' ? font.size.xs : font.size.sm)};
  line-height: 1;
  pointer-events: none;
`;
