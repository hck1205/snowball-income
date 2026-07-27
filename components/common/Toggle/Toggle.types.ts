import type { ChangeEventHandler } from 'react';

/**
 * 스위치 크기 단계.
 *
 * **지금은 `'md'` 하나뿐이고, 그게 의도다** — 앱의 모든 토글은 같은 크기로 보여야 한다
 * (투자 설정 카드의 토글이 기준). 크기를 호출부가 임의로 정하면 화면마다 스위치가 달라진다.
 *
 * ⚠ 실사용처가 **2곳 이상** 요구하기 전에는 단계를 늘리지 않는다.
 * 새 단계를 추가할 때는 `inset = (height - thumb) / 2` 를 지켜 썸이 트랙 세로 중앙에 오게 한다.
 * (`sm` 후보 수치: `{ track: 36, height: 20, thumb: 14, inset: 3 }`)
 */
export type ToggleSize = 'md';

export type ToggleProps = {
  /** 접근성 이름. 시각적 라벨이 따로 있으면 그 텍스트를 그대로 넘긴다. */
  label: string;
  checked: boolean;
  disabled?: boolean;
  id?: string;

  /** 스위치 크기(기본 `'md'`). 현재 단일 단계라 사실상 디자인 고정이다. */
  size?: ToggleSize;

  onChange: ChangeEventHandler<HTMLInputElement>;
};
