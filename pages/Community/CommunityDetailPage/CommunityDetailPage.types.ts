import type { UseComments, UseScenarioDetail } from './hooks';

export type CommunityDetailViewModel = {
  detail: UseScenarioDetail;
  comments: UseComments;
  isLoggedIn: boolean;
  currentUserId: string | null;
  onRequireLogin: () => void;
  onEdit: () => void;
  onOpenInSimulator: () => void;
};

export type CommunityDetailViewProps = {
  viewModel: CommunityDetailViewModel;
};
