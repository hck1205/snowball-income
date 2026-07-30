import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, renderHook, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { COMMUNITY_COPY } from '@/shared/constants/community';
import { SHARE_DIALOG_COPY } from '@/components/common';
import CommunityDetailView from '@/pages/Community/CommunityDetailPage/CommunityDetailPage.view';
import type { CommunityDetailViewModel } from '@/pages/Community/CommunityDetailPage/CommunityDetailPage.types';
import { usePostShare } from '@/components/community/hooks';
import { restoreMatchMedia, stubTouchPrimary } from '../helpers';

// 댓글/미리보기는 이 스펙과 무관 — 상세 뷰의 공유 버튼 게이트만 보게 스텁으로 갈아 끼운다.
vi.mock('@/pages/Community/CommunityDetailPage/components', () => ({
  CommentSection: () => <div data-testid="comments" />,
  ScenarioPreview: () => <div data-testid="preview" />,
  // 배럴을 통째로 갈아끼우므로 상세가 쓰는 부품은 전부 여기 있어야 한다(빠지면 렌더가 터진다).
  ScrollTopButton: () => null
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
  const shareInput = { postId: 'p1', kind: 'portfolio', title: '내 포폴', placement: 'detail' as const };

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
    restoreMatchMedia();
  });

  it('터치 기기에서는 OS 공유 시트를 URL과 함께 호출한다', async () => {
    stubTouchPrimary();
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
    // 네이티브 공유는 토스트도 공유 창도 띄우지 않는다(OS 시트가 피드백).
    expect(result.current.shareToastMessage).toBe('');
    expect(result.current.shareTarget).toBeNull();
  });

  /**
   * 데스크톱 계약: `navigator.share` 가 **있어도** 부르지 않는다. 데스크톱 브라우저의 그 API 는
   * OS 창을 여는데 앱이 크기·위치를 손댈 수 없어 잘려 보인다 — 이 훅이 대신 공유 창을 연다.
   */
  it('데스크톱에서는 navigator.share가 있어도 부르지 않고 공유 창 대상을 세운다', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', { value: share, configurable: true });

    const { result } = renderHook(() => usePostShare());
    await act(async () => {
      await result.current.sharePost(shareInput);
    });

    expect(share).not.toHaveBeenCalled();
    expect(result.current.shareTarget).toEqual(
      expect.objectContaining({ url: 'https://snowball.example/community/portfolio/p1', placement: 'detail' })
    );
  });

  it('공유 창의 링크 복사는 클립보드에 복사하고 토스트를 띄운다', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });

    const { result } = renderHook(() => usePostShare());
    await act(async () => {
      await result.current.sharePost(shareInput);
    });
    await act(async () => {
      await result.current.copyShareLink();
    });

    expect(writeText).toHaveBeenCalledWith('https://snowball.example/community/portfolio/p1');
    expect(result.current.shareToastMessage).toBe(d.shareToastCopied);
    expect(result.current.isShareLinkCopied).toBe(true);
  });

  it('클립보드가 막히면 실패를 숨기지 않고 주소를 토스트에 그대로 노출한다', async () => {
    const { result } = renderHook(() => usePostShare());
    await act(async () => {
      await result.current.sharePost(shareInput);
    });
    await act(async () => {
      await result.current.copyShareLink();
    });

    expect(result.current.shareToastMessage).toContain(d.shareToastFailed);
    expect(result.current.shareToastMessage).toContain('https://snowball.example/community/portfolio/p1');
    expect(result.current.isShareLinkCopied).toBe(false);
  });

  it('채널 버튼은 그 채널의 공유 주소를 새 창으로 열고 창을 닫는다', async () => {
    // 실제 브라우저는 열린 창 객체를 돌려준다 — 반환값이 성공/차단을 가르는 유일한 신호다.
    const open = vi.fn(() => ({}) as Window);
    Object.defineProperty(window, 'open', { value: open, configurable: true, writable: true });

    const { result } = renderHook(() => usePostShare());
    await act(async () => {
      await result.current.sharePost(shareInput);
    });
    act(() => {
      result.current.shareToChannel('x');
    });

    expect(open).toHaveBeenCalledWith(
      expect.stringContaining(encodeURIComponent('https://snowball.example/community/portfolio/p1')),
      '_blank',
      'noopener,noreferrer'
    );
    expect(result.current.shareTarget).toBeNull();
  });

  /**
   * 팝업 차단은 예외를 던지지 않고 `null` 만 돌려준다 — 반환값을 안 보면 **버튼이 고장 난 것처럼**
   * 아무 일도 일어나지 않는다(무음 실패 금지 원칙 위반).
   */
  it('브라우저가 팝업을 막으면 사유를 말하고 공유 창을 열어 둔다(링크 복사로 대체 가능)', async () => {
    const open = vi.fn(() => null);
    Object.defineProperty(window, 'open', { value: open, configurable: true, writable: true });

    const { result } = renderHook(() => usePostShare());
    await act(async () => {
      await result.current.sharePost(shareInput);
    });
    act(() => {
      result.current.shareToChannel('x');
    });

    expect(result.current.shareToastMessage).toBe(d.shareToastPopupBlocked);
    // 창이 닫히면 사용자에게 남는 대안이 없다 — 링크 복사가 그 안에 있다.
    expect(result.current.shareTarget).not.toBeNull();
  });

  it('사용자가 OS 시트를 취소(AbortError)하면 조용히 종료한다(공유 창·토스트 없음)', async () => {
    stubTouchPrimary();
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
    // 취소는 공유 창으로도 흘러가지 않고, 어떤 토스트도 남기지 않는다.
    expect(writeText).not.toHaveBeenCalled();
    expect(result.current.shareTarget).toBeNull();
    expect(result.current.shareToastMessage).toBe('');
  });

  it('OS 시트가 취소가 아닌 이유로 실패하면 공유 창으로 내려간다', async () => {
    stubTouchPrimary();
    const share = vi.fn().mockRejectedValue(new Error('NotAllowed'));
    Object.defineProperty(navigator, 'share', { value: share, configurable: true });

    const { result } = renderHook(() => usePostShare());
    await act(async () => {
      await result.current.sharePost(shareInput);
    });

    expect(result.current.shareTarget).toEqual(
      expect.objectContaining({ url: 'https://snowball.example/community/portfolio/p1' })
    );
  });
});

describe('CommunityDetailView 공유 창', () => {
  it('shareTarget이 있으면 공유 창이 뜨고 링크 복사·닫기가 뷰모델 콜백으로 연결된다', async () => {
    const onCopyShareLink = vi.fn();
    const onCloseShare = vi.fn();
    renderView({
      shareTarget: {
        url: 'https://snowball.example/community/portfolio/p1',
        title: '내 배당 포트폴리오',
        postId: 'p1',
        kind: 'portfolio',
        placement: 'detail'
      },
      onCopyShareLink,
      onCloseShare
    });

    const dialog = screen.getByRole('dialog', { name: SHARE_DIALOG_COPY.title });
    await userEvent.click(within(dialog).getByRole('button', { name: SHARE_DIALOG_COPY.copy }));
    expect(onCopyShareLink).toHaveBeenCalledTimes(1);

    await userEvent.click(within(dialog).getByRole('button', { name: SHARE_DIALOG_COPY.close }));
    expect(onCloseShare).toHaveBeenCalledTimes(1);
  });
});
