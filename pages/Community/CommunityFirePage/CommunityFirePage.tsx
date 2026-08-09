import { useNavigate } from 'react-router-dom';
import { useIsCommunityAdmin, useIsLoggedInAtomValue } from '@/jotai/community';
import { useCommunityAuth } from '@/components/community';
import { canWriteCommunityFire } from '@/shared/constants/community';
import CommunityNewsView from './CommunityFirePage.view';
import { useFirePosts } from './hooks';

/**
 * 미디어 뉴스 목록 `/community/firenow` 컨테이너.
 * 데이터 훅 + 인증을 배선해 뷰에 넘긴다 — 게시판 컨테이너와 같은 모양이다(비로그인은 로그인 유도).
 *
 * ⚠ 목록을 **볼** 권한은 여기서 보지 않는다 — 라우트 부모(`CommunityNewsGate`)가 이미 걸렀다.
 *   여기서 보는 것은 **쓸** 권한 하나다(2026-08-08 결정으로 운영자 전용).
 */
export default function CommunityFirePage() {
  const news = useFirePosts();
  const isLoggedIn = useIsLoggedInAtomValue();
  const isAdmin = useIsCommunityAdmin();
  const { openLoginPrompt } = useCommunityAuth();
  const navigate = useNavigate();

  const canWrite = canWriteCommunityFire(isAdmin);

  const onWrite = () => {
    if (isLoggedIn) navigate('/community/firenow/share');
    else openLoginPrompt();
  };

  return <CommunityNewsView viewModel={{ ...news, canWrite, onWrite }} />;
}
