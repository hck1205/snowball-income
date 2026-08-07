import { Outlet, useNavigate } from 'react-router-dom';
import { Button } from '@/components/common';
import { useIsCommunityAdmin } from '@/jotai/community';
import { canViewCommunityNews, COMMUNITY_COPY } from '@/shared/constants/community';
import { FeedEmpty } from '../components';

const n = COMMUNITY_COPY.news;

/**
 * 미디어 뉴스 세 라우트(`news` · `news/share` · `news/:id`)의 **접근 게이트**.
 *
 * 왜 라우트 하나를 감싸는 부모로 두었나: 게이트를 세 화면 안에 각각 넣으면 같은 판정이 세 곳으로
 * 흩어지고, 나중에 넷째 화면이 생길 때 **빠뜨리는 자리**가 된다. 여기 한 곳이 통과시키지 않으면
 * 아래로 아무것도 못 간다.
 *
 * 🔴 리다이렉트가 아니라 **안내 면**이다. 주소를 눌러 들어온 사람을 말없이 다른 곳으로 옮기면
 *   "내가 뭘 잘못 눌렀나"가 되고, 뒤로가기가 튕긴다. 여기서 무슨 일인지 말하고 출구를 준다.
 *
 * ⚠ 운영자는 **한 박자 늦게** 통과한다. `profileAtom` 은 세션 하이드레이션 뒤 비동기로 채워져서
 *   (CommunityAuthProvider.syncProfile), 첫 프레임의 `isAdmin` 은 아직 false 다 → 운영자도 안내
 *   면을 잠깐 본 뒤 내용으로 바뀐다. "프로필 조회 중"을 따로 기다리지 않은 이유: 그 신호가
 *   지금 없고(authReady 는 세션까지만 본다), 조회가 **실패하면** 영영 null 이라 기다리는 쪽은
 *   무한 로딩으로 굳는다. 잘못된 화면으로 튕기지 않으면서 막히지도 않는 쪽을 골랐다.
 */
export default function CommunityNewsGate() {
  const isAdmin = useIsCommunityAdmin();
  const navigate = useNavigate();

  if (canViewCommunityNews(isAdmin)) return <Outlet />;

  return (
    <section aria-label={n.mainLabel}>
      <FeedEmpty
        title={n.hiddenTitle}
        subtitle={n.hiddenSubtitle}
        action={
          <Button variant="primary" onClick={() => navigate('/community/portfolio')}>
            {n.hiddenAction}
          </Button>
        }
      />
    </section>
  );
}
