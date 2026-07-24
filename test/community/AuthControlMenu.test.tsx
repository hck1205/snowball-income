import type { ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Provider } from 'jotai/react';
import { createStore } from 'jotai/vanilla';
import { COMMUNITY_COPY } from '@/shared/constants/community';

/**
 * 프로필 드롭다운(AuthControl)의 메뉴 계약.
 * 여기서 보는 것은 **"내가 쓴 글"이 프로필 설정 바로 아래에 있고, 독립 화면으로 이동한다**는 것이다
 * (내 글은 더 이상 프로필 설정 안의 섹션이 아니다).
 *
 * `useCommunityAuth`는 Provider 안에서만 유효한데(없으면 throw), 이 테스트는 메뉴 이동만 보므로
 * 인증 배선은 목으로 대체한다.
 */
const logout = vi.fn();
vi.mock('@/components/community/CommunityAuthProvider', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/components/community/CommunityAuthProvider')>();
  return {
    ...actual,
    useCommunityAuth: () => ({
      authReady: true,
      openLoginPrompt: vi.fn(),
      login: vi.fn(async () => {}),
      logout,
      refreshProfile: vi.fn(async () => {})
    })
  };
});

const { AuthControl } = await import('@/components/community/AuthControl');
const { profileAtom, sessionAtom } = await import('@/jotai/community');

const renderLoggedIn = () => {
  const store = createStore();
  store.set(sessionAtom, { access_token: 'tok', user: { id: 'user-1' } } as unknown as Session);
  store.set(profileAtom, { id: 'user-1', display_name: '스노우볼러', avatar_url: null, is_admin: false });

  const wrapper = ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>;

  // AuthControl 은 라우트 밖(헤더 자리)에 둔다 — 이동 후에도 살아 있어야 "메뉴가 닫혔는지"를 볼 수 있다.
  return render(
    <MemoryRouter initialEntries={['/community/portfolio']}>
      <AuthControl />
      <Routes>
        <Route path="/community/portfolio" element={<p>갤러리 화면</p>} />
        <Route path="/community/profile" element={<p>프로필 설정 화면</p>} />
        <Route path="/community/my-posts" element={<p>내가 쓴 글 화면</p>} />
      </Routes>
    </MemoryRouter>,
    { wrapper }
  );
};

describe('AuthControl 프로필 드롭다운', () => {
  it('"내가 쓴 글"이 "프로필 설정" 바로 다음 항목이다', async () => {
    const user = userEvent.setup();
    renderLoggedIn();

    await user.click(screen.getByRole('button', { name: /스노우볼러/ }));

    const items = screen.getAllByRole('menuitem').map((item) => item.textContent);
    const profileIndex = items.indexOf(COMMUNITY_COPY.profile.menuItem);
    expect(profileIndex).toBeGreaterThanOrEqual(0);
    expect(items[profileIndex + 1]).toBe(COMMUNITY_COPY.myPosts.menuItem);
  });

  it('"내가 쓴 글"을 누르면 독립 화면으로 이동하고 메뉴가 닫힌다', async () => {
    const user = userEvent.setup();
    renderLoggedIn();

    await user.click(screen.getByRole('button', { name: /스노우볼러/ }));
    await user.click(screen.getByRole('menuitem', { name: COMMUNITY_COPY.myPosts.menuItem }));

    expect(screen.getByText('내가 쓴 글 화면')).toBeInTheDocument();
    expect(screen.queryByRole('menuitem')).not.toBeInTheDocument();
  });

  it('"프로필 설정"은 그대로 프로필 화면으로 간다', async () => {
    const user = userEvent.setup();
    renderLoggedIn();

    await user.click(screen.getByRole('button', { name: /스노우볼러/ }));
    await user.click(screen.getByRole('menuitem', { name: COMMUNITY_COPY.profile.menuItem }));

    expect(screen.getByText('프로필 설정 화면')).toBeInTheDocument();
  });
});
