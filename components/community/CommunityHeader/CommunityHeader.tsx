import { useState } from 'react';
import { useLocation, useMatch, useNavigate } from 'react-router-dom';
import { COMMUNITY_COPY } from '@/shared/constants/community';
import { useIsLoggedInAtomValue } from '@/jotai/community';
import { Button } from '@/components/common';
import AppHeader from '@/components/AppHeader';
import { useCommunityAuth } from '@/components/community/CommunityAuthProvider';
import { CommunitySearchBar } from '@/components/community/CommunitySearchBar';
import { PencilIcon, SearchIcon } from '@/components/community/CommunityIcons';
import {
  COMMUNITY_HEADER_GUTTER,
  DesktopOnly,
  MobileSearchBar,
  MobileSearchToggle,
  SearchSlot
} from './CommunityHeader.styled';

/**
 * 커뮤니티 화면이 공용 `AppHeader` 에 **더하는 것**만 정의한다.
 *
 * 브랜드/홈 · 라우트 링크 · 로그인(AuthControl) · 더보기(⋯)는 전부 `AppHeader` 가 그린다 —
 * 이 파일이 헤더를 다시 조립하던 시절에는 같은 형태가 세 곳에 복제돼 서로 조금씩 갈렸다.
 * 여기 남은 것: (갤러리에서만) 인라인 검색 · 글쓰기 버튼 · 모바일 검색 펼침 바.
 *
 * **"← 목록"은 여기 없다** — 본문 첫 줄(`pages/Community/components/CommunityTopBar`)로 내려갔다
 * (2026-07-28 사용자 결정). 헤더에 있던 시절 좁은 폭에서 워드마크·글쓰기·프로필·더보기와 한 줄을 다퉜다.
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
  // 글쓰기 목적지를 가르는 판단 하나만 남았다(목록 복귀 판단은 CommunityTopBar 로 옮겼다).
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
    <AppHeader
      contentGutter={COMMUNITY_HEADER_GUTTER}
      center={
        isGalleryIndex ? (
          <SearchSlot>
            <CommunitySearchBar />
          </SearchSlot>
        ) : null
      }
      actions={
        <>
          {isGalleryIndex ? (
            <MobileSearchToggle
              type="button"
              aria-label={COMMUNITY_COPY.gallery.searchAriaLabel}
              aria-expanded={mobileSearchOpen}
              onClick={() => setMobileSearchOpen((prev) => !prev)}
            >
              <SearchIcon size={18} strokeWidth={1.8} />
            </MobileSearchToggle>
          ) : null}

          {isWriteRoute ? null : (
            <Button
              variant="primary"
              size="sm"
              startIcon={<PencilIcon size={16} strokeWidth={1.8} />}
              onClick={handleWrite}
              aria-label={COMMUNITY_COPY.nav.write}
            >
              <DesktopOnly>{COMMUNITY_COPY.nav.write}</DesktopOnly>
            </Button>
          )}
        </>
      }
      below={
        isGalleryIndex && mobileSearchOpen ? (
          <MobileSearchBar>
            <CommunitySearchBar autoFocus variant="mobile" />
          </MobileSearchBar>
        ) : null
      }
    />
  );
}
