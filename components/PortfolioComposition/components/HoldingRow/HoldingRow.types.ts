export type HoldingRowProps = {
  /** 이 줄의 종목 id. 콜백을 행마다 새로 만들지 않으려고 값으로 넘긴다(아래 `onChange` 주석). */
  profileId: string;
  /** 낭독용 이름의 주어(`SCHD 보유 주식 수`). 티커 표시명이다. */
  displayName: string;
  /**
   * 🔴 배분 값을 **객체가 아니라 낱값으로** 받는다.
   *
   * `buildAllocationHoldings` 는 호출마다 새 객체를 만든다. 객체째 넘기면 값이 하나도 안 바뀐
   * 줄도 참조가 달라져 `memo` 가 매번 뚫린다 — 커스텀 비교 함수를 붙이는 방법도 있지만, 그건
   * prop 을 하나 더할 때 조용히 낡는 종류의 코드다. 낱값이면 기본 얕은 비교로 정확히 걸린다.
   *
   * 실제로 이 구분이 일한다: 한 종목의 주식 수를 고치면 **다른 종목의 금액·배당은 그대로**이고
   * (절대량 규칙) 비중만 바뀌므로, 건드리지 않은 줄은 리렌더를 건너뛴다.
   */
  shares: number | null;
  amount: number;
  monthlyDividend: number;
  /**
   * 타이핑 중인 원문. `undefined` 면 `shares` 에서 파생한 값을 보여준다.
   * 🔴 파생값을 그대로 물리면 `120.` 같은 **중간 상태를 찍을 수가 없다**(숫자로 접히며 점이 사라진다).
   */
  draftValue: string | undefined;
  /** 금액 표기. 🔴 정밀 포맷터여야 한다 — 근거는 `PortfolioCompositionProps.formatAmount`. */
  formatAmount: (value: number) => string;
  /** 수량 입력이 잠겼을 때 사유를 가리킬 곳. 잠기지 않으면 참조하지 않는다. */
  noticeId: string;
  /**
   * 🔴 **행마다 새 함수를 만들지 않는다.** `(next) => onChange(id, next)` 를 JSX 안에서 만들면
   * 매 렌더 새 참조라 위 `memo` 가 무의미해진다. id 를 인자로 받아 부모가 한 번만 만든다.
   */
  onChange: (profileId: string, next: string) => void;
  onBlur: (profileId: string) => void;
};
