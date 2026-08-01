import 'fake-indexeddb/auto';
import type { ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Provider } from 'jotai/react';
import { createStore } from 'jotai/vanilla';

/**
 * 가계부 **진입점 2곳**의 게이트(§2).
 *
 * 🔴 게이트가 꺼지면 진입점이 **아예 렌더되지 않는다** — 비활성 버튼도 "준비 중" 표시도 두지 않는다
 * (누르면 404 로 가는 자리를 남기지 않는다). 라우트 쪽 계약은 `test/router/ledgerRouteGate.test.tsx`.
 *
 * 🔴 **양방향**으로 단정한다. "꺼지면 없다"만 보면 진입점을 통째로 지운 뮤턴트도 통과한다.
 * 테스트 환경에는 구글 자격증명이 없어 실제 플래그는 항상 false 이므로, 켜진 경로는 모듈 목의
 * **getter** 로 만든다(값이 아니라 접근 시점에 읽히게 해서 한 파일에서 두 상태를 다 본다).
 */

let sheetsEnabled = false;

vi.mock('@/shared/lib/googleSheets', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/lib/googleSheets')>();
  return {
    ...actual,
    get isGoogleSheetsEnabled() {
      return sheetsEnabled;
    }
  };
});

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
const { renderPortfolioPage, resetGoalStorages, seedGoalStorages } = await import('../portfolio/portfolioGoalHarness');

const renderAuthControl = () => {
  const store = createStore();
  store.set(sessionAtom, { access_token: 'tok', user: { id: 'user-1' } } as unknown as Session);
  store.set(profileAtom, { id: 'user-1', display_name: '테스터', avatar_url: null, is_admin: false });

  const wrapper = ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>;

  return render(
    <MemoryRouter initialEntries={['/community/portfolio']}>
      <AuthControl />
      <Routes>
        <Route path="/community/portfolio" element={<p>갤러리 화면</p>} />
        <Route path="/ledger" element={<p>가계부 화면</p>} />
      </Routes>
    </MemoryRouter>,
    { wrapper }
  );
};

afterEach(() => {
  sheetsEnabled = false;
});

describe('진입점 ① 프로필 드롭다운', () => {
  it('게이트가 꺼져 있으면 "가계부" 항목이 없다 (비활성·"준비 중"도 없다)', async () => {
    const user = userEvent.setup();
    renderAuthControl();

    await user.click(screen.getByRole('button', { name: /테스터/ }));

    const labels = screen.getAllByRole('menuitem').map((item) => item.textContent);
    expect(labels).not.toContain('가계부');
    expect(screen.queryByText(/준비 중/)).not.toBeInTheDocument();
  });

  it('게이트가 켜지면 항목이 생기고 눌러서 /ledger 로 간다', async () => {
    sheetsEnabled = true;
    const user = userEvent.setup();
    renderAuthControl();

    await user.click(screen.getByRole('button', { name: /테스터/ }));
    await user.click(screen.getByRole('menuitem', { name: '가계부' }));

    expect(screen.getByText('가계부 화면')).toBeInTheDocument();
  });
});

describe('진입점 ② /dividend/portfolio 카드', () => {
  beforeEach(async () => {
    await resetGoalStorages();
  });

  afterEach(async () => {
    await resetGoalStorages();
  });

  it('게이트가 꺼져 있으면 가계부 진입 카드를 그리지 않는다', async () => {
    await seedGoalStorages({ holdings: [{ ticker: 'SCHD', quantity: 10 }] });
    renderPortfolioPage();

    expect(await screen.findByRole('heading', { name: '보유 종목' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '가계부 열기' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: '가계부' })).not.toBeInTheDocument();
  });

  it('게이트가 켜지면 확정 카피 그대로의 카드가 선다', async () => {
    sheetsEnabled = true;
    await seedGoalStorages({ holdings: [{ ticker: 'SCHD', quantity: 10 }] });
    renderPortfolioPage();

    expect(await screen.findByRole('heading', { name: '가계부' })).toBeInTheDocument();
    expect(
      screen.getByText(
        '수입과 지출을 내 구글 시트에 기록합니다. 기록은 사용자의 드라이브에 남고, 앱은 선택한 시트 1개만 읽고 씁니다.'
      )
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '가계부 열기' })).toBeInTheDocument();
  });
});
