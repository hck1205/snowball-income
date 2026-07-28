import type { ShareChannelId } from '@/components/common';
import type { ShareTarget } from '@/components/community/hooks';
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
  /** 이 글의 공개 상세 URL을 공유(터치=OS 시트, 그 외=공유 창). */
  onShare: () => void;
  /** 복사 폴백 토스트 메시지(빈 문자열이면 미노출). */
  shareToastMessage: string;
  /** 데스크톱 공유 창의 대상. `null`/`undefined` 면 창은 닫혀 있다. */
  shareTarget: ShareTarget | null;
  /** 직전 복사 성공 여부 — 공유 창 버튼 라벨이 이걸로 바뀐다. */
  isShareLinkCopied: boolean;
  onCopyShareLink: () => void | Promise<void>;
  onSelectShareChannel: (channel: ShareChannelId) => void;
  onCloseShare: () => void;
};

export type CommunityDetailViewProps = {
  viewModel: CommunityDetailViewModel;
};
