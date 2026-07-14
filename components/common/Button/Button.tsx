import { forwardRef } from 'react';
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
      {loading ? <Spinner aria-hidden="true" /> : null}
      <LabelSlot isHidden={loading}>
        {startIcon}
        {children}
      </LabelSlot>
    </StyledButton>
  );
});

export default Button;
