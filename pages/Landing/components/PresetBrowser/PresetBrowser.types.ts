/** 그룹 배지 톤 — `PORTFOLIO_PRESET_GROUPS[].tone` 과 같은 어휘(검증된 토큰 쌍만). */
export type PresetGroupTone = 'identity' | 'accent' | 'accentAlt' | 'neutral';

/** 비중 막대 한 조각. **장식**이라 접근성 트리에 없고, 같은 사실을 아래 비중 텍스트가 말한다. */
export type PresetAllocationSegment = {
  ticker: string;
  weight: number;
  /** `var(--sb-chart-series-N)` — 도넛·슬라이더와 같은 카테고리 색 규칙(index % 8). */
  colorVar: string;
};
