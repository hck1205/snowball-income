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
  /**
   * 목표 값을 정해 **시뮬레이터로 넘긴다**(원 단위). 이 패널은 저장하지 않는다 —
   * 값 커밋은 시뮬레이터 안에서만 일어난다(GoalSetupPanel.tsx 주석 참고).
   *
   * ⚠ 이 패널의 출구는 이것 하나다. "값을 정하러 다른 화면으로" 보내는 하단 CTA 프롭
   * (`ctaLabel`·`onStart`)이 있었지만, 유일한 소비처였던 구 `/dividend/goal` 화면이
   * 내 포트폴리오의 목표 달성 카드로 흡수되며 호출부가 사라져 제거했다 — 같은 패널 안에
   * 칩·직접 입력이 이미 있는 화면에서는 다른 화면으로 보내는 버튼이 소음이다.
   */
  onCommitTarget: (won: number) => void;
};
