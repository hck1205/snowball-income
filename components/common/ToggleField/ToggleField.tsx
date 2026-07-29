import Toggle from '@/components/common/Toggle';
import type { ToggleFieldProps } from './ToggleField.types';
import { toToggleId } from './ToggleField.utils';
import { HelpButton, ToggleHeader, ToggleLabel } from './ToggleField.styled';

/**
 * 라벨 + 스위치. 스위치 자체는 `Toggle` 프리미티브에 위임한다.
 * (이 컴포넌트는 배치·라벨·도움말만 책임진다)
 *
 * 배치는 **한 줄(기본)** 과 **두 줄(`stacked`)** 두 가지고, 고르는 건 호출부의 불리언 하나다.
 * 화면마다 다른 토글을 만들지 않기 위해서다 — 아래 "생김새는 호출부가 못 바꾼다" 와 같은 이유로,
 * 배치도 자유 CSS가 아니라 **정해진 두 형태 중 선택**만 허용한다.
 *
 * **스위치의 생김새는 호출부가 못 바꾼다** — 트랙 폭(`controlWidth`)·트랙 안 글자(`onText`/`offText`)·
 * 글자색(`stateTextColor`) prop은 전부 없앴다. 그 셋이 화면마다 다른 크기의 스위치를 만들던
 * 원인이었다. 두 모드 중 하나를 고르는 스위치라면 그 의미는 **보이는 라벨(`label`)**과
 * 켜짐의 뜻이 드러나는 **접근명(`accessibleName`)**으로 말한다.
 */
export default function ToggleField({
  label,
  accessibleName,
  checked,
  disabled,
  hideLabel,
  stacked,
  size,
  helpAriaLabel,
  onHelpClick,
  onChange
}: ToggleFieldProps) {
  const id = toToggleId(label);

  return (
    <ToggleLabel $stacked={stacked}>
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
        /* 시각 라벨과 접근명이 다를 수 있다 — 다르게 줬을 때만 갈라지고, 기본은 라벨 그대로다. */
        label={accessibleName ?? label}
        checked={checked}
        disabled={disabled}
        size={size}
        onChange={onChange}
      />
    </ToggleLabel>
  );
}
