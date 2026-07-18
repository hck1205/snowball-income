import { useIsLoggedInAtomValue } from '@/jotai/community';
import { useCommunityAuth } from '@/components/community';
import CommunityProfileView from './CommunityProfilePage.view';
import { useProfileEditor } from './hooks';

/**
 * 프로필 설정 `/community/profile` 컨테이너.
 * 편집 상태·IO 훅과 인증 게이트 정보를 배선해 뷰에 넘긴다(컨테이너/뷰 분리).
 */
export default function CommunityProfilePage() {
  const editor = useProfileEditor();
  const isLoggedIn = useIsLoggedInAtomValue();
  const { authReady, login } = useCommunityAuth();

  return (
    <CommunityProfileView
      viewModel={{
        ...editor,
        authReady,
        isLoggedIn,
        onLogin: (provider) => void login(provider)
      }}
    />
  );
}
