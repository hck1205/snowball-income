import type { DividendListSummary } from '../utils';

export type DividendListHubViewModel = {
  summaries: DividendListSummary[];
};

export type DividendListHubViewProps = {
  viewModel: DividendListHubViewModel;
};
