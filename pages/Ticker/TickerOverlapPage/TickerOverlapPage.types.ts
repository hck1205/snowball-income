import type { BasketAnalysis } from '@/shared/lib/etfOverlap';

/** 고르기 목록의 한 줄. */
export type OverlapCandidate = {
  readonly ticker: string;
  readonly name: string;
  readonly hasHoldings: boolean;
  readonly inBasket: boolean;
  /** 담으면 중복률이 얼마나 바뀌나(%p). 보유 종목을 아직 못 받았거나 바구니가 비었으면 `null`. */
  readonly preview: number | null;
};

export type OverlapSlot = {
  readonly ticker: string;
  readonly status: 'loading' | 'ready' | 'error';
  /** 보유 종목 기준일. 받기 전이면 `null`. */
  readonly asOfDate: string | null;
};

/** 방금 한 동작과 그 결과 — 중복률이 얼마나 움직였나. */
export type OverlapChange = {
  readonly kind: 'added' | 'removed';
  readonly ticker: string;
  readonly delta: number;
  /** 같은 값이 연달아 나와도 칩이 다시 튀어나오게 하는 열쇠. */
  readonly id: number;
};

export type TickerOverlapViewModel = {
  readonly listStatus: 'loading' | 'ready' | 'error';
  readonly query: string;
  /** 검색 중이면 검색 결과, 아니면 많이 찾는 ETF. */
  readonly candidates: readonly OverlapCandidate[];
  readonly isSearching: boolean;
  readonly slots: readonly OverlapSlot[];
  readonly isAtLimit: boolean;
  /** 보유 종목을 받은 ETF 로만 계산한 결과. */
  readonly analysis: BasketAnalysis;
  /** 계산에 들어간 ETF 수(받는 중·실패한 것은 빠진다). */
  readonly analyzedCount: number;
  readonly change: OverlapChange | null;
  /** 각주의 "기준일 — SCHD 2026-06-30 · …". */
  readonly asOfItems: readonly string[];
};

export type TickerOverlapViewProps = {
  viewModel: TickerOverlapViewModel;
  onQueryChange: (query: string) => void;
  /** 검색창에서 Enter — 맨 위의 담을 수 있는 결과를 담는다. */
  onSubmitQuery: () => void;
  onAdd: (ticker: string) => void;
  onRemove: (ticker: string) => void;
};
