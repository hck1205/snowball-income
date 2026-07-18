import type { ToggleProps } from './Toggle.types';
import { HiddenCheckbox, ToggleStateText, ToggleThumb, ToggleTrack } from './Toggle.styled';

/**
 * 스위치 컨트롤 그 자체(라벨 줄 없음).
 * 라벨 + 도움말이 붙은 한 줄이 필요하면 `ToggleField`를 쓴다.
 *
 * 시맨틱은 **네이티브 체크박스 그대로** 유지한다.
 * `role="switch"`로 바꾸고 싶은 유혹이 있지만 그러면 안 된다:
 *  - 접근성 트리에서 role이 checkbox → switch로 바뀌어 `getByRole('checkbox')`가 못 찾는다
 *    (실제로 SnowballApp 테스트가 '배당 재투자'/'빠른 추정 보기'를 그렇게 잡고 있다).
 *  - 체크박스도 스위치도 스크린리더에는 "켜짐/꺼짐"으로 읽히므로 실익이 없다.
 * 스위치는 **보이는 방식**이지 시맨틱이 아니다.
 */
export default function Toggle({
  label,
  checked,
  disabled,
  id,
  onText,
  offText,
  controlWidth,
  stateTextColor,
  onChange
}: ToggleProps) {
  // 둘 중 하나라도 주면 "모드 스위치"로 취급한다. 아무것도 안 주면 텍스트 없는 순수 스위치.
  const isModeSwitch = onText !== undefined || offText !== undefined;
  const stateText = checked ? onText : offText;

  return (
    <ToggleTrack checked={checked} disabled={disabled} controlWidth={controlWidth}>
      {isModeSwitch && stateText ? (
        <ToggleStateText checked={checked} disabled={disabled} stateTextColor={stateTextColor} aria-hidden="true">
          {stateText}
        </ToggleStateText>
      ) : null}
      <HiddenCheckbox
        id={id}
        type="checkbox"
        aria-label={label}
        checked={checked}
        disabled={disabled}
        onChange={onChange}
      />
      <ToggleThumb checked={checked} disabled={disabled} />
    </ToggleTrack>
  );
}
