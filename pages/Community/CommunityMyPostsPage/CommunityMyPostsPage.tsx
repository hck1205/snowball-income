import { useIsLoggedInAtomValue } from '@/jotai/community';
import { useCommunityAuth } from '@/components/community';
import CommunityMyPostsView from './CommunityMyPostsPage.view';

/**
 * "내가 쓴 글" `/community/my-posts` 컨테이너 — 인증 게이트 정보를 배선해 뷰에 넘긴다.
 *
 * 프로필 설정 안의 섹션이 아니라 **독립 화면**인 이유: 갤러리/게시판 목록은 `is_public = true`
 * 로 걸러지므로 비공개 글을 볼 곳이 여기뿐이고, 닉네임·탈퇴(계정 관리)와는 성격이 다르다.
 * 진입점은 프로필 드롭다운(AuthControl)의 "내가 쓴 글".
 */
export default function CommunityMyPostsPage() {
  const isLoggedIn = useIsLoggedInAtomValue();
  const { authReady, login } = useCommunityAuth();

  return (
    <CommunityMyPostsView
      viewModel={{
        authReady,
        isLoggedIn,
        onLogin: (provider) => void login(provider)
      }}
    />
  );
}
