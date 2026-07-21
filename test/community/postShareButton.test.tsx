import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { COMMUNITY_COPY } from '@/shared/constants/community';
import { track } from '@/shared/lib/analytics';
import type { PostListItem } from '@/shared/lib/supabase';
import { PostCard, PostRow } from '@/components/community';

// 계측 파라미터(placement)만 보기 위해 track만 목으로 갈아끼운다(ANALYTICS_EVENT 등은 실제 유지).
vi.mock('@/shared/lib/analytics', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/lib/analytics')>();
  return { ...actual, track: vi.fn() };
});

const d = COMMUNITY_COPY.detail;

const item = (overrides: Partial<PostListItem> = {}): PostListItem => ({
  id: 's1',
  user_id: 'u1',
  kind: 'portfolio',
  category: 'free',
  title: '월배당 포트폴리오',
  description: '매달 현금흐름을 노린 구성',
  is_public: true,
  has_payload: false,
  sim_summary: null,
  like_count: 12,
  view_count: 340,
  comment_count: 3,
  created_at: '2026-07-14T00:00:00Z',
  updated_at: '2026-07-14T00:00:00Z',
  author: { id: 'u1', display_name: '눈덩이', avatar_url: null },
  ...overrides
});

function LocationSpy() {
  const loc = useLocation();
  return <div data-testid="loc">{loc.pathname}</div>;
}

const renderFeed = (node: React.ReactNode, initialPath = '/community') =>
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      {node}
      <LocationSpy />
    </MemoryRouter>
  );

const shareButton = () => screen.getByRole('button', { name: d.shareAria });

beforeEach(() => {
  vi.mocked(track).mockClear();
});

afterEach(() => {
  delete (navigator as { share?: unknown }).share;
  delete (navigator as { clipboard?: unknown }).clipboard;
});

describe('피드 공유 버튼 — 노출 (갤러리·게시판, 카드·행)', () => {
  it('PostCard(갤러리 글)에 공유 버튼이 보인다', () => {
    renderFeed(<PostCard item={item({ kind: 'portfolio' })} />);
    expect(shareButton()).toBeInTheDocument();
  });

  it('PostCard(게시판 글)에도 공유 버튼이 보인다', () => {
    renderFeed(<PostCard item={item({ kind: 'board' })} />);
    expect(shareButton()).toBeInTheDocument();
  });

  it('PostRow(갤러리 글)에 공유 버튼이 보인다', () => {
    renderFeed(<PostRow item={item({ kind: 'portfolio' })} />);
    expect(shareButton()).toBeInTheDocument();
  });

  it('PostRow(게시판 글)에도 공유 버튼이 보인다', () => {
    renderFeed(<PostRow item={item({ kind: 'board' })} />);
    expect(shareButton()).toBeInTheDocument();
  });
});

describe('피드 공유 버튼 — 링크 안 버튼의 네비게이션 차단', () => {
  it('공유 버튼 클릭은 상세로 이동하지 않고(카드가 링크여도) 공유만 실행한다', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', { value: share, configurable: true });

    renderFeed(<PostCard item={item({ kind: 'board', id: 's1' })} />);
    expect(screen.getByTestId('loc')).toHaveTextContent('/community');

    await userEvent.click(shareButton());

    await waitFor(() => expect(share).toHaveBeenCalledTimes(1));
    // 상세로 네비게이션되지 않았다(location 불변).
    expect(screen.getByTestId('loc')).toHaveTextContent('/community');
    // 그 글의 정규 게시판 상세 URL을 공유한다.
    expect(share).toHaveBeenCalledWith(
      expect.objectContaining({ url: expect.stringContaining('/community/board/s1') })
    );
  });

  it('카드 본문(제목) 클릭은 정상적으로 상세로 이동한다(공유 버튼만 예외)', async () => {
    renderFeed(<PostCard item={item({ kind: 'portfolio', id: 's1' })} />);
    await userEvent.click(screen.getByText('월배당 포트폴리오'));
    expect(screen.getByTestId('loc')).toHaveTextContent('/community/portfolio/s1');
  });
});

describe('피드 공유 버튼 — 공유 경로', () => {
  it('navigator.share 지원 시 네이티브 시트를 호출하고 placement=feed로 계측한다', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', { value: share, configurable: true });

    renderFeed(<PostRow item={item({ id: 's1' })} />);
    await userEvent.click(shareButton());

    await waitFor(() => expect(share).toHaveBeenCalledTimes(1));
    expect(track).toHaveBeenCalledWith(
      'community_post_shared',
      expect.objectContaining({ method: 'web_share', post_id: 's1', placement: 'feed' })
    );
  });

  it('navigator.share 미지원 시 클립보드로 URL을 복사하고 토스트를 띄운다', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });

    renderFeed(<PostCard item={item({ kind: 'portfolio', id: 's1' })} />);
    await userEvent.click(shareButton());

    await waitFor(() =>
      expect(writeText).toHaveBeenCalledWith(expect.stringContaining('/community/portfolio/s1'))
    );
    expect(await screen.findByRole('status')).toHaveTextContent(d.shareToastCopied);
    expect(track).toHaveBeenCalledWith(
      'community_post_shared',
      expect.objectContaining({ method: 'copy_link', placement: 'feed' })
    );
  });

  it('사용자가 공유를 취소(AbortError)하면 조용히 종료한다(폴백·토스트 없음)', async () => {
    const abort = Object.assign(new Error('cancelled'), { name: 'AbortError' });
    const share = vi.fn().mockRejectedValue(abort);
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', { value: share, configurable: true });
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });

    renderFeed(<PostCard item={item()} />);
    await userEvent.click(shareButton());

    await waitFor(() => expect(share).toHaveBeenCalledTimes(1));
    // 취소는 클립보드 폴백으로 흘러가지 않고, 토스트도 계측도 남기지 않는다.
    expect(writeText).not.toHaveBeenCalled();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(track).not.toHaveBeenCalled();
  });
});
