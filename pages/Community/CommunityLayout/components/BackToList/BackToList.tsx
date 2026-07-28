import { useLocation, useMatch, useNavigate } from 'react-router-dom';
import { Button } from '@/components/common';
import { BackIcon } from '@/components/community/CommunityIcons';
import { COMMUNITY_COPY } from '@/shared/constants/community';
import { BackRow } from './BackToList.styled';

/**
 * "← 목록" — **본문 최상단**의 복귀 링크(2026-07-28 사용자 결정: 헤더가 아니라 콘텐츠에 둔다).
 *
 * 헤더에 있던 시절에는 좁은 폭에서 워드마크·글쓰기·프로필·더보기와 같은 줄을 다퉜고, 라벨을
 * 데스크톱에서만 보여주는 분기(`DesktopOnly`)까지 필요했다. 본문 첫 줄로 내려오면서 **전 폭에서
 * 라벨을 그대로 노출**한다 — 아이콘만 남는 구간이 사라졌다.
 *
 * 목록 화면(갤러리/게시판 인덱스)에서는 렌더하지 않는다 — 자기 자신으로 돌아가는 링크는 소음이다.
 * 그 판단(어느 섹션의 목록으로 돌아가는가)은 헤더가 하던 것을 그대로 옮겨 왔다.
 */
export default function BackToList() {
  // ⚠ 두 `useMatch` 를 `||` 로 한 식에 묶지 말 것 — 단축 평가로 뒤 훅이 호출되지 않으면 조건부 훅이 된다
  //   (CommunityHeader 가 같은 함정을 주석으로 남겨 뒀다).
  const isGalleryIndex = Boolean(useMatch({ path: '/community/portfolio', end: true }));
  const isBoardIndex = Boolean(useMatch({ path: '/community/board', end: true }));
  const { pathname } = useLocation();
  const navigate = useNavigate();

  if (isGalleryIndex || isBoardIndex) return null;

  const inBoard = pathname === '/community/board' || pathname.startsWith('/community/board/');
  const listPath = inBoard ? '/community/board' : '/community/portfolio';

  return (
    <BackRow>
      <Button
        variant="ghost"
        size="sm"
        startIcon={<BackIcon size={16} />}
        onClick={() => navigate(listPath)}
      >
        {COMMUNITY_COPY.nav.list}
      </Button>
    </BackRow>
  );
}
