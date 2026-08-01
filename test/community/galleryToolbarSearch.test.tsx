import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { COMMUNITY_COPY } from '@/shared/constants/community';
import type { CommunityGalleryViewModel } from '@/pages/Community/CommunityGalleryPage/CommunityGalleryPage.types';

/**
 * **갤러리 검색은 앱 헤더가 아니라 본문 툴바에 있다** (2026-07-31 사용자 지시:
 * "포트폴리오 갤러리의 검색 필터를 헤더 말고 아래로 내려줘. 같은 라인에 있으니까 이상해").
 *
 * 이 파일이 생기기 전 검색 클러스터를 보는 테스트는 **0건**이었다 — 헤더에서 본문으로 통째로 옮겨도
 * 5,200건이 전부 그린이었다는 뜻이다(감도 0). 그래서 여기서 잠그는 것은 세 가지다.
 *   ① 검색 입력이 **main 랜드마크 안**에 있고 **banner(헤더) 안에는 없다** — 랜드마크 기준, 클래스 무관.
 *   ② URL 계약(`?q=`·`?qf=` + 정밀 검색 facet)이 그대로다 — 기존 공유 링크가 계속 열려야 한다.
 *   ③ 갤러리가 **아닌** 커뮤니티 라우트에는 검색이 아예 없다(헤더가 들고 다니지 않는다).
 *
 * `useCommunityAuth` 는 Provider 안에서만 유효하므로(없으면 throw) 목으로 대체한다 —
 * 이 테스트가 보는 것은 인증이 아니라 **검색이 어느 랜드마크에 사는가**다.
 */
vi.mock('@/components/community/CommunityAuthProvider', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/components/community/CommunityAuthProvider')>();
  return {
    ...actual,
    useCommunityAuth: () => ({
      authReady: true,
      openLoginPrompt: vi.fn(),
      login: vi.fn(async () => {}),
      logout: vi.fn(),
      refreshProfile: vi.fn(async () => {})
    })
  };
});

const { CommunityHeader } = await import('@/components/community/CommunityHeader');
const { default: CommunityGalleryView } = await import(
  '@/pages/Community/CommunityGalleryPage/CommunityGalleryPage.view'
);

const g = COMMUNITY_COPY.gallery;

