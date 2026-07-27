import type { SimulationOutput } from '@/shared/types';

/**
 * 도달 연도가 **투자 몇 년차**인지 (1-based). 찾지 못하면 `undefined`.
 *
 * 엔진이 주는 것은 달력 연도(`targetMonthDividendReachedYear`)뿐이라, "2028년"이 사용자 기준으로
 * 얼마나 먼 미래인지는 `yearly` 배열에서의 위치로만 안다. **표시 파생값이라 계산 엔진을 건드리지
 * 않는다** — 이미 나온 결과를 읽어 순서만 센다.
 *
 * 소비처는 목표 StatTile의 hint 한 곳이다 — 도달 서사는 내 포트폴리오(`/dividend/portfolio`)의
 * 목표 달성 카드가 맡아 이 카드에서 제거됐다(그 카드가 구 `/dividend/goal` 페이지를 흡수했다).
 */
export const findTargetReachYearIndex = (
  yearly: SimulationOutput['yearly'],
  reachedYear: number | undefined
): number | undefined => {
  if (reachedYear === undefined) return undefined;

  const index = yearly.findIndex((row) => row.year === reachedYear);
  return index < 0 ? undefined : index + 1;
};
