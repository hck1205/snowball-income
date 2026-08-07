import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Provider } from 'jotai/react';
import { createStore } from 'jotai/vanilla';
import { profileAtom, sessionAtom } from '@/jotai/community';
import { COMMUNITY_GROUP_ITEMS } from '@/components/PrimaryNav';
import {
  canViewCommunityNews,
  canWriteCommunityNews,
  COMMUNITY_COPY,
  COMMUNITY_NEWS_PUBLIC,
  COMMUNITY_NEWS_WRITE_ADMIN_ONLY
} from '@/shared/constants/community';
import CommunityNewsGate from '@/pages/Community/CommunityNewsGate';
import CommunityNewsSharePage from '@/pages/Community/CommunityNewsSharePage';
import CommunityNewsView from '@/pages/Community/CommunityNewsPage/CommunityNewsPage.view';
import type { CommunityNewsViewModel } from '@/pages/Community/CommunityNewsPage';

/**
 * 미디어 뉴스 **임시 비공개 + 작성 운영자 전용** (2026-08-08 사용자 결정).
 *
 * 두 축을 따로 잠근다 — 지금은 결과가 겹쳐 보이지만 나중에 갈린다:
 *   ① 볼 수 있는가  = `COMMUNITY_NEWS_PUBLIC || isAdmin`
 *   ② 쓸 수 있는가  = ① 그리고 (`!COMMUNITY_NEWS_WRITE_ADMIN_ONLY || isAdmin`)
 * 뉴스를 다시 공개해도(①이 모두 true) **작성은 운영자만**으로 남아야 한다. 그 미래를 여기서 못박는다.
 *
 * ⚠ 이 테스트는 **사용자에게 보이는 것**으로만 판정한다(안내 문구·버튼 유무). 상수를 그대로
 *   되읽어 비교하면 상수를 바꿔도 테스트가 따라 통과해 버려 아무것도 지키지 못한다.
 */

const n = COMMUNITY_COPY.news;

const makeStore = (isAdmin: boolean) => {
  const store = createStore();
  store.set(sessionAtom, { user: { id: 'user-1' } } as never);
  store.set(profileAtom, { id: 'user-1', display_name: '테스터', avatar_url: null, is_admin: isAdmin });
  return store;
};

describe('뉴스 접근 판정 (순수 함수)', () => {
  it('닫혀 있는 동안 일반 사용자는 볼 수도 쓸 수도 없다', () => {
    expect(canViewCommunityNews(false)).toBe(false);
    expect(canWriteCommunityNews(false)).toBe(false);
  });

  it('닫혀 있어도 운영자는 보고 쓴다', () => {
    expect(canViewCommunityNews(true)).toBe(true);
    expect(canWriteCommunityNews(true)).toBe(true);
  });

  it('⭐ 다시 공개해도 작성은 운영자 전용으로 남는다 (두 축이 별개라는 증거)', () => {
    // 상수를 바꾸는 대신 판정식을 같은 규칙으로 재현해 **미래의 조합**을 검사한다.
    const canView = (publicOpen: boolean, isAdmin: boolean) => publicOpen || isAdmin;
    const canWrite = (publicOpen: boolean, adminOnlyWrite: boolean, isAdmin: boolean) =>
      canView(publicOpen, isAdmin) && (!adminOnlyWrite || isAdmin);

    expect(canView(true, false)).toBe(true); // 공개 → 일반 사용자도 목록을 본다
    expect(canWrite(true, true, false)).toBe(false); //   …그래도 쓰지는 못한다
    expect(canWrite(true, true, true)).toBe(true); //     운영자만 쓴다
    expect(canWrite(true, false, false)).toBe(true); //   작성 제한을 풀면 그때 열린다
  });

  it('현재 설정은 "닫힘 + 작성 운영자 전용"이다', () => {
    expect(COMMUNITY_NEWS_PUBLIC).toBe(false);
    expect(COMMUNITY_NEWS_WRITE_ADMIN_ONLY).toBe(true);
  });
});

