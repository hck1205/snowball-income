import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import CommunityDetailView from '@/pages/Community/CommunityDetailPage/CommunityDetailPage.view';
import type { CommunityDetailViewModel } from '@/pages/Community/CommunityDetailPage/CommunityDetailPage.types';
import { restoreMatchMedia, stubReducedMotion } from '../helpers';

/**
 * 글 상세 "맨 위로" 버튼의 계약.
 *
 * 무거운 이웃(댓글·시나리오 미리보기)만 갈아끼우고 **버튼은 진짜를 쓴다** — 이 테스트가 지키려는 것
 * 중 하나가 "포커스가 글 제목으로 간다"이고, 그 배선은 상세 뷰가 ref 를 넘겨야만 성립하기 때문이다.
 *
 * ⚠ jsdom 은 실제로 스크롤하지 않는다. `window.scrollY` 를 직접 세우고 scroll 이벤트를 쏴서
 * "사용자가 스크롤했다"를 만든다. 임계는 뷰포트 높이(jsdom 기본 768) 기준이다.
 */
vi.mock('@/pages/Community/CommunityDetailPage/components', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/pages/Community/CommunityDetailPage/components')>();
  return {
    ...actual,
    CommentSection: () => <div data-testid="comments" />,
    ScenarioPreview: () => <div data-testid="preview" />
  };
});

const TITLE = '내 배당 포트폴리오';

const buildViewModel = (): CommunityDetailViewModel =>
  ({
    detail: {
      status: 'ready',
      post: {
        id: 'p1',
        title: TITLE,
        body: '<p>본문입니다.</p>',
        payload: null,
        user_id: 'u9',
        created_at: '2026-07-01T00:00:00.000Z',
        like_count: 3,
        view_count: 10,
        author: { display_name: '작성자', avatar_url: null }
      },
      viewCount: 10,
      likeCount: 3,
      liked: false,
      likePending: false,
      isOwner: false,
      deleting: false,
      openInSimulatorHref: null,
      retry: vi.fn(),
      toggleLike: vi.fn(),
      remove: vi.fn()
    },
    comments: {},
    isLoggedIn: true,
    currentUserId: 'u9',
    listPath: '/community/portfolio',
    onRequireLogin: vi.fn(),
    onEdit: vi.fn(),
    onOpenInSimulator: vi.fn(),
    canShare: false,
    onShare: vi.fn(),
    shareToastMessage: ''
  }) as unknown as CommunityDetailViewModel;

const renderView = () =>
  render(
    <MemoryRouter initialEntries={['/community/portfolio/p1']}>
      <CommunityDetailView viewModel={buildViewModel()} />
    </MemoryRouter>
  );

/** 사용자가 y 픽셀까지 스크롤한 상태를 만든다. */
const scrollWindowTo = (y: number) => {
  Object.defineProperty(window, 'scrollY', { value: y, configurable: true, writable: true });
  fireEvent.scroll(window);
};

const scrollTopButton = () => screen.queryByRole('button', { name: '맨 위로' });

let scrollToSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  // jsdom 의 scrollTo 는 "not implemented" 를 뱉는다 — 호출 인자를 보기 위해서도 스파이가 필요하다.
  scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
  Object.defineProperty(window, 'scrollY', { value: 0, configurable: true, writable: true });
});

afterEach(() => {
  scrollToSpy.mockRestore();
  restoreMatchMedia();
});

describe('글 상세 — 맨 위로 버튼', () => {
  it('처음에는 없다 — 짧은 글에서 방해가 되면 안 된다', () => {
    renderView();

    expect(scrollTopButton()).not.toBeInTheDocument();
  });

  it('뷰포트 1개분을 채 못 내려가면 아직 나오지 않는다', () => {
    renderView();

    scrollWindowTo(window.innerHeight - 1);

    expect(scrollTopButton()).not.toBeInTheDocument();
  });

  it('뷰포트 1개분을 내려가면 나타나고, 다시 위로 오면 사라진다', () => {
    renderView();

    scrollWindowTo(window.innerHeight);
    expect(scrollTopButton()).toBeInTheDocument();

    scrollWindowTo(0);
    expect(scrollTopButton()).not.toBeInTheDocument();
  });

  it('누르면 문서 맨 위로 부드럽게 올라간다', async () => {
    const user = userEvent.setup();
    renderView();
    scrollWindowTo(window.innerHeight * 2);

    await user.click(screen.getByRole('button', { name: '맨 위로' }));

    expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
  });

  it('누른 뒤 포커스는 글 제목으로 옮겨간다 — 사라질 버튼에 남겨두지 않는다', async () => {
    const user = userEvent.setup();
    renderView();
    scrollWindowTo(window.innerHeight * 2);

    await user.click(screen.getByRole('button', { name: '맨 위로' }));

    expect(screen.getByRole('heading', { name: TITLE })).toHaveFocus();
  });

  it('🔴 모션을 줄이는 설정이면 즉시 이동한다 — 전역 CSS 리셋은 JS 스크롤을 못 막는다', async () => {
    const user = userEvent.setup();
    renderView();
    scrollWindowTo(window.innerHeight * 2);
    stubReducedMotion();

    await user.click(screen.getByRole('button', { name: '맨 위로' }));

    expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: 'auto' });
  });
});
