import { useNavigate } from 'react-router-dom';
import { useIsLoggedInAtomValue } from '@/jotai/community';
import { useCommunityAuth } from '@/components/community';
import CommunityBoardView from './CommunityBoardPage.view';
import { useBoard } from './hooks';

/**
 * 자유게시판 목록 `/community/board` 컨테이너.
 * 게시판 데이터 훅 + 인증을 배선해 뷰에 넘긴다. 비로그인 글쓰기는 로그인 유도 모달을 연다.
 */
export default function CommunityBoardPage() {
  const board = useBoard();
  const isLoggedIn = useIsLoggedInAtomValue();
  const { openLoginPrompt } = useCommunityAuth();
  const navigate = useNavigate();

  const onWrite = () => {
    if (isLoggedIn) navigate('/community/board/write');
    else openLoginPrompt();
  };

  return <CommunityBoardView viewModel={{ ...board, onWrite }} />;
}