const baseVM = (overrides: Partial<CommunityGalleryViewModel> = {}): CommunityGalleryViewModel => ({
  items: [],
  status: 'ready',
  sort: 'recent',
  query: '',
  isSearching: false,
  reachedEnd: true,
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

/** 현재 URL 검색 문자열을 노출하는 프로브 — 입력이 URL 을 어떻게 바꾸는지 관찰한다. */
function LocationEcho() {
  const { search } = useLocation();
  return <output data-testid="search">{search}</output>;
}

/**
 * `CommunityLayout` 과 **같은 랜드마크 골격**(banner + main)으로 렌더한다. 검색이 어느 쪽에 사는지가
 * 이 테스트의 전부라, 골격이 실제와 달라지면 단정이 무의미해진다.
 */
const renderCommunity = (path: string, body: React.ReactNode) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <CommunityHeader />
      <main>
        <Routes>
          <Route path="/community/portfolio" element={body} />
          <Route path="/community/board" element={<p>게시판 화면</p>} />
        </Routes>
        <LocationEcho />
      </main>
    </MemoryRouter>
  );

const renderGallery = (path = '/community/portfolio', overrides: Partial<CommunityGalleryViewModel> = {}) =>
  renderCommunity(path, <CommunityGalleryView viewModel={baseVM(overrides)} />);

const params = () => new URLSearchParams(screen.getByTestId('search').textContent ?? '');

describe('갤러리 검색은 본문 툴바에 산다', () => {
  it('검색 입력이 main 안에 있고 헤더(banner)에는 없다', () => {
    renderGallery();

    const main = screen.getByRole('main');
    const banner = screen.getByRole('banner');

    expect(within(main).getByRole('searchbox', { name: g.searchAriaLabel })).toBeInTheDocument();
    // 🔴 헤더로 되돌아가면 여기가 빨개진다(뮤턴트 검증 지점).
    expect(within(banner).queryByRole('searchbox')).not.toBeInTheDocument();
    expect(within(banner).queryByRole('search')).not.toBeInTheDocument();
  });

  it('검색 기준 선택과 정밀 검색 트리거도 함께 본문에 있다 (클러스터가 쪼개지지 않았다)', () => {
    renderGallery();

    const main = screen.getByRole('main');
    expect(within(main).getByRole('combobox', { name: g.searchFilterAriaLabel })).toBeInTheDocument();
    expect(within(main).getByRole('button', { name: new RegExp(g.filterTriggerAria) })).toBeInTheDocument();
  });

  it('검색 줄은 정렬 탭·뷰 토글 줄보다 앞선다 (독립 줄, 같은 줄에 밀어 넣지 않는다)', () => {
    renderGallery();

    const input = screen.getByRole('searchbox', { name: g.searchAriaLabel });
    const sortTab = screen.getByRole('tab', { name: g.sortRecent });
    expect(input.compareDocumentPosition(sortTab) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('갤러리가 아닌 커뮤니티 라우트에는 검색이 아예 없다', () => {
    renderCommunity('/community/board', <p>여기는 갤러리가 아니다</p>);

    expect(screen.getByText('게시판 화면')).toBeInTheDocument();
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
  });

  it('글쓰기도 헤더가 아니라 본문 컨트롤 줄에 있다 (§4.A-5 중복 제거)', () => {
    renderGallery();

    expect(within(screen.getByRole('banner')).queryByRole('button', { name: COMMUNITY_COPY.nav.write })).toBeNull();
    expect(
      within(screen.getByRole('main')).getByRole('button', { name: COMMUNITY_COPY.nav.write })
    ).toBeInTheDocument();
  });
});

describe('URL 계약은 이사와 무관하게 그대로다', () => {
  it('`?q=`·`?qf=` 가 붙은 기존 링크를 열면 입력과 검색 기준이 복원된다', () => {
    renderGallery('/community/portfolio?q=배당&qf=body');

    expect(screen.getByRole('searchbox', { name: g.searchAriaLabel })).toHaveValue('배당');
    expect(screen.getByRole('combobox', { name: g.searchFilterAriaLabel })).toHaveValue('body');
  });

  it('정밀 검색 facet 파라미터가 붙은 링크도 그대로 복원된다(원 단위 canonical 불변)', async () => {
    const user = userEvent.setup();
    renderGallery('/community/portfolio?q=배당&mdmin=1000000&durmin=5');

    // 트리거가 활성 필터 그룹 수를 알린다(월배당 + 기간 = 2).
    const trigger = screen.getByRole('button', { name: new RegExp(g.filterTriggerAria) });
    expect(trigger).toHaveAttribute('aria-label', expect.stringContaining(g.filterActiveCountAria(2)));

    // 패널을 열면 만원 표기로 되살아난다(URL 은 원 단위 그대로).
    await user.click(trigger);
    expect(screen.getByLabelText(g.filterMonthlyMinAria)).toHaveValue('100');
    expect(params().get('mdmin')).toBe('1000000');
    expect(params().get('q')).toBe('배당');
  });

  it('엔터는 즉시 URL 에 반영한다', async () => {
    const user = userEvent.setup();
    renderGallery();

    await user.type(screen.getByRole('searchbox', { name: g.searchAriaLabel }), 'SCHD{Enter}');

    expect(params().get('q')).toBe('SCHD');
    expect(params().get('qf')).toBe('title');
  });

  it('IME 조합 중에는 URL 을 갱신하지 않는다 (한글 입력이 깨지지 않게)', async () => {
    vi.useFakeTimers();
    try {
      renderGallery();
      const input = screen.getByRole('searchbox', { name: g.searchAriaLabel }) as HTMLInputElement;

      // 조합 시작 → 중간 글자가 들어와도 디바운스가 URL 을 건드리면 안 된다.
      fireEvent.compositionStart(input);
      fireEvent.change(input, { target: { value: '배다' } });
      // 타이머 진행은 act 로 감싼다 — 감싸지 않으면 콜백 안의 상태 갱신이 flush 되지 않아
      // "URL 이 안 바뀌었다"가 **항상** 참이 되어 이 테스트가 통과하는 척한다(위음성).
      act(() => {
        vi.advanceTimersByTime(2000);
      });
      expect(params().has('q')).toBe(false);

      // 조합이 끝나면 그때부터 반영된다.
      fireEvent.compositionEnd(input, { target: { value: '배당' } });
      act(() => {
        vi.advanceTimersByTime(2000);
      });
      expect(params().get('q')).toBe('배당');
    } finally {
      vi.useRealTimers();
    }
  });
});
