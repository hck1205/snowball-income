import { useEffect, useId, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { COMMUNITY_COPY } from '@/shared/constants/community';
import { useIsLoggedInAtomValue, useProfileAtomValue } from '@/jotai/community';
import { Button } from '@/components/common';
import { Avatar } from '@/components/community/Avatar';
import { useCommunityAuth } from '@/components/community/CommunityAuthProvider';
import { ChartIcon, UserRoundIcon } from '@/components/community/CommunityIcons';
import { AuthRoot, Menu, MenuHeader, MenuItem, SessionTrigger, TriggerName } from './AuthControl.styled';

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
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

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
