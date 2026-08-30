import type { MutableRefObject, ReactNode } from 'react';
import type { PortfolioViewProps } from '../../PortfolioPage/PortfolioPage.types';

/**
 * 작업대의 props.
 *
 * 🔴 콜백 타입은 **`PortfolioViewProps` 에서 그대로 집어 온다**(`Pick`). 여기서 다시 적으면
 * 시그니처가 조용히 갈라지고, 그건 타입이 있는데도 못 잡는 종류의 드리프트다.
 *
 * ⚠ `onRemove` 는 **부모가 감싼 것**이 내려온다(원본 콜백이 아니다). 지우기 전에 다음 포커스
 *   대상을 정해야 하는데, 그 판단이 이 블록 밖(되돌리기 배너·빈 상태 추가 버튼)과 같은 ref 맵을
 *   봐야 해서 부모가 소유한다.
 */
export type PortfolioWorkbenchProps = Pick<
  PortfolioViewProps,
  'viewModel' | 'onOpenPicker' | 'onQuantityChange' | 'onQuantityBlur' | 'onSimulate'
> & {
  /** 목표 카드. 보유 목록 아래에 붙는다(2026-07-29 순서) — 조립은 부모가 한다. */
  goalCard: ReactNode;
  /** 🔴 포커스 복구를 포함한 지우기. 원본 `onRemove` 가 아니다(위 머리말). */
  onRemove: (ticker: string) => void;
  /** 표의 수량 입력·삭제 버튼을 부모의 ref 맵에 등록한다. */
  registerQuantityInput: (ticker: string, node: HTMLInputElement | null) => void;
  registerDeleteButton: (ticker: string, node: HTMLButtonElement | null) => void;
  /**
   * "추가" 버튼의 ref. 🔴 **부모가 소유한다** — 마지막 행을 지웠을 때 포커스가 갈 곳이라,
   * 그 판단(`onRemove`)과 같은 곳에 있어야 한다.
   */
  addButtonRef: MutableRefObject<HTMLButtonElement | null>;
  /** 종목 고르개 서랍이 열려 있는가(`aria-expanded`). 서랍 자체는 부모가 그린다. */
  isPickerOpen: boolean;
  /** 그 서랍의 id(`aria-controls`). */
  drawerId: string;
};
