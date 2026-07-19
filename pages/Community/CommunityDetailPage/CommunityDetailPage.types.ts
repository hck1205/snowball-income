import type { UseComments, UsePostDetail } from './hooks';

export type CommunityDetailViewModel = {
  detail: UsePostDetail;
  comments: UseComments;
  isLoggedIn: boolean;
  currentUserId: string | null;
  /** 목록 복귀 경로(갤러리='/community', 게시판='/community/board') — notfound CTA용. */
  listPath: string;
  onRequireLogin: () => void;
  onEdit: () => void;
  onOpenInSimulator: () => void;
};

export type CommunityDetailViewProps = {
  viewModel: CommunityDetailViewModel;
};
