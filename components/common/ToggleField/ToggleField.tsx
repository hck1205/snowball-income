import Toggle from '@/components/common/Toggle';
import type { ToggleFieldProps } from './ToggleField.types';
import { toToggleId } from './ToggleField.utils';
import { HelpButton, ToggleHeader, ToggleLabel } from './ToggleField.styled';

/**
 * 라벨 줄 + 스위치 한 줄. 스위치 자체는 `Toggle` 프리미티브에 위임한다.
 * (이 컴포넌트는 배치·라벨·도움말만 책임진다)
 *
 * public props는 그대로다 — 호출부가 8곳이라 깨면 안 된다.
 * 달라진 건 스위치의 **생김새**뿐이다: 트랙에 박혀 있던 "ON"/"OFF" 글자가 사라지고,
 * 흰 썸 + 브랜드 트랙의 진짜 스위치가 됐다. `onText`/`offText`를 준 모드 스위치는 그대로 텍스트를 보여준다.
 */
export default function ToggleField({
  label,
  checked,
  disabled,
  hideLabel,
  controlWidth,
  stateTextColor,
  onText,
  offText,
  helpAriaLabel,
  onHelpClick,
  onChange
}: ToggleFieldProps) {
  const id = toToggleId(label);

  return (
    <ToggleLabel>
      {hideLabel ? null : (
        <ToggleHeader>
          {label}
          {onHelpClick ? (
            <HelpButton
              type="button"
              aria-label={helpAriaLabel ?? `${label} 설명 열기`}
              onClick={(event) => {
                event.preventDefault();
                onHelpClick();
              }}
            >
              ?
            </HelpButton>
          ) : null}
        </ToggleHeader>
      )}
      <Toggle
        id={id}
        label={label}
        checked={checked}
        disabled={disabled}
        onText={onText}
        offText={offText}
        controlWidth={controlWidth}
        stateTextColor={stateTextColor}
        onChange={onChange}
      />
    </ToggleLabel>
  );
}
