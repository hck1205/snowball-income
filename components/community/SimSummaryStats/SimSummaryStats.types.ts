import type { ScenarioSimSummary } from '@/shared/lib/snowball';

/**
 * §H 필드 계약(`ScenarioSimSummary`)의 정본은 `shared/lib/snowball`(SnowballScenarioSummary)이다 —
 * 이 컴포넌트는 소비자로서 타입만 가져온다. 값은 게시 시점 저장분 그대로 표시하고
 * 재계산하지 않는다(투입 대비 배수만 표시 시점 파생 — `SimSummaryStats.utils.ts`).
 */
export type SimSummaryStatsVariant = 'card' | 'attach' | 'row';

export type SimSummaryStatsProps = {
  /** 게시 시점 시뮬 요약(`scenarios.sim_summary`, 스펙 §H). */
  summary: ScenarioSimSummary;
  /**
   * card: 카드 프리뷰(hero + 보조 2 + 달성 배지, 세로 스택)
   * attach: 글쓰기 첨부 한 줄 — `월 배당 · 자산 · n년`
   * row: 리스트 행 숫자 클러스터(§B안) — hero 월배당(xl) + 목표 배지 + 보조 체인, surfaceSunken 칩 안
   */
  variant: SimSummaryStatsVariant;
};
