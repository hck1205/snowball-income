import { useLocation, useNavigate } from 'react-router-dom';
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
 * 목록 화면 자신에서는 아무것도 렌더하지 않는다 — 자기 자신으로 돌아가는 링크는 소음이다.
 * 어느 섹션의 목록으로 돌아가는지는 현재 경로가 정한다(아래 `SECTIONS`).
 */
export default function CommunityTopBar({ actions, sticky = false }: CommunityTopBarProps) {
  /* ⚠ 훅은 조건 앞에서 전부 부른다 — 아래 이른 반환보다 위에 있어야 조건부 훅이 되지 않는다. */
  const { pathname } = useLocation();
  const navigate = useNavigate();

  /*
   * 🔴 **섹션 목록을 표로 둔다.** 종전에는 "게시판이면 게시판, 아니면 갤러리"라는 삼항이라,
   *    섹션이 하나 늘자(파이어족들) 그 상세에서 뒤로 가면 갤러리로 튀었다(2026-08-09 사용자 신고).
   *    섹션이 늘 때 **여기 한 줄만 더하면 되게** 표로 바꾼다 — 삼항은 늘 때마다 분기가 겹친다.
   * ⚠ 순서에 뜻은 없다. 다만 접두사가 서로를 포함하지 않아야 한다(`/community/board` 와
   *   `/community/boardgame` 같은 관계가 생기면 앞의 것이 뒤의 것을 먹는다).
   */
  const SECTIONS = ['/community/board', '/community/firenow', '/community/portfolio'] as const;
  const section = SECTIONS.find((base) => pathname === base || pathname.startsWith(`${base}/`));

  /* 목록 화면 자신에서는 아무것도 그리지 않는다 — 자기 자신으로 가는 링크는 소음이다. */
  if (!section || pathname === section) return null;

  const listPath = section;

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
