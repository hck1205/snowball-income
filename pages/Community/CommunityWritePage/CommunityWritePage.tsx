import { useParams } from 'react-router-dom';
import type { PostKind } from '@/shared/lib/supabase';
import { getSelectablePostCategories } from '@/shared/constants/community';
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
  // 마이그레이션 전/비로그인/컬럼 부재 → 전부 false.
  const isAdmin = useIsCommunityAdmin();
  const { authReady, login } = useCommunityAuth();
  const listPath = kind === 'board' ? '/community/board' : '/community';
  /**
   * 공개/비공개 선택 UI 노출 여부.
   *   · 갤러리(portfolio) : **모두에게** 노출 — 내 포트폴리오를 비공개로 두는 건 정상 사용이다.
   *   · 게시판(board)     : **운영자 전용** — 일반 사용자의 글은 공개로 고정한다.
   * false여도 기존 글의 공개 범위를 강제로 덮지 않는다(composer가 서버 값을 그대로 들고 저장).
   */
  const canChooseVisibility = kind !== 'board' || isAdmin;
  /**
   * 글 종류 선택지 — '공지'는 운영자에게만. 관리자 판정은 게시 설정과 **같은 경로**(isCommunityAdmin)를
   * 쓴다. ⚠ UI 수준 제한이다(RLS 없음, decisions.md §profiles.is_admin).
   */
  // ⚠ 두 번째 인자는 **기준선**(`initialCategory`)이어야 한다 — 라이브 `category`를 넘기면
  //   비운영자가 공지 글을 수정하다 '자유'를 한 번 고르는 순간 '공지' 선택지가 사라져 되돌릴 수 없다.
  const categoryOptions = getSelectablePostCategories(isAdmin, composer.initialCategory);

  return (
    <CommunityWriteView
      viewModel={{
        composer,
        candidates,
        authReady,
        isLoggedIn,
        canChooseVisibility,
        categoryOptions,
        kind,
        listPath,
        onLogin: (provider) => void login(provider)
      }}
    />
  );
}
