import { useParams } from 'react-router-dom';
import { useIsLoggedInAtomValue } from '@/jotai/community';
import { useCommunityAuth } from '@/components/community';
import CommunityWriteView from './CommunityWritePage.view';
import { useScenarioComposer } from './hooks';

/**
 * 글쓰기 `/community/new` + 수정 `/community/:id/edit` 컨테이너.
 * 라우트 파라미터 `id` 유무로 신규/수정 모드를 결정한다.
 */
export default function CommunityWritePage() {
  const { id } = useParams<{ id?: string }>();
  const composer = useScenarioComposer(id);
  const isLoggedIn = useIsLoggedInAtomValue();
  const { authReady, login } = useCommunityAuth();

  return (
    <CommunityWriteView
      viewModel={{
        composer,
        authReady,
        isLoggedIn,
        onLogin: (provider) => void login(provider)
      }}
    />
  );
}
