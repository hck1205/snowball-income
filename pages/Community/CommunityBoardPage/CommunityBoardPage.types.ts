import type { UseBoardResult } from './hooks';

export type CommunityBoardViewModel = UseBoardResult & {
  onWrite: () => void;
};

export type CommunityBoardViewProps = {
  viewModel: CommunityBoardViewModel;
};
