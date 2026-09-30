import type { OverlapSlot } from '../../TickerOverlapPage.types';

export type OverlapBasketProps = {
  readonly slots: readonly OverlapSlot[];
  readonly seriesOf: (ticker: string) => string;
  readonly isEqualWeight: boolean;
  readonly onRemove: (ticker: string) => void;
  readonly onWeightChange: (ticker: string, weight: number) => void;
  readonly onEqualize: () => void;
};
