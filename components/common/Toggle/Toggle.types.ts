import type { ChangeEventHandler } from 'react';

export type ToggleProps = {
  /** 접근성 이름. 시각적 라벨이 따로 있으면 그 텍스트를 그대로 넘긴다. */
  label: string;
  checked: boolean;
  disabled?: boolean;
  id?: string;

  /**
   * 켬/끔이 아니라 **두 가지 모드** 중 하나를 고르는 스위치일 때 트랙 안에 보여줄 텍스트.
   * (예: 간략/상세, 자산/배당)
   *
   * 둘 다 주지 않으면 텍스트 없는 순수 스위치로 그린다 — 이게 기본이다.
   * 스위치에 "OFF"를 박아 넣으면 켜는 물건인지 끄는 물건인지 헷갈린다.
   */
  onText?: string;
  offText?: string;

  /** 라벨 텍스트가 들어가는 모드 스위치의 트랙 폭(기본값으로는 텍스트가 잘릴 수 있어서). */
  controlWidth?: string;
  /** 레거시 탈출구. 새 코드에서는 쓰지 마라. */
  stateTextColor?: string;

  onChange: ChangeEventHandler<HTMLInputElement>;
};
