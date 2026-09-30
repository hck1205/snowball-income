export type OverlapSimulateProps = {
  /** 담은 ETF 수. 0 이면 버튼 대신 안내만 보인다. */
  readonly basketSize: number;
  readonly canSimulate: boolean;
  /** 시뮬레이터 프리셋에 없어 빠지는 ETF. */
  readonly excluded: readonly string[];
  readonly onSimulate: () => void;
};
