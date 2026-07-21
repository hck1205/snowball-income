import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, renderHook, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { COMMUNITY_COPY } from '@/shared/constants/community';
import CommunityDetailView from '@/pages/Community/CommunityDetailPage/CommunityDetailPage.view';
import type { CommunityDetailViewModel } from '@/pages/Community/CommunityDetailPage/CommunityDetailPage.types';
import { usePostShare } from '@/pages/Community/CommunityDetailPage/hooks';

// 댓글/미리보기는 이 스펙과 무관 — 상세 뷰의 공유 버튼 게이트만 보게 스텁으로 갈아 끼운다.
vi.mock('@/pages/Community/CommunityDetailPage/components', () => ({
  CommentSection: () => <div data-testid="comments" />,
  ScenarioPreview: () => <div data-testid="preview" />
}));

const d = COMMUNITY_COPY.detail;

const buildViewModel = (overrides: Partial<CommunityDetailViewModel> = {}): CommunityDetailViewModel =>
  ({
    detail: {
      status: 'ready',
      post: {
        id: 'p1',
        title: '내 배당 포트폴리오',
        body: '<p>SCHD 중심 구성이에요.</p>',
        payload: null,
        user_id: 'u9',
        created_at: '2026-07-01T00:00:00.000Z',
        like_count: 3,
        view_count: 10,
        author: { display_name: '눈덩이', avatar_url: null }
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
    isLoggedIn: false,
    currentUserId: null,
    listPath: '/community/portfolio',
    onRequireLogin: vi.fn(),
    onEdit: vi.fn(),
    onOpenInSimulator: vi.fn(),
    canShare: true,
    onShare: vi.fn(),
    shareToastMessage: '',
    ...overrides
  }) as unknown as CommunityDetailViewModel;

const renderView = (overrides: Partial<CommunityDetailViewModel> = {}) =>
  render(
    <MemoryRouter>
      <CommunityDetailView viewModel={buildViewModel(overrides)} />
    </MemoryRouter>
  );

describe('CommunityDetailView 공유 버튼 게이트', () => {
  it('갤러리(canShare=true)에서는 공유 버튼이 보인다', () => {
    renderView({ canShare: true });
    expect(screen.getByRole('button', { name: d.shareAria })).toBeInTheDocument();
  });

  it('게시판(canShare=false)에서는 공유 버튼이 없다', () => {
    renderView({ canShare: false });
    expect(screen.queryByRole('button', { name: d.shareAria })).not.toBeInTheDocument();
  });

  it('공유 버튼 클릭 시 onShare를 호출한다', async () => {
    const onShare = vi.fn();
    renderView({ onShare });
    await userEvent.click(screen.getByRole('button', { name: d.shareAria }));
    expect(onShare).toHaveBeenCalledTimes(1);
  });

  it('shareToastMessage가 있으면 상태 토스트를 렌더한다', () => {
    renderView({ shareToastMessage: d.shareToastCopied });
    const toast = screen.getByRole('status');
    expect(toast).toHaveTextContent(d.shareToastCopied);
  });
});

describe('usePostShare', () => {
  const shareInput = { postId: 'p1', kind: 'portfolio', title: '내 포폴', text: '설명' };

  beforeEach(() => {
    Object.defineProperty(window, 'location', {
      value: { href: 'https://snowball.example/community/portfolio/p1' },
      writable: true,
      configurable: true
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete (navigator as { share?: unknown }).share;
    delete (navigator as { clipboard?: unknown }).clipboard;
  });

  it('navigator.share 지원 시 네이티브 공유 시트를 URL과 함께 호출한다', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', { value: share, configurable: true });

    const { result } = renderHook(() => usePostShare());
    await act(async () => {
      await result.current.sharePost(shareInput);
    });

    expect(share).toHaveBeenCalledTimes(1);
    expect(share).toHaveBeenCalledWith(
      expect.objectContaining({ url: 'https://snowball.example/community/portfolio/p1' })
    );
    // 네이티브 공유는 토스트를 띄우지 않는다(OS 시트가 피드백).
    expect(result.current.shareToastMessage).toBe('');
  });

  it('navigator.share 미지원 시 클립보드로 URL을 복사하고 토스트를 띄운다', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });

    const { result } = renderHook(() => usePostShare());
    await act(async () => {
      await result.current.sharePost(shareInput);
    });

    expect(writeText).toHaveBeenCalledWith('https://snowball.example/community/portfolio/p1');
    expect(result.current.shareToastMessage).toBe(d.shareToastCopied);
  });

  it('사용자가 공유를 취소(AbortError)하면 조용히 종료한다(폴백·토스트 없음)', async () => {
    const abort = Object.assign(new Error('cancelled'), { name: 'AbortError' });
    const share = vi.fn().mockRejectedValue(abort);
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', { value: share, configurable: true });
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });

    const { result } = renderHook(() => usePostShare());
    await act(async () => {
      await result.current.sharePost(shareInput);
    });

    expect(share).toHaveBeenCalledTimes(1);
    // 취소는 클립보드 폴백으로 흘러가지 않고, 어떤 토스트도 남기지 않는다.
    expect(writeText).not.toHaveBeenCalled();
    expect(result.current.shareToastMessage).toBe('');
  });

  it('공유 실패(취소 아님) 시 클립보드 복사로 폴백한다', async () => {
    const share = vi.fn().mockRejectedValue(new Error('NotAllowed'));
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', { value: share, configurable: true });
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });

    const { result } = renderHook(() => usePostShare());
    await act(async () => {
      await result.current.sharePost(shareInput);
    });

    expect(writeText).toHaveBeenCalledTimes(1);
    expect(result.current.shareToastMessage).toBe(d.shareToastCopied);
  });
});
