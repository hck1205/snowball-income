import { SCENARIO_COMPARE_DIRECTION, type ScenarioCompareMetric } from '@/pages/Main/utils';

/** 차트 시리즈 토큰 수(`--sb-chart-series-0..7`). */
const SERIES_COUNT = 8;

/**
 * 탭 색 = 차트 시리즈 토큰. 표 머리 점·막대와 차트의 선(`buildScenarioCompareLineOption` 의 colorIndex)이
 * **같은 인덱스 규칙**이라 서로의 범례가 된다. 순서는 탭 순서 — 탭을 옮기면 색도 따라간다.
 */
export const swatchOf = (index: number): string => `var(--sb-chart-series-${index % SERIES_COUNT})`;

/** "최고" 자리에 붙일 말 — 지표의 좋은 방향을 말한다(권유가 아니다). 우열이 없는 지표는 `null`. */
export const bestLabelOf = (metric: ScenarioCompareMetric): string | null => {
  const direction = SCENARIO_COMPARE_DIRECTION[metric];
  if (direction === 'neutral') return null;
  if (direction === 'higher') return '최고';
  return metric === 'targetReachedYear' ? '가장 빠름' : '가장 적음';
};

/** 수익률 표기 — 부호를 붙여 소수 첫째 자리("+59.5%", "-3.0%"). */
export const formatSignedRate = (ratio: number): string => `${ratio >= 0 ? '+' : ''}${(ratio * 100).toFixed(1)}%`;

/** 막대가 0 이 아닌데 보이지 않을 만큼 짧아지지 않게 하는 최소 길이(%). */
const MIN_BAR_PERCENT = 3;

/**
 * 한 행의 막대 길이(%) — 그 행의 **절댓값 최댓값** 대비. 값이 없으면 0(막대를 그리지 않는다).
 * 음수(수익이 마이너스)도 길이는 절댓값이다 — 부호는 글자가 말한다.
 */
export const barPercents = (values: readonly (number | null)[]): number[] => {
  const maxAbs = Math.max(0, ...values.map((value) => (value === null ? 0 : Math.abs(value))));
  return values.map((value) =>
    value === null || maxAbs === 0 ? 0 : Math.max(MIN_BAR_PERCENT, (Math.abs(value) / maxAbs) * 100)
  );
};
