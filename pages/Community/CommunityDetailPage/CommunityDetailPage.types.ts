import type { UseComments, UsePostDetail } from './hooks';

export type CommunityDetailViewModel = {
  detail: UsePostDetail;
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
