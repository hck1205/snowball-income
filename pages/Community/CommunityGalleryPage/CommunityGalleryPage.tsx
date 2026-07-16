import { useNavigate } from 'react-router-dom';
import { useIsLoggedInAtomValue, useSetViewTypeWrite, useViewTypeAtomValue } from '@/jotai/community';
import { useCommunityAuth } from '@/components/community';
import CommunityGalleryView from './CommunityGalleryPage.view';
import { useGallery } from './hooks';

/**
 * 목록 `/community` 컨테이너. 갤러리 데이터 훅 + view 취향 atom + 인증을 배선해 뷰에 넘긴다.
 */
export default function CommunityGalleryPage() {
  const gallery = useGallery();
  const viewType = useViewTypeAtomValue();
  const setViewType = useSetViewTypeWrite();
  const isLoggedIn = useIsLoggedInAtomValue();
  const { openLoginPrompt } = useCommunityAuth();
  const navigate = useNavigate();

  const onWrite = () => {
    if (isLoggedIn) navigate('/community/new');
    else openLoginPrompt();
  };

  return (
    <CommunityGalleryView
      viewModel={{
        ...gallery,
        viewType,
        onToggleView: setViewType,
        onWrite
      }}
    />
  );
}
