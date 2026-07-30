import { forwardRef } from 'react';
import { prefersReducedMotion } from '@/shared/utils';
import type { ButtonProps } from './Button.types';
import { LabelSlot, Spinner, StyledButton } from './Button.styled';

/**
 * 앱의 유일한 버튼.
 *
 * `forwardRef`인 이유: 드로어 포커스 관리와 모달 닫기 버튼이 ref로 포커스를 잡는다.
 * `type`이 기본 `button`인 이유: 폼 안의 버튼이 실수로 submit 하는 사고를 막는다.
 */
const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'secondary',
    size = 'md',
    loading = false,
    fullWidth,
    iconOnly,
    startIcon,
    disabled,
    type = 'button',
    children,
    ...rest
  },
  ref
) {
  /*
   * reduced-motion 에서는 링이 돌지 않는다(전역 리셋이 '!important' 로 애니메이션을 죽인다).
   * 그때 라벨까지 지우면 로딩 중 시각 단서가 **하나도** 남지 않으므로 라벨을 그대로 둔다.
   * 링은 정적 링 + 불투명도 펄스로 바뀌어 오른쪽 여백에 앉는다(Button.styled.ts 'Spinner' 주석).
   *
   * 판정은 로딩 중일 때만 한다 — 앱의 모든 버튼이 매 렌더 'matchMedia' 를 부르지 않게.
   */
  const staticBusy = loading && prefersReducedMotion();

  return (
    <StyledButton
      ref={ref}
      type={type}
      variant={variant}
      size={size}
      fullWidth={fullWidth}
      iconOnly={iconOnly}
      isLoading={loading}
      disabled={disabled || loading}
      // 로딩 중임을 스크린리더에도 알린다. 시각적 스피너만으로는 전달되지 않는다.
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <Spinner aria-hidden="true" isStatic={staticBusy} /> : null}
      <LabelSlot isHidden={loading && !staticBusy}>
        {startIcon}
        {children}
      </LabelSlot>
    </StyledButton>
  );
});

export default Button;
