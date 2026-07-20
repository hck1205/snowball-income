import { useParams } from 'react-router-dom';
import type { PostKind } from '@/shared/lib/supabase';
import { useIsCommunityAdmin, useIsLoggedInAtomValue } from '@/jotai/community';
import { useCommunityAuth } from '@/components/community';
import CommunityWriteView from './CommunityWritePage.view';
import { useScenarioCandidates, usePostComposer } from './hooks';

export type CommunityWritePageProps = {
  /** 글이 속한 표면. 라우트가 결정한다: 갤러리='portfolio'(기본), 자유게시판='board'. */
  kind?: PostKind;
};

/**
 * 글쓰기 + 수정 컨테이너. 두 표면이 같은 폼을 공유한다:
 *   - 갤러리 : `/community/write`, `/community/:id/edit`             (kind='portfolio')
 *   - 게시판 : `/community/board/write`, `/community/board/:id/edit` (kind='board')
 * 라우트 파라미터 `id` 유무로 신규/수정 모드를 결정한다. kind는 게시·이동 경로에 쓰인다.
 */
export default function CommunityWritePage({ kind = 'portfolio' }: CommunityWritePageProps) {
  const { id } = useParams<{ id?: string }>();
  const composer = usePostComposer(id, kind);
  const candidates = useScenarioCandidates();
  const isLoggedIn = useIsLoggedInAtomValue();
  // 공개/비공개 선택은 운영자 전용 UI다. 마이그레이션 전/비로그인/컬럼 부재 → 전부 false.
  const isAdmin = useIsCommunityAdmin();
  const { authReady, login } = useCommunityAuth();
  const listPath = kind === 'board' ? '/community/board' : '/community';

  return (
    <CommunityWriteView
      viewModel={{
        composer,
        candidates,
        authReady,
        isLoggedIn,
        isAdmin,
        kind,
        listPath,
        onLogin: (provider) => void login(provider)
      }}
    />
  );
}
