import { useLocation, useMatch, useNavigate } from 'react-router-dom';
import { Button } from '@/components/common';
import { BackIcon } from '@/components/community/CommunityIcons';
import { COMMUNITY_COPY } from '@/shared/constants/community';
import { TopBarRow } from './CommunityTopBar.styled';
import type { CommunityTopBarProps } from './CommunityTopBar.types';

/**
 * 커뮤니티 하위 화면(상세·글쓰기·프로필·내가 쓴 글)의 **본문 첫 줄**.
 *
 *   [← 목록]                                        [화면별 액션]
 *
 * 2026-07-28 사용자 결정으로 "← 목록"이 헤더에서 여기로 내려왔다. 헤더에 있던 시절 좁은 폭에서
 * 워드마크·글쓰기·프로필·더보기와 한 줄을 다퉜고, 라벨을 데스크톱에서만 노출하는 분기가 필요했다.
 * 본문으로 내려오며 **전 폭에서 라벨을 그대로** 노출한다.
 *
 * 우측 `actions` 는 화면이 채운다(상세의 수정·삭제). 비어 있어도 좌측 정렬은 그대로다 —
 * `space-between` 은 자식이 하나면 그 자식을 왼쪽에 둔다.
 *
 * 목록 화면(갤러리/게시판 인덱스)에서는 아무것도 렌더하지 않는다 — 자기 자신으로 돌아가는 링크는
 * 소음이다. 어느 섹션의 목록으로 돌아가는지는 현재 경로가 정한다.
 */
export default function CommunityTopBar({ actions, sticky = false }: CommunityTopBarProps) {
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
    <TopBarRow $sticky={sticky}>
      {/* 테두리 있는 중립 버튼(secondary) — 텍스트 링크처럼 보이지 않게(사용자 요청 2026-07-28). */}
      <Button
        variant="secondary"
        size="sm"
        startIcon={<BackIcon size={16} strokeWidth={1.8} />}
        onClick={() => navigate(listPath)}
      >
        {COMMUNITY_COPY.nav.list}
      </Button>
      {actions}
    </TopBarRow>
  );
}
