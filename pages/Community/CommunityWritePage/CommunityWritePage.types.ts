import type { CommunityOAuthProvider, PostCategory, PostKind } from '@/shared/lib/supabase';
import type { ScenarioCandidates, UsePostComposer } from './hooks';

export type CommunityWriteViewModel = {
  composer: UsePostComposer;
  /** 첨부 택1 후보 목록(read-only) — 워크스페이스 시나리오 탭 전부를 카드로 보여준다. */
  candidates: ScenarioCandidates;
  authReady: boolean;
  isLoggedIn: boolean;
  /**
   * 공개/비공개 선택 UI(게시 설정 섹션)를 노출할지. 컨테이너가 kind × 운영자 여부로 계산한다:
   * 갤러리(portfolio)=항상 true, 게시판(board)=운영자만 true.
   * false면 신규 글은 공개로 고정, 수정 글은 서버에서 온 기존 공개 범위를 그대로 유지한다.
   */
  canChooseVisibility: boolean;
  /**
   * 글 종류 드롭다운에 보여줄 선택지(순서 포함). 컨테이너가 운영자 여부로 접어 내려준다:
   * 비운영자=자유·건의사항 2개, 운영자=+공지 3개. 수정 중인 글의 현재 값이 목록에 없으면
   * 그 값이 뒤에 덧붙어 있다(선택지가 없어 값이 조용히 리셋되는 것을 막는다).
   * 드롭다운 자체의 렌더 여부는 `composer.categoryAllowed`(게시판 전용)가 정한다.
   */
  categoryOptions: readonly PostCategory[];
  /** 글이 속한 표면(갤러리/게시판) — 페이지 제목·플레이스홀더 카피 선택에 쓴다. */
  kind: PostKind;
  /** 취소·나가기 시 돌아갈 목록 경로(갤러리='/community', 게시판='/community/board'). */
  listPath: string;
  onLogin: (provider: CommunityOAuthProvider) => void;
};

export type CommunityWriteViewProps = {
  viewModel: CommunityWriteViewModel;
};
