import type { PortfolioFreshnessTone } from '../FreshnessBadge';

/** 표의 한 행 — 값은 전부 **이미 포맷된 문자열**이다(표는 계산하지 않는다). */
export type PortfolioHoldingRowModel = {
  ticker: string;
  /** 한글명(또는 영문명). 직접 추가한 종목은 이름을 저장하지 않아 빈 문자열이다. */
  name: string;
  badge: PortfolioFreshnessTone | null;
  /** `QuantityInput` 의 제어값(사용자가 친 문자열 그대로). */
  quantityInput: string;
  /** 계산에서 빠진 행은 금액 대신 `—`. */
  marketValue: string;
  annualNet: string;
  /** 왜 빠졌는지 한 줄. **에러가 아니다** — danger 색·`role="alert"` 를 쓰지 않는다. */
  note: string | null;
};

export type HoldingsTableProps = {
  rows: readonly PortfolioHoldingRowModel[];
  onQuantityChange: (ticker: string, raw: string) => void;
  onQuantityBlur: (ticker: string) => void;
  onRemove: (ticker: string) => void;
  /**
   * 포커스 이동을 위한 DOM 등록. 삭제 후 다음 행, 실행 취소 후 복원된 행, 드로어에서 "보유 중"을
   * 눌렀을 때의 그 행 — 전부 부모가 이 레지스트리로 포커스를 옮긴다.
   */
  registerQuantityInput: (ticker: string, node: HTMLInputElement | null) => void;
  registerDeleteButton: (ticker: string, node: HTMLButtonElement | null) => void;
};
