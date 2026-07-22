/** 듀얼 썸(min/max) 범위 슬라이더의 공개 API. */
export type RangeSliderProps = {
  /** 트랙 하한(슬라이더가 표현할 수 있는 가장 작은 값). */
  min: number;
  /** 트랙 상한(슬라이더가 표현할 수 있는 가장 큰 값). */
  max: number;
  /** 한 칸 증분. 키보드 Arrow / 드래그 스냅 단위. */
  step: number;
  /** 현재 하단 썸 값. `min ≤ valueMin ≤ valueMax`. */
  valueMin: number;
  /** 현재 상단 썸 값. `valueMin ≤ valueMax ≤ max`. */
  valueMax: number;
  /**
   * 값 변경 콜백. 항상 `(하단, 상단)` 순서로 클램프된 값을 준다.
   * 두 썸은 서로 교차하지 못한다(하단 ≤ 상단이 보장된다).
   */
  onChange: (min: number, max: number) => void;
  /** 접근성 이름의 기준. 각 썸의 aria-label / 시각 라벨에 쓰인다. */
  label: string;
  /** 단위. '$'는 접두, '%'는 접미로 붙는다. `formatValue`가 있으면 무시된다. */
  unit?: '%' | '$';
  /** 값 → 표시 문자열 커스텀 포맷터(상한 캡 '20%+' 같은 표현을 소비처가 처리). */
  formatValue?: (value: number) => string;
};
