import type { Ref } from 'react';

/**
 * 입력창 크기.
 *  - `md`(기본) — 표 셀 기준. 40px 높이로 손가락 목표를 넉넉히 잡는다(`/dividend/portfolio` 보유 표).
 *  - `sm` — 목록 행 안에 다른 컨트롤과 나란히 설 때. 72×28px 로 줄여 옆 줄과 키를 맞춘다
 *    (WCAG 2.5.8 최소 목표 24×24 CSS px 는 넘긴다). 숫자 자리는 다섯 자 남는다 —
 *    그보다 긴 값은 오른쪽 정렬이라 뒷자리부터 보인다.
 */
export type QuantityInputSize = 'md' | 'sm';

export type QuantityInputProps = {
  /** 제어 값. **사용자가 타이핑 중인 문자열 그대로**(빈 문자열 허용 — `"1."` 을 숫자로 되돌리면 소수점을 못 찍는다). */
  value: string;
  /** 정규화된 문자열을 돌려준다(숫자 + 소수점 1개, 음수·지수 없음, 소수 4자리까지). */
  onChange: (next: string) => void;
  /**
   * 시각 라벨이 없으므로 **필수**(예: `"SCHD 보유 수량"`). 표 안에서는 열 머리가 시각 라벨을 대신하지만
   * 스크린리더는 셀만 읽으므로 입력 자신이 이름을 가져야 한다.
   */
  ariaLabel: string;
  /** 값 뒤에 붙는 단위 표기(장식, `aria-hidden`). 기본 '주'. */
  suffix?: string;
  /** 사유 문구(행 안내 등)의 id — `aria-describedby` 로 연결한다. */
  describedById?: string;
  /**
   * 입력 DOM 참조. 목록 안에서 행마다 포커스를 옮겨야 하는 호출부가 있어 **콜백 ref 도 받는다**
   * (`RefObject` 만 받으면 행 수만큼 ref 객체를 만들어 들고 다녀야 한다).
   */
  inputRef?: Ref<HTMLInputElement>;
  /** 기본 `md`. 목록 행처럼 높이가 아까운 자리에서만 `sm` 을 쓴다. */
  size?: QuantityInputSize;
  /**
   * 허용 소수 자릿수. 기본은 `QUANTITY_INPUT_DECIMALS`(4).
   * 🔴 **표시 정밀도와 같은 값을 줘라.** 입력이 넷째 자리를 받는데 화면이 둘째 자리까지만 보이면,
   *    포커스를 잃는 순간 방금 친 숫자가 조용히 바뀐 것처럼 보인다.
   */
  decimals?: number;
  disabled?: boolean;
  /**
   * 포커스를 잃었을 때. **표시값 정규화(반올림)는 호출부가 한다** — 이 컴포넌트는 사용자가 친 문자열을
   * 있는 그대로 들고 있고, "정규화된 수량"의 정의는 계산 엔진(`normalizePortfolioQuantity`)이 소유한다.
   */
  onBlur?: () => void;
};
