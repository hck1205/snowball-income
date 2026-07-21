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
  /** 공유 버튼 노출 여부 — 갤러리(portfolio)만 true, 게시판(board)은 false. */
  canShare: boolean;
  /** 이 글의 공개 상세 URL을 공유(네이티브 시트 또는 클립보드 복사). */
  onShare: () => void;
  /** 복사 폴백 토스트 메시지(빈 문자열이면 미노출). */
  shareToastMessage: string;
};

export type CommunityDetailViewProps = {
  viewModel: CommunityDetailViewModel;
};
