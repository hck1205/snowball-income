import { useNavigate } from 'react-router-dom';
// per-icon named import(트리셰이킹) → 엔트리에는 Users 아이콘 하나만 실린다.
import { Users } from 'lucide-react';
import { COMMUNITY_COPY } from '@/shared/constants/community';
import { isCommunityEnabled } from '@/shared/lib/supabase';
import { Button } from '@/components/common';
import { NavLabel } from './CommunityNavLink.styled';

/**
 * 대시보드(`/`) 헤더의 커뮤니티 진입점.
 *
 * 옆의 튜토리얼 버튼(TourGuide)과 **같은 프리미티브 `Button`(secondary·sm, 아이콘+라벨)** 을 써서
 * 두 진입점이 시각적으로 완전히 통일된다. 모바일(mobileWide↓)에선 라벨을 접어 아이콘 버튼이 된다.
 *
 * ⚠ 이 컴포넌트는 엔트리 번들에 들어간다. 그래서 커뮤니티 배럴(`@/components/community`)이나
 *   `CommunityIcons`(아이콘 세트 모듈 전체)·supabase-js/Tiptap을 끌어오는 모듈을 import하지 않는다.
 *   아이콘은 `lucide-react`에서 **직접**(per-icon) 가져와 Users 하나만 엔트리에 실리게 한다
 *   (MainRightPanel의 프리셋 아이콘과 동일한 패턴). 비활성이면 아무것도 렌더하지 않는다.
 */
export default function CommunityNavLink() {
  // 플래그 가드는 훅 호출보다 먼저 둔다 — 비활성(대시보드 단독 렌더, Router 없음) 환경에서
  // useNavigate가 호출되지 않게 한다. isCommunityEnabled는 앱 수명 동안 상수라 훅 순서는 안정적이다.
  if (!isCommunityEnabled) return null;
  return <CommunityNavButton />;
}

function CommunityNavButton() {
  const navigate = useNavigate();
  return (
    <Button
      variant="secondary"
      size="sm"
      startIcon={<Users size={16} strokeWidth={1.8} aria-hidden focusable={false} />}
      aria-label={COMMUNITY_COPY.nav.community}
      onClick={() => navigate('/community')}
    >
      <NavLabel>{COMMUNITY_COPY.nav.community}</NavLabel>
    </Button>
  );
}
