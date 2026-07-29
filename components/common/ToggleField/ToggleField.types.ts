import type { ChangeEventHandler } from 'react';
import type { ToggleSize } from '@/components/common/Toggle';

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
  /**
   * 두 줄 표기 — 라벨을 스위치 **위**에 올려 세로로 쌓는다(기본 `false` = 한 줄, 라벨 좌·스위치 우).
   *
   * 쓰는 자리: **가로 폭이 모자란 곳**. 한 줄 배치는 `라벨 + gap + 스위치` 만큼 폭을 먹는데,
   * 쌓으면 둘 중 넓은 쪽 폭만 쓴다. 모바일 결과 컨트롤 줄(`ScenarioTabsRow`)이 이 경우다.
   * 반대로 폼처럼 세로 공간이 아쉬운 곳에서는 기본값(한 줄)이 낫다.
   */
  stacked?: boolean;
  /** 스위치 크기(기본 `'md'`). 현재 단일 단계라 사실상 디자인 고정이다. */
  size?: ToggleSize;
  helpAriaLabel?: string;
  onHelpClick?: () => void;
  onChange: ChangeEventHandler<HTMLInputElement>;
};
