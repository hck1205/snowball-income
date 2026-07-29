export type GoalMeterProps = {
  /**
   * 0~100 정수. **`null`이면 아직 값이 없다**(로딩) — 이때는 `role="progressbar"`를 붙이지 않는다.
   * 값 없는 progressbar는 스크린리더에 "0%"로 읽혀 거짓말이 된다.
   */
  percent: number | null;
  label: string;
  /** progressbar 접근명. 카드 문맥 없이도 무엇의 비율인지 읽히게 한다. */
  ariaLabel: string;
  /** 값 없음 표기(로딩). */
  emptyValue: string;
  /** 미터 아래 병기 문장 — 색·바를 못 보는 사용자에게 같은 사실을 문장으로 전한다. */
  sentence: string | null;
  /** 큰 퍼센트 숫자 문자열(예: '31%'). `percent`가 null이면 무시된다. */
  valueText: string | null;
};
