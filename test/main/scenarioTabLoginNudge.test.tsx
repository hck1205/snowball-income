import { describe, expect, it, vi } from 'vitest';
import type { Session } from '@supabase/supabase-js';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'jotai/react';
import { createStore } from 'jotai/vanilla';

/**
 * 비로그인 1탭 게이트 — **사용자 행동** 검증.
 *
 * 이 앱 테스트 환경은 커뮤니티 env가 비어 `isCommunityEnabled=false`(게이트 없음)가 기본이다.
 * 게이트는 "로그인 가능 배포"에서만 켜지므로, 그 상태를 재현하려 `isCommunityEnabled`만 true로 덮는다.
 * 나머지 supabase 실export는 유지 → getSupabaseClient는 여전히 null을 반환(백엔드 없음)해
 * CommunityAuthProvider는 로그아웃 상태로 조용히 배선되고, openLoginPrompt는 로컬 상태만 연다.
 */
vi.mock('@/shared/lib/supabase', async (importActual) => {
  const actual = await importActual<typeof import('@/shared/lib/supabase')>();
  return { ...actual, isCommunityEnabled: true };
});

import MainRightPanel from '@/pages/Main/components/MainRightPanel';
import { CommunityAuthProvider } from '@/components/community/CommunityAuthProvider';
import { sessionAtom } from '@/jotai/community';
import { COMMUNITY_COPY } from '@/shared/constants/community';
import {
  EMPTY_INVESTMENT_SETTINGS,
  EMPTY_PORTFOLIO_STATE,
  activeScenarioIdAtom,
  scenarioTabsAtom
} from '@/jotai/snowball/atoms/portfolio';
import type { PersistedScenarioState } from '@/jotai/snowball/types';

const makeTab = (id: string, name: string): PersistedScenarioState => ({
  id,
  name,
  portfolio: { ...EMPTY_PORTFOLIO_STATE },
  investmentSettings: {
    ...EMPTY_INVESTMENT_SETTINGS,
    visibleYearlySeries: { ...EMPTY_INVESTMENT_SETTINGS.visibleYearlySeries }
  }
});

const FAKE_SESSION = { user: { id: 'u1' } } as unknown as Session;

const seedStore = (opts: { loggedIn: boolean }) => {
  const store = createStore();
  store.set(scenarioTabsAtom, [makeTab('tab-1', '기본 탭')]);
  store.set(activeScenarioIdAtom, 'tab-1');
  if (opts.loggedIn) store.set(sessionAtom, FAKE_SESSION);
  return store;
};

const renderPanel = (store: ReturnType<typeof seedStore>) =>
  render(
    <Provider store={store}>
      <CommunityAuthProvider>
        <MainRightPanel />
      </CommunityAuthProvider>
    </Provider>
  );

describe('비로그인 1탭 게이트 (MainRightPanel)', () => {
  it('비로그인 사용자가 2번째 탭을 만들려 하면 생성하지 않고 로그인 유도 프롬프트를 띄운다', async () => {
    const user = userEvent.setup();
    const store = seedStore({ loggedIn: false });
    renderPanel(store);

    await user.click(screen.getByRole('button', { name: '새 포트폴리오 탭 추가' }));

    // 탭은 생성되지 않는다(여전히 1개).
    expect(store.get(scenarioTabsAtom)).toHaveLength(1);
    // 로그인 유도 프롬프트가 뜬다.
    const dialog = screen.getByRole('dialog', { name: '로그인 유도' });
    expect(dialog).toHaveTextContent('탭을 더 만들려면 로그인하세요');
    expect(dialog).toHaveTextContent('데이터가 사라지지 않아요');
    expect(dialog).toHaveTextContent('함께 동기화');
  });

  it('프롬프트의 [로그인]을 누르면 로그인 모달이 열린다', async () => {
    const user = userEvent.setup();
    const store = seedStore({ loggedIn: false });
    renderPanel(store);

    await user.click(screen.getByRole('button', { name: '새 포트폴리오 탭 추가' }));
    await user.click(screen.getByRole('button', { name: '로그인' }));

    // 유도 프롬프트는 닫히고 실제 로그인 모달(소셜 로그인 선택)이 뜬다.
    expect(screen.queryByRole('dialog', { name: '로그인 유도' })).not.toBeInTheDocument();
    expect(await screen.findByText(COMMUNITY_COPY.login.title)).toBeInTheDocument();
  });

  it('로그인 사용자는 게이트 없이 2번째 탭을 바로 만든다(프롬프트 없음)', async () => {
    const user = userEvent.setup();
    const store = seedStore({ loggedIn: true });
    renderPanel(store);

    await user.click(screen.getByRole('button', { name: '새 포트폴리오 탭 추가' }));

    // 탭이 실제로 하나 더 생긴다.
    expect(store.get(scenarioTabsAtom)).toHaveLength(2);
    expect(screen.queryByRole('dialog', { name: '로그인 유도' })).not.toBeInTheDocument();
  });
});
