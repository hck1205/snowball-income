import { useEffect, useId, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
// per-icon named import(트리셰이킹) — ThemePresetSwitcher와 같은 Palette 아이콘을 공유한다.
import { Palette } from 'lucide-react';
import { COMMUNITY_COPY } from '@/shared/constants/community';
import { useIsLoggedInAtomValue, useProfileAtomValue } from '@/jotai/community';
import ThemePresetSwitcher from '@/components/ThemePresetSwitcher';
import { Button } from '@/components/common';
import { Avatar } from '@/components/community/Avatar';
import { useCommunityAuth } from '@/components/community/CommunityAuthProvider';
import { ChartIcon, ChevronDownIcon, UserRoundIcon } from '@/components/community/CommunityIcons';
import {
  AuthRoot,
  Menu,
  MenuHeader,
  MenuItem,
  SessionTrigger,
  ThemeCaret,
  ThemeMenuLabel,
  ThemePanel,
  TriggerName
} from './AuthControl.styled';

/**
 * 커뮤니티 헤더 우측 인증 컨트롤.
 * 비로그인 = 로그인 버튼(모달 유도) / 로그인 = 아바타 + 닉네임 세션 드롭다운(Esc·바깥클릭 닫기).
 */
export default function AuthControl() {
  const isLoggedIn = useIsLoggedInAtomValue();
  const profile = useProfileAtomValue();
  const { openLoginPrompt, logout } = useCommunityAuth();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  // 테마 선택은 드롭다운 안 인라인 디스클로저로 편다(팝오버 중첩 회피). 로그인 사용자의 테마 진입점.
  const [themeOpen, setThemeOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const themePanelId = useId();

  // 드롭다운이 닫히면 테마 패널도 접어 다음에 열 때 컴팩트하게 시작한다.
  useEffect(() => {
    if (!open) setThemeOpen(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  if (!isLoggedIn) {
    return (
      <Button variant="secondary" size="sm" onClick={openLoginPrompt}>
        {COMMUNITY_COPY.nav.login}
      </Button>
    );
  }

  const displayName = profile?.display_name ?? '';

  return (
    <AuthRoot ref={rootRef}>
      <SessionTrigger
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((prev) => !prev)}
      >
        <Avatar displayName={displayName} avatarUrl={profile?.avatar_url} size="sm" />
        <TriggerName>{displayName || COMMUNITY_COPY.nav.login}</TriggerName>
      </SessionTrigger>
      {open ? (
        <Menu id={menuId} role="menu">
          {displayName ? (
            <MenuHeader>
              <strong>{displayName}</strong>
            </MenuHeader>
          ) : null}
          <MenuItem
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              navigate('/community/profile');
            }}
          >
            <UserRoundIcon size={16} />
            {COMMUNITY_COPY.profile.menuItem}
          </MenuItem>
          {/* 테마: 클릭하면 드롭다운 안에서 radiogroup을 인라인으로 펼치는 디스클로저(선택해도 드롭다운 유지 — 비교/전환 편의).
              위로 떠오르는 팝업이 아니라 인라인 확장이라 aria-haspopup 대신 aria-expanded+aria-controls만 쓴다. */}
          <MenuItem
            type="button"
            role="menuitem"
            aria-expanded={themeOpen}
            aria-controls={themeOpen ? themePanelId : undefined}
            onClick={() => setThemeOpen((prev) => !prev)}
          >
            <Palette size={16} strokeWidth={1.8} aria-hidden focusable={false} />
            <ThemeMenuLabel>{COMMUNITY_COPY.nav.theme}</ThemeMenuLabel>
            <ThemeCaret open={themeOpen} aria-hidden="true">
              <ChevronDownIcon size={16} />
            </ThemeCaret>
          </MenuItem>
          {themeOpen ? (
            <ThemePanel id={themePanelId}>
              <ThemePresetSwitcher variant="menu" />
            </ThemePanel>
          ) : null}
          <MenuItem
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              navigate('/');
            }}
          >
            <ChartIcon size={16} />
            {COMMUNITY_COPY.nav.toSimulator}
          </MenuItem>
          <MenuItem
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              void logout();
            }}
          >
            {COMMUNITY_COPY.nav.logout}
          </MenuItem>
        </Menu>
      ) : null}
    </AuthRoot>
  );
}
