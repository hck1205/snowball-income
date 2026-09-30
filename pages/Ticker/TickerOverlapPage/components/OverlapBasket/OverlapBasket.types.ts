import type { OverlapSlot } from '../../TickerOverlapPage.types';

export type OverlapBasketProps = {
  readonly slots: readonly OverlapSlot[];
  readonly seriesOf: (ticker: string) => string;
  readonly onRemove: (ticker: string) => void;
};
