export type ScenarioCompareProps = {
  /** 지금 탭 수. 2개 미만이면 비교할 것이 없어 버튼을 그리지 않는다. */
  readonly tabCount: number;
  /** 비교표에서 "이 탭 보기"를 눌렀을 때 — 탭 줄의 선택과 같은 동작(`selectScenarioTab`). */
  readonly onSelectScenario: (scenarioId: string) => void;
};
