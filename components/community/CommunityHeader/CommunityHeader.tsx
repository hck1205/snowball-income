import { useState } from 'react';
import { useLocation, useMatch, useNavigate } from 'react-router-dom';
import { COMMUNITY_COPY } from '@/shared/constants/community';
import { useIsLoggedInAtomValue } from '@/jotai/community';
import { Button } from '@/components/common';
import HeaderOverflowMenu from '@/components/HeaderOverflowMenu';
import { PrimaryNav } from '@/components/PrimaryNav';
import { AuthControl } from '@/components/community/AuthControl';
import { useCommunityAuth } from '@/components/community/CommunityAuthProvider';
import { CommunitySearchBar } from '@/components/community/CommunitySearchBar';
import { BackIcon, PencilIcon, SearchIcon } from '@/components/community/CommunityIcons';
import {
  Actions,
  BackSlot,
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
 * 나머지: (하위 경로에서만) ← 목록 복귀 · (갤러리에서만) 인라인 검색 · 글쓰기 · 인증 컨트롤 ·
 * 더보기(⋯: 앱 설치 + 테마, 튜토리얼 제외).
 *
 * 갤러리(`/community`)와 게시판(`/community/board`)이 각자 목록 화면이라, 두 목록에선 뒤로가기를
 * 숨기고 nav 링크가 이동을 담당한다. 상세/글쓰기 등 하위 경로에서만 "← 목록"으로 자기 섹션 목록에 돌아간다.
 */
export default function CommunityHeader() {
  const isGalleryIndex = Boolean(useMatch({ path: '/community/portfolio', end: true }));
  const isBoardIndex = Boolean(useMatch({ path: '/community/board', end: true }));
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
  const inBoard = pathname === '/community/board' || pathname.startsWith('/community/board/');
  const listPath = inBoard ? '/community/board' : '/community/portfolio';
  const isIndex = isGalleryIndex || isBoardIndex;

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
        <PrimaryNav />

        {/* 2번째 줄 — 뒤로가기(1열) · 가운데 검색(2열) · 우측 액션(3열).
            1줄째 PrimaryNav와 동일한 3컬럼 그리드라 두 줄의 가운데 중심선이 일치한다. */}
        <ControlsRow>
          {/* 뒤로가기: 목록 화면(갤러리/게시판 인덱스)에선 nav 링크가 이동을 담당하므로 숨기고,
              상세/글쓰기 등 하위 경로에서만 "← 목록"으로 자기 섹션 목록에 복귀한다.
              숨겨도 1열 트랙은 그대로 남아 가운데 검색 위치는 변하지 않는다. */}
          {isIndex ? null : (
            <BackSlot>
              <Button
                variant="ghost"
                size="sm"
                startIcon={<BackIcon size={16} />}
                onClick={() => navigate(listPath)}
                aria-label={COMMUNITY_COPY.nav.list}
              >
                <DesktopOnly>{COMMUNITY_COPY.nav.list}</DesktopOnly>
              </Button>
            </BackSlot>
          )}

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
      </HeaderInner>

      {isGalleryIndex && mobileSearchOpen ? (
        <MobileSearchBar>
          <CommunitySearchBar autoFocus variant="mobile" />
        </MobileSearchBar>
      ) : null}
    </HeaderRoot>
  );
}
