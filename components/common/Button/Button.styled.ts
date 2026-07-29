import styled from '@emotion/styled';
import { color, font, motion, pressable, radius, shadow, space } from '@/shared/styles';
import type { ButtonSize, ButtonVariant } from './Button.types';

/**
 * 앱 전체 버튼의 단일 출처.
 *
 * 터치 타겟: 시각적 높이는 sm=32 / md=40 이지만, `::before`로 44x44 히트 영역을 깔아
 * **레이아웃을 바꾸지 않으면서** WCAG 2.5.5를 만족시킨다. 밀도 높은 금융 UI에서
 * 모든 버튼을 44px로 키우면 화면이 터지기 때문에 이 방식을 쓴다.
 */

const SIZE = {
  sm: { height: '32px', padding: `0 ${space[3]}`, font: font.size.xs, gap: space[1], icon: '28px' },
  md: { height: '40px', padding: `0 ${space[4]}`, font: font.size.sm, gap: space[2], icon: '40px' }
} as const;

const VARIANT: Record<ButtonVariant, string> = {
  /*
   * primary만 오로라 CTA 리본을 쓴다(gradient-cta — 모든 stop이 흰 라벨 ≥ 4.5:1).
   * hover는 색을 바꾸지 않고 background-position만 움직인다 → 라벨 대비가 어떤 순간에도 불변.
   * 표시용 gradient-aurora를 여기 쓰면 안 된다(#2dd4bf 위 흰 라벨 1.9:1로 탈락).
   */
  primary: `
    border-color: transparent;
    background-image: ${color.gradientCta};
    background-size: 160% 160%;
    background-position: 0% 0%;
    color: ${color.onBrand};

    &:hover:not(:disabled) {
      background-position: 100% 100%;
      box-shadow: ${shadow.e2};
    }
  `,
  secondary: `
    border-color: ${color.borderStrong};
    background: ${color.surface};
    color: ${color.text};

    &:hover:not(:disabled) {
      background: ${color.surfaceHover};
      border-color: ${color.brandBorder};
    }
  `,
  ghost: `
    border-color: transparent;
    background: transparent;
    color: ${color.textSecondary};

    &:hover:not(:disabled) {
      background: ${color.surfaceHover};
      color: ${color.text};
    }
  `,
  danger: `
    border-color: ${color.dangerBorder};
    background: ${color.dangerSurface};
    color: ${color.danger};

    &:hover:not(:disabled) {
      background: ${color.danger};
      border-color: ${color.danger};
      color: ${color.onBrand};
    }
  `
};

export const StyledButton = styled.button<{
  variant: ButtonVariant;
  size: ButtonSize;
  fullWidth?: boolean;
  iconOnly?: boolean;
  isLoading?: boolean;
}>`
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${({ size }) => SIZE[size].gap};
  box-sizing: border-box;
  width: ${({ fullWidth, iconOnly, size }) => (fullWidth ? '100%' : iconOnly ? SIZE[size].icon : 'auto')};
  height: ${({ size }) => SIZE[size].height};
  padding: ${({ size, iconOnly }) => (iconOnly ? '0' : SIZE[size].padding)};
  border: 1px solid transparent;
  border-radius: ${radius.sm};
  font-family: inherit;
  font-size: ${({ size }) => SIZE[size].font};
  font-weight: ${font.weight.semibold};
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
  touch-action: manipulation;
  transition: background-color ${motion.fast} ${motion.ease}, border-color ${motion.fast} ${motion.ease},
    color ${motion.fast} ${motion.ease}, box-shadow ${motion.fast} ${motion.ease},
    background-position ${motion.base} ${motion.ease};

  ${({ variant }) => VARIANT[variant]};

  /* 히트 영역만 44x44로 확장 (시각 크기는 유지). */
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    min-width: 44px;
    min-height: 44px;
    width: 100%;
    height: 100%;
    transform: translate(-50%, -50%);
  }

  /*
   * 눌리는 느낌.
   *
   * 2026-07-30 까지 'translateY(1px)' 이었는데 둘 다 문제였다 — 40px 버튼에서 1px 은 **지각 한계
   * 아래**였고, 'transition' 목록에 'transform' 이 없어 **중간에 되돌릴 수 없는 스냅**이었다
   * (누르다 말면 뚝 끊긴다). 공용 믹스인으로 옮겨 축소(0.96) + 중단 가능한 전환으로 바꿨다.
   */
  ${pressable}

  &:disabled {
    opacity: 0.55;
    cursor: ${({ isLoading }) => (isLoading ? 'progress' : 'not-allowed')};
  }

  /*
   * ⚠ 크기를 여기서 정하지 마라 — 'size' prop 이 정본이다('ICON' 계단).
   *
   * 2026-07-30 까지 여기 'width: 1em; height: 1em' 이 있었다. CSS 는 SVG 프레젠테이션 속성을
   * 이기므로 **버튼 안 아이콘은 'size' prop 을 통째로 무시했다** — 'size="md"' 버튼의
   * '<Plus size={16}>' 이 13px(=font-size)로 그려졌다. 13 은 계단에 없는 값이고, 2026-07-29
   * 아이콘 통일 작업이 버튼 안에서만 조용히 무효였다는 뜻이다. 소스만 읽으면 안 보인다.
   *
   * 'flex: none' 은 남긴다 — 라벨이 길 때 아이콘이 찌그러지는 걸 막는 건 레이아웃 책임이다.
   */
  svg {
    flex: none;
  }
`;

/**
 * 로딩 스피너. 라벨을 지우지 않고 **위에 겹쳐서** 보여준다.
 * 라벨을 스피너로 갈아끼우면 버튼 폭이 바뀌어 옆 버튼들이 튄다.
 */
export const Spinner = styled.span`
  position: absolute;
  width: 14px;
  height: 14px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: ${radius.pill};
  opacity: 0.9;
  animation: sb-button-spin 600ms linear infinite;

  @keyframes sb-button-spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

/**
 * 로딩 중 라벨은 자리를 지키되 시각적으로만 숨긴다(폭 유지).
 *
 * `visibility: hidden`이 아니라 `opacity: 0`인 이유: visibility는 요소를 **접근성 트리에서 제거**한다.
 * 그러면 로딩 중인 버튼의 접근 가능한 이름이 사라져서 스크린리더가 "버튼"이라고만 읽는다.
 * opacity는 트리에 남기므로 이름이 유지된다. (테스트가 이걸 잡아냈다)
 */
export const LabelSlot = styled.span<{ isHidden?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: inherit;
  opacity: ${({ isHidden }) => (isHidden ? 0 : 1)};
`;
