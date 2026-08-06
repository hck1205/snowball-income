import type { PortfolioHoldingRowModel } from '../HoldingsTable';

/**
 * 도넛 한 조각 = 범례 한 줄. **둘이 같은 배열에서 나온다** — 조각과 줄이 각자 계산하면
 * "도넛에는 있는데 범례에 없는 색"이 생기고, 그 색은 아무 뜻도 없는 얼룩이 된다.
 */
export type CompositionSlice = {
  /** 범례에 적히는 이름. 접힌 나머지 조각은 `그 외`. */
  label: string;
  /** 0~100. 접힌 조각은 나머지 전부의 합이다. */
  percent: number;
  /**
   * 면 색(CSS 값). 종목 조각은 `assignSeries` 가 준 `var(--sb-chart-series-N)`,
   * 접힌 조각은 중립 토큰이다 — 🔴 9번째 색을 지어내지 않는다(팔레트 밖은 대비 검증 밖이다).
   */
  paint: string;
  /** 접힌 조각인가. 범례가 이 줄에는 종목 링크·강조를 주지 않는다. */
  isRest: boolean;
};

export type HoldingsCompositionProps = {
  /** 표와 **같은 행 배열**을 받는다 — 색 배정의 입력 집합이 같아야 두 자리의 색이 맞물린다. */
  rows: readonly PortfolioHoldingRowModel[];
  /** 도넛 제목(시각적으로는 범례 위 라벨, 접근성으로는 그룹 이름). */
  title: string;
};