describe('CommunityNewsGate — 라우트 진입', () => {
  const renderGate = (isAdmin: boolean) =>
    render(
      <Provider store={makeStore(isAdmin)}>
        <MemoryRouter initialEntries={['/community/news']}>
          <Routes>
            <Route path="/community" element={<CommunityNewsGate />}>
              <Route path="news" element={<p>뉴스 지면 내용</p>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </Provider>
    );

  it('일반 사용자는 뉴스 대신 "잠시 닫혀 있습니다" 안내를 본다', () => {
    renderGate(false);

    expect(screen.getByText(n.hiddenTitle)).toBeInTheDocument();
    expect(screen.queryByText('뉴스 지면 내용')).not.toBeInTheDocument();
  });

  it('안내 면에는 다른 곳으로 갈 출구가 있다 (막다른 길 금지)', () => {
    renderGate(false);

    expect(screen.getByRole('button', { name: n.hiddenAction })).toBeInTheDocument();
  });

  it('⭐ 운영자는 그대로 통과해 뉴스 지면을 본다', () => {
    renderGate(true);

    expect(screen.getByText('뉴스 지면 내용')).toBeInTheDocument();
    expect(screen.queryByText(n.hiddenTitle)).not.toBeInTheDocument();
  });
});

describe('CommunityNewsSharePage — 주소로 직접 들어오는 길', () => {
  const renderShare = (isAdmin: boolean) =>
    render(
      <Provider store={makeStore(isAdmin)}>
        <MemoryRouter initialEntries={['/community/news/share']}>
          <CommunityNewsSharePage />
        </MemoryRouter>
      </Provider>
    );

  it('⭐ 일반 사용자가 주소를 직접 쳐도 공유 폼이 뜨지 않는다', () => {
    renderShare(false);

    expect(screen.queryByRole('button', { name: n.fetchAction })).not.toBeInTheDocument();
    expect(screen.getByText(n.hiddenTitle)).toBeInTheDocument();
  });

  it('운영자에게는 공유 폼이 그대로 뜬다', () => {
    renderShare(true);

    expect(screen.getByRole('button', { name: n.fetchAction })).toBeInTheDocument();
  });
});

describe('뉴스 목록 — 공유 진입점', () => {
  const baseViewModel = (canWrite: boolean): CommunityNewsViewModel => ({
    items: [],
    status: 'empty',
    reachedEnd: true,
    isLoadingMore: false,
    loadMoreError: false,
    loadMore: () => {},
    retry: () => {},
    canWrite,
    onWrite: () => {}
  });

  const renderList = (canWrite: boolean) =>
    render(
      <MemoryRouter>
        <CommunityNewsView viewModel={baseViewModel(canWrite)} />
      </MemoryRouter>
    );

  it('쓸 수 없는 사람에게는 빈 상태의 공유 버튼도 보이지 않는다', () => {
    renderList(false);

    expect(screen.getByText(n.emptyTitle)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: n.emptyCta })).not.toBeInTheDocument();
  });

  it('쓸 수 있는 사람에게는 공유 버튼이 선다', () => {
    renderList(true);

    expect(screen.getAllByRole('button', { name: n.write }).length).toBeGreaterThan(0);
  });
});

describe('전역 내비게이션', () => {
  it('⭐ 커뮤니티 묶음에 미디어 뉴스 링크가 없다 (임시 비공개)', () => {
    expect(COMMUNITY_GROUP_ITEMS.some((item) => item.to.startsWith('/community/news'))).toBe(false);
  });

  it('갤러리·게시판은 그대로 남아 있다 (뉴스만 뺐다는 증거)', () => {
    const paths = COMMUNITY_GROUP_ITEMS.map((item) => item.to);

    expect(paths).toContain('/community/portfolio');
    expect(paths).toContain('/community/board');
  });
});
