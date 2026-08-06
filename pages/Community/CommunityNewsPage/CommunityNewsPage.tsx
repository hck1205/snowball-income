import { useNavigate } from 'react-router-dom';
import { useIsLoggedInAtomValue } from '@/jotai/community';
import { useCommunityAuth } from '@/components/community';
import CommunityNewsView from './CommunityNewsPage.view';
import { useNews } from './hooks';

/**
 * 미디어 뉴스 목록 `/community/news` 컨테이너.
 * 데이터 훅 + 인증을 배선해 뷰에 넘긴다 — 게시판 컨테이너와 같은 모양이다(비로그인은 로그인 유도).
 */
export default function CommunityNewsPage() {
  const news = useNews();
  const isLoggedIn = useIsLoggedInAtomValue();
  const { openLoginPrompt } = useCommunityAuth();
  const navigate = useNavigate();

  const onWrite = () => {
    if (isLoggedIn) navigate('/community/news/share');
    else openLoginPrompt();
  };

  return <CommunityNewsView viewModel={{ ...news, onWrite }} />;
}
