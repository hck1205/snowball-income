import type { CommunityOAuthProvider, PostKind } from '@/shared/lib/supabase';
import type { ScenarioCandidates, UsePostComposer } from './hooks';

export type CommunityWriteViewModel = {
  composer: UsePostComposer;
  /** 첨부 택1 후보 목록(read-only) — 워크스페이스 시나리오 탭 전부를 카드로 보여준다. */
  candidates: ScenarioCandidates;
  authReady: boolean;
  isLoggedIn: boolean;
  /** 글이 속한 표면(갤러리/게시판) — 페이지 제목·플레이스홀더 카피 선택에 쓴다. */
  kind: PostKind;
  /** 취소·나가기 시 돌아갈 목록 경로(갤러리='/community', 게시판='/community/board'). */
  listPath: string;
  onLogin: (provider: CommunityOAuthProvider) => void;
};

export type CommunityWriteViewProps = {
  viewModel: CommunityWriteViewModel;
};
