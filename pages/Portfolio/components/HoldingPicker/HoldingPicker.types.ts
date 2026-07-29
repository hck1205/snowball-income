import type { PortfolioUniverseEntry } from '../../utils';

export type HoldingPickerProps = {
  keyword: string;
  onKeywordChange: (keyword: string) => void;
  /** 검색어로 걸러진 목록. 0개면 수동 추가로 안내한다(막다른 길 금지). */
  options: readonly PortfolioUniverseEntry[];
  heldTickers: readonly string[];
  /** 미보유 종목 추가. 드로어는 닫지 않는다(연속 추가). */
  onAdd: (ticker: string) => void;
  /** 이미 보유 중인 종목 — 추가하지 않고 그 행의 수량 입력으로 보낸다. */
  onFocusHeld: (ticker: string) => void;
};
