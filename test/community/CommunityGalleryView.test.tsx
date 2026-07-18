import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import CommunityGalleryView from '@/pages/Community/CommunityGalleryPage/CommunityGalleryPage.view';
import type { CommunityGalleryViewModel } from '@/pages/Community/CommunityGalleryPage/CommunityGalleryPage.types';
import { COMMUNITY_COPY } from '@/shared/constants/community';
import type { ScenarioListItem } from '@/shared/lib/supabase';

const listItem = (id: string, title: string, has_payload = false): ScenarioListItem => ({
  id,
  user_id: 'u1',
  title,
  description: null,
  is_public: true,
  has_payload,
  sim_summary: null,
  like_count: 0,
  view_count: 0,
  comment_count: 0,
  created_at: '2026-07-14T00:00:00Z',
  updated_at: '2026-07-14T00:00:00Z',
  author: null
});

const baseVM = (overrides: Partial<CommunityGalleryViewModel> = {}): CommunityGalleryViewModel => ({
  items: [],
  status: 'ready',
  sort: 'recent',
  query: '',
  isSearching: false,
  reachedEnd: false,
  isLoadingMore: false,
  loadMoreError: false,
  viewType: 'card',
  setSort: vi.fn(),
  loadMore: vi.fn(),
  retry: vi.fn(),
  clearSearch: vi.fn(),
  clearFilters: vi.fn(),
  onToggleView: vi.fn(),
  onWrite: vi.fn(),
  ...overrides
});

const renderView = (viewModel: CommunityGalleryViewModel) =>
  render(
    <MemoryRouter>
      <CommunityGalleryView viewModel={viewModel} />
    </MemoryRouter>
  );

describe('CommunityGalleryView — 상태별 표시', () => {
  it('loading: 골격(aria-busy) 영역을 보여준다', () => {
    const { container } = renderView(baseVM({ status: 'loading' }));
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull();
  });

  it('error: role=alert 배너 + 다시 시도 버튼이 retry를 부른다', async () => {
    const retry = vi.fn();
    renderView(baseVM({ status: 'error', retry }));

    expect(screen.getByRole('alert')).toHaveTextContent('목록을 불러오지 못했어요');
    await userEvent.click(screen.getByRole('button', { name: '다시 시도' }));
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it('empty(글 없음): 안내 + 글쓰기 버튼이 onWrite를 부른다', async () => {
    const onWrite = vi.fn();
    renderView(baseVM({ status: 'empty', onWrite }));

    expect(screen.getByText('아직 공유된 시나리오가 없어요')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '글쓰기' }));
    expect(onWrite).toHaveBeenCalledTimes(1);
  });

  it('searchEmpty(검색 무결과): 검색어를 노출하고 초기화 버튼이 clearSearch를 부른다', async () => {
    const clearSearch = vi.fn();
    renderView(baseVM({ status: 'searchEmpty', query: '없는검색어', isSearching: true, clearSearch }));

    expect(screen.getByText(/없는검색어/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '검색 초기화' }));
    expect(clearSearch).toHaveBeenCalledTimes(1);
  });

  it('filteredEmpty(정밀 필터 무결과): "필터 초기화" 버튼이 clearFilters를 부른다', async () => {
    const clearFilters = vi.fn();
    renderView(baseVM({ status: 'filteredEmpty', clearFilters }));

    expect(screen.getByText(COMMUNITY_COPY.gallery.filterEmptyTitle)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: COMMUNITY_COPY.gallery.filterEmptyCta }));
    expect(clearFilters).toHaveBeenCalledTimes(1);
  });
});

