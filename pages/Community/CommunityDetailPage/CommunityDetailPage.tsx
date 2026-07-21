import { useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { PostKind } from '@/shared/lib/supabase';
import { ANALYTICS_EVENT, track } from '@/shared/lib/analytics';
import { useIsLoggedInAtomValue, useSessionAtomValue } from '@/jotai/community';
import { useCommunityAuth } from '@/components/community';
import { usePostShare } from '@/components/community/hooks';
import CommunityDetailView from './CommunityDetailPage.view';
import { useComments, usePostDetail } from './hooks';

export type CommunityDetailPageProps = {
  /** 상세가 속한 표면. 라우트가 결정한다: 갤러리='portfolio'(기본), 자유게시판='board'. */
  kind?: PostKind;
};

/**
 * 상세 컨테이너 — 갤러리(`/community/:id`)와 게시판(`/community/board/:id`)이 공유한다.
 * 시나리오/댓글 훅 + 인증을 배선하고, 첨부 CTA는 기존 공유 링크 경로(`?share=`)로 대시보드에 적재한다.
 * kind로 섹션 기준 경로(수정/목록 복귀)를 정한다.
 */
export default function CommunityDetailPage({ kind = 'portfolio' }: CommunityDetailPageProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isLoggedIn = useIsLoggedInAtomValue();
  const session = useSessionAtomValue();
  const { openLoginPrompt } = useCommunityAuth();
  const sectionBase = kind === 'board' ? '/community/board' : '/community/portfolio';

  const onRequireLogin = useCallback(() => openLoginPrompt(), [openLoginPrompt]);

  const detail = usePostDetail(id, onRequireLogin, sectionBase);
  const comments = useComments(id);
  const { shareToastMessage, sharePost } = usePostShare();

  // 공유는 공개 SEO 상세 전체에 노출한다 — 갤러리·게시판 둘 다(피드 카드가 둘 다 공유하므로 일관, 사용자 결정).
  const canShare = true;

  const onShare = useCallback(() => {
    const post = detail.post;
    if (!id || !post) return;
    // url 미지정 → 훅이 현재 상세 페이지(window.location.href)를 공유한다.
    void sharePost({ postId: id, kind, title: post.title, placement: 'detail' });
  }, [detail.post, id, kind, sharePost]);

  const onEdit = useCallback(() => {
    if (id) navigate(`${sectionBase}/${id}/edit`);
  }, [id, navigate, sectionBase]);

  const onOpenInSimulator = useCallback(() => {
    if (!detail.openInSimulatorHref) return;
    // "이 시나리오로 시뮬레이션 열기" — 커뮤니티→코어 제품 유입 계측(실제 이동 직전).
    track(ANALYTICS_EVENT.COMMUNITY_TO_SIMULATOR);
    navigate(detail.openInSimulatorHref);
  }, [detail.openInSimulatorHref, navigate]);

  return (
    <CommunityDetailView
      viewModel={{
        detail,
        comments,
        isLoggedIn,
        currentUserId: session?.user.id ?? null,
        listPath: sectionBase,
        onRequireLogin,
        onEdit,
        onOpenInSimulator,
        canShare,
        onShare,
        shareToastMessage
      }}
    />
  );
}
