export type TargetAmountPickerProps = {
  /** 지금 고른 목표(만원). */
  readonly monthlyMan: number;
  /** 칩·직접 입력 어느 쪽이든 확정된 목표(만원)를 넘긴다. 범위 검증은 이 부품이 끝낸다. */
  readonly onChange: (monthlyMan: number, source: 'chip' | 'custom') => void;
};
