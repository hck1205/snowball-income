import { useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useIsLoggedInAtomValue, useSessionAtomValue } from '@/jotai/community';
import { useCommunityAuth } from '@/components/community';
import CommunityDetailView from './CommunityDetailPage.view';
import { useComments, useScenarioDetail } from './hooks';

/**
 * 상세 `/community/:id` 컨테이너. 시나리오/댓글 훅 + 인증을 배선하고,
 * 첨부 CTA는 기존 공유 링크 경로(`?share=`)로 대시보드에 적재한다.
 */
export default function CommunityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isLoggedIn = useIsLoggedInAtomValue();
  const session = useSessionAtomValue();
  const { openLoginPrompt } = useCommunityAuth();

  const onRequireLogin = useCallback(() => openLoginPrompt(), [openLoginPrompt]);

  const detail = useScenarioDetail(id, onRequireLogin);
  const comments = useComments(id);

  const onEdit = useCallback(() => {
    if (id) navigate(`/community/${id}/edit`);
  }, [id, navigate]);

  const onOpenInSimulator = useCallback(() => {
    if (detail.openInSimulatorHref) navigate(detail.openInSimulatorHref);
  }, [detail.openInSimulatorHref, navigate]);

  return (
    <CommunityDetailView
      viewModel={{
        detail,
        comments,
        isLoggedIn,
        currentUserId: session?.user.id ?? null,
        onRequireLogin,
        onEdit,
        onOpenInSimulator
      }}
    />
  );
}
