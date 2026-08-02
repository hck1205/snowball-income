import type { InvestorCardModel } from '../utils';

export type InvestorsViewModel = {
  readonly cards: readonly InvestorCardModel[];
  /** 스냅샷 수집일. 🔴 인물별 보고 기준일과 **다른 값**이다 — 각 카드가 자기 기준일을 따로 말한다. */
  readonly generatedAt: string;
};

export type InvestorsViewProps = {
  viewModel: InvestorsViewModel;
};