describe('CommunityGalleryView — 뷰 토글', () => {
  it('현재 뷰 버튼만 aria-pressed=true', () => {
    renderView(baseVM({ viewType: 'card' }));

    expect(screen.getByRole('button', { name: '카드 보기' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: '목록 보기' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('목록 보기를 누르면 onToggleView("inline")를 부른다', async () => {
    const onToggleView = vi.fn();
    renderView(baseVM({ viewType: 'card', onToggleView }));

    await userEvent.click(screen.getByRole('button', { name: '목록 보기' }));
    expect(onToggleView).toHaveBeenCalledWith('inline');
  });

  it('정렬 탭 "인기"를 누르면 setSort("popular")를 부른다', async () => {
    const setSort = vi.fn();
    renderView(baseVM({ setSort }));

    await userEvent.click(screen.getByRole('tab', { name: '인기' }));
    expect(setSort).toHaveBeenCalledWith('popular');
  });
});

describe('CommunityGalleryView — 목록 렌더', () => {
  it('카드 뷰: 아이템을 상세 링크로 렌더한다', () => {
    renderView(baseVM({ items: [listItem('s1', '첫 시나리오'), listItem('s2', '둘째 시나리오')] }));

    expect(screen.getByText('첫 시나리오')).toBeInTheDocument();
    expect(screen.getByText('둘째 시나리오')).toBeInTheDocument();
    const links = screen.getAllByRole('link');
    expect(links.map((a) => a.getAttribute('href'))).toEqual(
      expect.arrayContaining(['/community/s1', '/community/s2'])
    );
  });

  it('인라인 뷰: has_payload 아이템만 "시뮬 결과" 배지', () => {
    renderView(
      baseVM({ viewType: 'inline', items: [listItem('s1', '시뮬글', true), listItem('s2', '자유글', false)] })
    );

    expect(screen.getByText('시뮬글')).toBeInTheDocument();
    expect(screen.getByText('자유글')).toBeInTheDocument();
    // 배지는 시뮬글 하나만
    expect(screen.getAllByText('시뮬 결과')).toHaveLength(1);
  });

  it('마지막 페이지면 status 영역에 종료 문구를 보여준다', () => {
    renderView(baseVM({ items: [listItem('s1', '끝')], reachedEnd: true }));

    const status = screen.getByRole('status');
    expect(within(status).getByText('마지막 시나리오입니다')).toBeInTheDocument();
  });

  it('추가 로드 에러면 status 영역에서 재시도할 수 있다', async () => {
    const retry = vi.fn();
    renderView(baseVM({ items: [listItem('s1', 'x')], loadMoreError: true, retry }));

    await userEvent.click(screen.getByRole('button', { name: '다시 시도' }));
    expect(retry).toHaveBeenCalledTimes(1);
  });
});

describe('CommunityGalleryView — 무한 스크롤', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  /** 생성자 콜백을 캡처하는 IntersectionObserver를 심고, 캡처된 콜백 배열을 돌려준다. */
  const stubIntersectionObserver = () => {
    const callbacks: Array<(entries: Array<{ isIntersecting: boolean }>) => void> = [];
    class TriggerIO {
      constructor(cb: (entries: Array<{ isIntersecting: boolean }>) => void) {
        callbacks.push(cb);
      }
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() {
        return [];
      }
    }
    vi.stubGlobal('IntersectionObserver', TriggerIO);
    return callbacks;
  };

  it('센티널이 뷰포트에 들어오면 loadMore를 트리거한다', () => {
    const callbacks = stubIntersectionObserver();
    const loadMore = vi.fn();

    renderView(baseVM({ status: 'ready', reachedEnd: false, items: [listItem('s1', 'x')], loadMore }));

    expect(callbacks.length).toBeGreaterThan(0);
    callbacks.forEach((cb) => cb([{ isIntersecting: true }]));
    expect(loadMore).toHaveBeenCalled();
  });

  it('마지막 페이지면 관찰자를 붙이지 않는다 (loadMore 트리거 없음)', () => {
    const callbacks = stubIntersectionObserver();

    renderView(baseVM({ status: 'ready', reachedEnd: true, items: [listItem('s1', 'x')] }));

    expect(callbacks.length).toBe(0);
  });
});
