import type { ChangeEventHandler } from 'react';

export type ToggleFieldProps = {
  label: string;
  /**
   * 스위치의 접근명을 시각 라벨과 **다르게** 둬야 할 때만 쓴다(미지정이면 `label` 그대로).
   *
   * 필요한 이유: 값이 두 개인 모드 스위치는 시각적으로 "표시 통화 [원|달러]"처럼 읽히지만,
   * 스크린리더에는 "표시 통화, 켜짐"으로만 들려 켜짐이 원인지 달러인지 알 수 없다.
   * 그런 경우에만 접근명을 "결과를 달러로 표시"처럼 켜짐의 의미가 드러나는 문장으로 덮는다.
   */
  accessibleName?: string;
  checked: boolean;
  disabled?: boolean;
  hideLabel?: boolean;
  controlWidth?: string;
  stateTextColor?: string;
  onText?: string;
  offText?: string;
  helpAriaLabel?: string;
  onHelpClick?: () => void;
  onChange: ChangeEventHandler<HTMLInputElement>;
};
