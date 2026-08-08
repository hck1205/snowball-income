import type { LedgerViewTab, LedgerViewTabId } from '../../utils';

export type LedgerViewTabsProps = {
  readonly tabs: readonly LedgerViewTab[];
  readonly selected: LedgerViewTabId;
  readonly onSelect: (id: LedgerViewTabId) => void;
};
