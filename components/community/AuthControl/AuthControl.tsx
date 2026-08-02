import { useEffect, useId, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { COMMUNITY_COPY } from '@/shared/constants/community';
import { SIMULATOR_PATH } from '@/shared/constants/routes';
import { useIsLoggedInAtomValue, useProfileAtomValue } from '@/jotai/community';
import { Button } from '@/components/common';
import { Avatar } from '@/components/community/Avatar';
import { useCommunityAuth } from '@/components/community/CommunityAuthProvider';
import { ChartIcon, ListIcon, ReceiptTextIcon, UserRoundIcon } from '@/components/community/CommunityIcons';
import { isGoogleSheetsEnabled } from '@/shared/lib/googleSheets';
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
            <UserRoundIcon size={16} strokeWidth={1.8} />
            {COMMUNITY_COPY.profile.menuItem}
          </MenuItem>
          {/* 내가 쓴 글 — 프로필 설정 바로 아래. 비공개 글을 볼 수 있는 유일한 화면이라
              계정 관리(프로필 설정)와 붙여 두되 별도 라우트로 분리했다. */}
          <MenuItem
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              navigate('/community/my-posts');
            }}
          >
            <ListIcon size={16} strokeWidth={1.8} />
            {COMMUNITY_COPY.myPosts.menuItem}
          </MenuItem>
          {/* 가계부 — 계정 관리 묶음 끝, 앱 이동(시뮬레이터로) 앞.
              🔴 env 가 없으면 항목 자체가 없다(`isGoogleSheetsEnabled`).
              ⚠ 2026-08-01 사용자 결정으로 **헤더 nav 에도 가계부 항목이 생겼다**(구 주석의 "7번째 금지"는
              폐기). 지금은 진입점이 셋(헤더 nav · 포트폴리오 진입 카드 · 이 메뉴)이라 중복 정리는
              별도 판단 대상이다 — 임의로 지우지 마라. */}
          {isGoogleSheetsEnabled ? (
            <MenuItem
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                navigate('/ledger');
              }}
            >
              <ReceiptTextIcon size={16} strokeWidth={1.8} />
              {COMMUNITY_COPY.ledger.menuItem}
            </MenuItem>
          ) : null}
          <MenuItem
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              navigate(SIMULATOR_PATH);
            }}
          >
            <ChartIcon size={16} strokeWidth={1.8} />
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
