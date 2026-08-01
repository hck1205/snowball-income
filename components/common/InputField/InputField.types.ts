import type { ChangeEventHandler, FocusEventHandler } from 'react';
import type { Frequency } from '@/shared/types';

export type InputFieldProps = {
  label: string;
  /**
   * 입력의 DOM id(라벨 `htmlFor`도 같은 값). 기본은 라벨에서 파생한다(`toInputId`).
   *
   * 밖에서 이 입력을 **지목해야 할 때만** 준다(예: 다른 카드의 CTA가 여기로 포커스를 옮길 때) —
   * 라벨 파생 id는 카피가 바뀌면 조용히 깨지기 때문이다.
   */
  id?: string;
  value: string | number;
  type?: 'text' | 'number' | 'date';
  helpAriaLabel?: string;
  onHelpClick?: () => void;
  disabled?: boolean;
  placeholder?: string;
  /** 입력값 앞에 붙는 단위 기호(예: 달러 '$'). 순수 표시용 — 값에는 포함되지 않는다. */
  prefix?: string;
  /** 입력값 뒤에 붙는 단위 기호(예: 퍼센트 '%'). 순수 표시용 — 값에는 포함되지 않는다. */
  suffix?: string;
  /**
   * 입력 아래 한 줄 보조 표기(예: 달러 환산 `≈ $1,014`).
   *
   * **입력값 자체는 바꾸지 않는다** — 읽기 전용 참고 정보다. 빈 값/undefined 면 줄 자체를 렌더하지
   * 않아 레이아웃이 흔들리지 않는다. 입력과 연결(`aria-describedby`)해 스크린리더도 함께 읽는다.
   */
  hint?: string;
  min?: number;
  max?: number;
  step?: number;
  onBlur?: FocusEventHandler<HTMLInputElement>;
  onChange: ChangeEventHandler<HTMLInputElement>;
};

export type SelectFieldProps = {
  label: string;
  value: Frequency;
  helpAriaLabel?: string;
  onHelpClick?: () => void;
  disabled?: boolean;
  /**
   * 셀렉트 아래 한 줄 보조 표기. `InputField` 의 `hint` 와 **같은 부품·같은 자리**를 쓴다
   * (`FieldHint` + `aria-describedby`).
   *
   * 지금의 유일한 소비자는 "배당률은 있는데 주기가 '배당 없음'" 모순 안내다 — 선택지를 막지 않고
   * 결과만 말한다. 빈 값/undefined 면 줄 자체를 렌더하지 않아 레이아웃이 흔들리지 않는다.
   */
  hint?: string;
  onChange: ChangeEventHandler<HTMLSelectElement>;
};
