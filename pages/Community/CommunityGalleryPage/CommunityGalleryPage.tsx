import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { COMMUNITY_COPY } from '@/shared/constants/community';
import { useIsLoggedInAtomValue, useSetViewTypeWrite, useViewTypeAtomValue } from '@/jotai/community';
import { Banner } from '@/components/common';
import { useCommunityAuth } from '@/components/community';
import CommunityGalleryView from './CommunityGalleryPage.view';
import { GalleryNotice } from './CommunityGalleryPage.styled';
import { useGallery } from './hooks';

/**
 * 목록 `/community` 컨테이너. 갤러리 데이터 훅 + view 취향 atom + 인증을 배선해 뷰에 넘긴다.
 * 회원 탈퇴 성공 후 이동해 오면(navigation state) 목록 상단에 1회성 완료 배너를 띄운다.
 */
export default function CommunityGalleryPage() {
  const gallery = useGallery();
  const viewType = useViewTypeAtomValue();
  const setViewType = useSetViewTypeWrite();
  const isLoggedIn = useIsLoggedInAtomValue();
  const { openLoginPrompt } = useCommunityAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [showDeleted, setShowDeleted] = useState(
    Boolean((location.state as { accountDeleted?: boolean } | null)?.accountDeleted)
  );

  // 새로고침/뒤로가기로 배너가 되살아나지 않게 history state 를 한 번 비운다.
  useEffect(() => {
    if ((location.state as { accountDeleted?: boolean } | null)?.accountDeleted) {
      navigate(location.pathname, { replace: true, state: null });
    }
    // 최초 1회만 — 위 replace 로 location.state 는 즉시 비워진다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onWrite = () => {
    if (isLoggedIn) navigate('/community/write');
    else openLoginPrompt();
  };

  return (
    <>
      {showDeleted ? (
        <GalleryNotice>
          <Banner
            tone="info"
            role="status"
            onDismiss={() => setShowDeleted(false)}
            dismissAriaLabel={COMMUNITY_COPY.profile.deleteDoneDismiss}
          >
            {COMMUNITY_COPY.profile.deleteDone}
          </Banner>
        </GalleryNotice>
      ) : null}
      <CommunityGalleryView
        viewModel={{
          ...gallery,
          viewType,
          onToggleView: setViewType,
          onWrite
        }}
      />
    </>
  );
}
