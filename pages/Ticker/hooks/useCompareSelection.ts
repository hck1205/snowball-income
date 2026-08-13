import { useCallback, useMemo } from 'react';
import { useCompareSelectionAtomValue, useSetCompareSelectionWrite } from '@/jotai/compare';
import {
  MAX_COMPARE_TICKERS,
  MIN_COMPARE_TICKERS,
  addTickerWithEviction,
  buildCompareHref,
  isComparableTicker,
  removeTicker
} from '../utils';
import type { CompareEntryPoint } from '../utils';

export type CompareSelection = {
  /** 고른 순서 그대로. `TickerSelectorBar` 에 그대로 넘긴다. */
  readonly selected: readonly string[];
  readonly max: number;
  readonly min: number;
  /** `/ticker/compare?t=...&from=...`. 선택이 바뀔 때만 다시 만든다. */
  readonly href: string;
  readonly isSelected: (ticker: string) => boolean;
  /** 비교 표가 열 수 없는 종목인가. 체크박스를 끄는 조건. */
  readonly isDisabled: (ticker: string) => boolean;
  readonly toggle: (ticker: string) => void;
  readonly remove: (ticker: string) => void;
  readonly clear: () => void;
};

/**
 * 유입 화면이 종목을 골라 `/ticker/compare` 로 보내는 **연결부**(기획서 연결①).
 *
 * 상태(sessionStorage)·유니버스 판정·주소 조립을 한 자리에 모은다. 화면은 이 훅이 주는 것을
 * `TickerSelectorCheckbox` / `TickerSelectorBar` 에 꽂기만 한다 — 여섯 화면이 같은 규칙을
 * 각자 구현하면 그중 하나는 반드시 상한이나 `from` 을 빠뜨린다.
 *
 * 🔴 이 훅이 `pages/Ticker` 에 사는 이유는 **번들 경계**다. 유니버스(프리셋 218종)를 아는 코드는
 * 비교 화면 쪽에 모아 두고, 공용 배럴(`@/components/common`)에는 유니버스를 모르는 UI 만 둔다.
 * 다른 화면이 `@/pages/Ticker/hooks` 를 쓰는 것은 이미 있는 의존 방향이다(`useDocumentMeta`).
 *
 * @param from 어느 화면에서 보냈는지. `?from=` 으로 실려 가 유입 화면별 기여도를 가른다.
 */
export const useCompareSelection = (from: CompareEntryPoint): CompareSelection => {
  const selected = useCompareSelectionAtomValue();
  const setSelected = useSetCompareSelectionWrite();

  const href = useMemo(() => buildCompareHref(selected, from), [selected, from]);

  const isSelected = useCallback((ticker: string) => selected.includes(ticker.trim().toUpperCase()), [selected]);

  /*
   * 판정은 순수 함수라 메모가 필요 없어 보이지만, 표의 스무 줄이 렌더마다 이 함수를 부른다.
   * `useCallback` 은 함수 정체성을 고정해 체크박스가 불필요하게 리렌더되는 것을 막는다.
   */
  const isDisabled = useCallback((ticker: string) => !isComparableTicker(ticker), []);

  const toggle = useCallback(
    (ticker: string) => {
      /*
       * 🔴 담기 직전에 한 번 더 유니버스를 확인한다. 체크박스가 꺼져 있어도 키보드·확장프로그램·
       *    테스트가 `onToggle` 을 직접 부를 수 있고, 그렇게 들어온 티커는 비교 화면에서 조용히
       *    사라져 "네 개 골랐는데 세 개만 열리는" 화면이 된다.
       */
      if (!isComparableTicker(ticker)) return;
      setSelected((current) =>
        current.includes(ticker.trim().toUpperCase())
          ? removeTicker(current, ticker)
          : addTickerWithEviction(current, ticker)
      );
    },
    [setSelected]
  );

  const remove = useCallback((ticker: string) => setSelected((current) => removeTicker(current, ticker)), [setSelected]);

  const clear = useCallback(() => setSelected([]), [setSelected]);

  return {
    selected,
    max: MAX_COMPARE_TICKERS,
    min: MIN_COMPARE_TICKERS,
    href,
    isSelected,
    isDisabled,
    toggle,
    remove,
    clear
  };
};
