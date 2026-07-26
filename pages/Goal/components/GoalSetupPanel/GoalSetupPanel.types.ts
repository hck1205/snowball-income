export type GoalSetupPanelProps = {
  title: string;
  body: string;
  /** 칩 줄 위 안내("고르면 무슨 일이 일어나는가"). */
  pickLead: string;
  chipsLabel: string;
  inputLabel: string;
  inputPlaceholder: string;
  /** 값이 상한/하한을 벗어났을 때의 안내(공용 상한 상수에서 파생된 문구). */
  invalidMessage: string;
  submitLabel: string;
  ctaLabel: string;
  /**
   * 목표 값을 정해 **시뮬레이터로 넘긴다**(원 단위). 이 패널은 저장하지 않는다 —
   * 값 커밋은 시뮬레이터 안에서만 일어난다(GoalSetupPanel.tsx 주석 참고).
   */
  onCommitTarget: (won: number) => void;
  /** 값 없이 시뮬레이터로 — 목표 입력에 포커스만 옮긴다. */
  onStart: () => void;
};
