import { useState } from 'react';
import { useLocation, useMatch, useNavigate } from 'react-router-dom';
import { COMMUNITY_COPY } from '@/shared/constants/community';
import { useIsLoggedInAtomValue } from '@/jotai/community';
import { Button } from '@/components/common';
import HeaderOverflowMenu from '@/components/HeaderOverflowMenu';
import { PrimaryNav, PrimaryNavLinks } from '@/components/PrimaryNav';
import { AuthControl } from '@/components/community/AuthControl';
import { useCommunityAuth } from '@/components/community/CommunityAuthProvider';
import { CommunitySearchBar } from '@/components/community/CommunitySearchBar';
import { PencilIcon, SearchIcon } from '@/components/community/CommunityIcons';
import {
  Actions,
  BrandSlot,
  ControlsRow,
  DesktopOnly,
  HeaderInner,
  HeaderRoot,
  MobileSearchBar,
  MobileSearchToggle,
  SearchSlot
} from './CommunityHeader.styled';

/**
 * 커뮤니티 전용 sticky 경량 헤더.
 *
 * 브랜드/홈 + 라우트 링크(시뮬레이터·갤러리·게시판)는 전역 nav(PrimaryNav)가 담당한다.
 * 나머지: (갤러리에서만) 인라인 검색 · 글쓰기 · 인증 컨트롤 · 더보기(⋯: 앱 설치 + 테마, 튜토리얼 제외).
 *
 * **"← 목록"은 여기 없다** — 본문 첫 줄(`CommunityLayout` 의 `BackToList`)로 내려갔다(2026-07-28 사용자
 * 결정). 헤더에 있던 시절 좁은 폭에서 워드마크·글쓰기·프로필·더보기와 한 줄을 다퉜다.
 */
export default function CommunityHeader() {
  const isGalleryIndex = Boolean(useMatch({ path: '/community/portfolio', end: true }));
  // 글쓰기 라우트에선 헤더의 '글쓰기' 버튼이 페이지와 중복이라 숨긴다(갤러리/게시판 양쪽).
  //
  // ⚠ 두 `useMatch`를 `||`로 **한 식에 묶지 말 것** — `||`는 단축 평가라 앞이 참이면 뒤의 훅이
  //   아예 호출되지 않는다(= 조건부 훅). 글쓰기 경로에서만 훅 개수가 하나 모자라져 바로 다음
  //   훅(useAtomValue)이 큐를 못 찾고 "Should have a queue" / 프로덕션 React #311로 화면이 죽는다.
  //   훅 호출을 각 줄에 고정하고 boolean 연산은 그 뒤에 한다.
  const isPortfolioWriteRoute = Boolean(useMatch({ path: '/community/portfolio/write' }));
  const isBoardWriteRoute = Boolean(useMatch({ path: '/community/board/write' }));
  const isWriteRoute = isPortfolioWriteRoute || isBoardWriteRoute;

  const { pathname } = useLocation();
  // 글쓰기 목적지를 가르는 판단 하나만 남았다(목록 복귀 판단은 BackToList 로 옮겼다).
  const inBoard = pathname === '/community/board' || pathname.startsWith('/community/board/');

  const isLoggedIn = useIsLoggedInAtomValue();
  const { openLoginPrompt } = useCommunityAuth();
  const navigate = useNavigate();
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const handleWrite = () => {
    if (!isLoggedIn) {
      openLoginPrompt();
      return;
    }
    navigate(inBoard ? '/community/board/write' : '/community/portfolio/write');
  };

  return (
    <HeaderRoot>
      <HeaderInner>
        {/* 1줄(2026-07-25 개편) — 브랜드는 컨트롤 줄 1열로, 라우트 메뉴는 아랫줄로. */}
        {/* 2번째 줄 — 뒤로가기(1열) · 가운데 검색(2열) · 우측 액션(3열).
            1줄째 PrimaryNav와 동일한 3컬럼 그리드라 두 줄의 가운데 중심선이 일치한다. */}
        <ControlsRow>
          {/* 뒤로가기: 목록 화면(갤러리/게시판 인덱스)에선 nav 링크가 이동을 담당하므로 숨기고,
              상세/글쓰기 등 하위 경로에서만 "← 목록"으로 자기 섹션 목록에 복귀한다.
              숨겨도 1열 트랙은 그대로 남아 가운데 검색 위치는 변하지 않는다. */}
          <BrandSlot>
            <PrimaryNav withLinks={false} />
          </BrandSlot>

          {isGalleryIndex ? (
            <SearchSlot>
              <CommunitySearchBar />
            </SearchSlot>
          ) : null}

          <Actions>
            {isGalleryIndex ? (
              <MobileSearchToggle
                type="button"
                aria-label={COMMUNITY_COPY.gallery.searchAriaLabel}
                aria-expanded={mobileSearchOpen}
                onClick={() => setMobileSearchOpen((prev) => !prev)}
              >
                <SearchIcon size={18} />
              </MobileSearchToggle>
            ) : null}

            {isWriteRoute ? null : (
              <Button
                variant="primary"
                size="sm"
                startIcon={<PencilIcon size={16} />}
                onClick={handleWrite}
                aria-label={COMMUNITY_COPY.nav.write}
              >
                <DesktopOnly>{COMMUNITY_COPY.nav.write}</DesktopOnly>
              </Button>
            )}

            <AuthControl />

            {/* 더보기(⋯) — 앱 설치 + 테마만. 커뮤니티엔 코치마크 투어가 없으므로 튜토리얼 항목을 뺀다(showTutorial={false}).
                기존 standalone 테마 스위처는 이 메뉴로 흡수했다(시뮬레이터 헤더와 동일 패턴 — 테마 접근점 단일화). */}
            <HeaderOverflowMenu showTutorial={false} />
          </Actions>
        </ControlsRow>
        <PrimaryNavLinks />
      </HeaderInner>

      {isGalleryIndex && mobileSearchOpen ? (
        <MobileSearchBar>
          <CommunitySearchBar autoFocus variant="mobile" />
        </MobileSearchBar>
      ) : null}
    </HeaderRoot>
  );
}
