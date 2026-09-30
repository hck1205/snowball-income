import type { BasketAnalysis } from '@/shared/lib/etfOverlap';
import type { OverlapChange } from '../../TickerOverlapPage.types';

export type OverlapVerdictProps = {
  readonly analysis: BasketAnalysis;
  /** 계산에 들어간 ETF 수 — 결론 문장의 단계(하나뿐 / 둘 이상)를 가른다. */
  readonly analyzedCount: number;
  readonly change: OverlapChange | null;
};
