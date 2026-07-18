import { useState } from 'react';
import { useMatch, useNavigate } from 'react-router-dom';
import ThemePresetSwitcher from '@/components/ThemePresetSwitcher';
import { COMMUNITY_COPY } from '@/shared/constants/community';
import { useIsLoggedInAtomValue } from '@/jotai/community';
import { Button } from '@/components/common';
import { AuthControl } from '@/components/community/AuthControl';
import { useCommunityAuth } from '@/components/community/CommunityAuthProvider';
import { CommunitySearchBar } from '@/components/community/CommunitySearchBar';
import { BackIcon, PencilIcon, SearchIcon } from '@/components/community/CommunityIcons';
import {
  Actions,
  Brand,
  BrandLogo,
  BrandLogoImage,
  BrandWordmark,
  DesktopOnly,
  HeaderInner,
  HeaderRoot,
  MobileSearchBar,
  MobileSearchToggle,
  SearchSlot,
  Spacer,
  ThemeSlot
} from './CommunityHeader.styled';

/**
 * 커뮤니티 전용 sticky 경량 헤더.
 * 브랜드/홈 · ← 시뮬레이터 · (목록에서만) 인라인 검색 · 글쓰기 · 인증 컨트롤.
 */
export default function CommunityHeader() {
  const isListRoute = Boolean(useMatch({ path: '/community', end: true }));
  // 글쓰기 라우트에선 헤더의 '글쓰기' 버튼이 페이지와 중복이라 숨긴다.
  const isWriteRoute = Boolean(useMatch({ path: '/community/write' }));
  const isLoggedIn = useIsLoggedInAtomValue();
  const { openLoginPrompt } = useCommunityAuth();
  const navigate = useNavigate();
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const handleWrite = () => {
    if (!isLoggedIn) {
      openLoginPrompt();
      return;
    }
    navigate('/community/write');
  };

  return (
    <HeaderRoot>
      <HeaderInner>
        <Brand>
          <BrandLogo>
            {/* 메인 헤더(HeaderLogoImage)·파비콘/PWA와 동일한 원형 앱 아이콘 — 32px 프레임을 꽉 채운다.
                워드마크(BrandWordmark)가 브랜드명을 읽어주므로 로고 이미지는 장식(alt="") — MobileMenuDrawer 선례와 동일. */}
            <BrandLogoImage src="/app_icon.png" alt="" width={32} height={32} />
          </BrandLogo>
          <BrandWordmark>{COMMUNITY_COPY.nav.home}</BrandWordmark>
        </Brand>

        {/* 뒤로가기: 목록(/community)에선 시뮬레이터(/)로, 하위 경로(글쓰기/상세)에선 게시판(=커뮤니티 목록)으로 복귀. */}
        <Button
          variant="ghost"
          size="sm"
          startIcon={<BackIcon size={16} />}
          onClick={() => navigate(isListRoute ? '/' : '/community')}
          aria-label={isListRoute ? COMMUNITY_COPY.nav.simulator : COMMUNITY_COPY.nav.community}
        >
          <DesktopOnly>{isListRoute ? COMMUNITY_COPY.nav.simulator : COMMUNITY_COPY.nav.community}</DesktopOnly>
        </Button>

        {isListRoute ? (
          <SearchSlot>
            <CommunitySearchBar />
          </SearchSlot>
        ) : (
          <Spacer />
        )}

        <Actions>
          {isListRoute ? (
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

          {/*
           * 테마 스위처 위치 분기(2026-07-18):
           * - 로그인: 테마는 AuthControl 프로필 드롭다운 안 "테마" 항목으로 이동 → 헤더 슬롯을 숨긴다.
           * - 비로그인: AuthControl은 로그인 버튼만이라 드롭다운이 없다 → 헤더에 그대로 노출해야 테마 접근이 유지된다.
           * 커뮤니티는 드로어가 없어 슬롯이 모바일에서도 팝오버를 재노출한다(ThemeSlot).
           */}
          {!isLoggedIn ? (
            <ThemeSlot>
              <ThemePresetSwitcher />
            </ThemeSlot>
          ) : null}

          <AuthControl />
        </Actions>
      </HeaderInner>

      {isListRoute && mobileSearchOpen ? (
        <MobileSearchBar>
          <CommunitySearchBar autoFocus variant="mobile" />
        </MobileSearchBar>
      ) : null}
    </HeaderRoot>
  );
}
