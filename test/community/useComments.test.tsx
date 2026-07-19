import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { CommentWithAuthor } from '@/shared/lib/supabase';

/**
 * useComments — 페이지네이션(루트 20개 keyset)과 실패 표면화의 행동 계약.
 * supabase IO만 목킹하고 트리 구성/병합(buildCommentTree, mergeCommentRows)은 실제 코드.
 */

// 세션/프로필은 **참조가 고정**이어야 한다 — 렌더마다 새 객체를 주면
// useComments의 로드 effect(deps에 session)가 무한 재실행된다.
vi.mock('@/jotai/community', () => {
  const session = { user: { id: 'me' } };
  const profile = { id: 'me', display_name: '나', avatar_url: null };
  return {
    useSessionAtomValue: () => session,
    useProfileAtomValue: () => profile
  };
});

vi.mock('@/shared/lib/supabase', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/lib/supabase')>();
  return {
    ...actual,
    getSupabaseClient: vi.fn(async () => ({}) as unknown),
    fetchCommentsPage: vi.fn(),
    fetchVisibleCommentCount: vi.fn(),
    fetchMyCommentLikes: vi.fn(async () => new Set<string>()),
    createComment: vi.fn(),
    softDeleteComment: vi.fn(async () => undefined),
    toggleCommentLike: vi.fn(async () => true)
  };
});

// 목킹 이후에 import 해야 목이 적용된 심볼을 받는다.
const { useComments } = await import('@/pages/Community/CommunityDetailPage/hooks/useComments');
const supabase = await import('@/shared/lib/supabase');

const row = (id: string, parentId: string | null, createdAt: string): CommentWithAuthor => ({
  id,
  post_id: 's1',
  user_id: 'u1',
  parent_id: parentId,
  body: `본문 ${id}`,
  like_count: 0,
  created_at: createdAt,
  updated_at: createdAt,
  deleted_at: null,
  author: null
});

beforeEach(() => {
  vi.mocked(supabase.fetchVisibleCommentCount).mockResolvedValue(0);
  vi.mocked(supabase.fetchCommentsPage).mockResolvedValue({ comments: [], nextCursor: null });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('useComments — 페이지네이션', () => {
  it('첫 페이지: 루트+대댓글 트리, 서버 총계, hasMore를 내놓는다', async () => {
    vi.mocked(supabase.fetchCommentsPage).mockResolvedValueOnce({
      comments: [
        row('r1', null, '2026-07-01T00:00:00Z'),
        row('r2', null, '2026-07-02T00:00:00Z'),
        row('r1-a', 'r1', '2026-07-01T01:00:00Z')
      ],
      nextCursor: { createdAt: '2026-07-02T00:00:00Z', id: 'r2' }
    });
    vi.mocked(supabase.fetchVisibleCommentCount).mockResolvedValueOnce(25);

    const { result } = renderHook(() => useComments('s1'));

    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current.threads.map((thread) => thread.comment.id)).toEqual(['r1', 'r2']);
    expect(result.current.threads[0].replies.map((reply) => reply.id)).toEqual(['r1-a']);
    expect(result.current.totalCount).toBe(25);
    expect(result.current.hasMore).toBe(true);
  });

  it('loadMore: 커서로 다음 페이지를 요청해 중복 없이 이어붙이고, 마지막 페이지에서 hasMore=false', async () => {
    vi.mocked(supabase.fetchCommentsPage)
      .mockResolvedValueOnce({
        comments: [row('r1', null, '2026-07-01T00:00:00Z'), row('r2', null, '2026-07-02T00:00:00Z')],
        nextCursor: { createdAt: '2026-07-02T00:00:00Z', id: 'r2' }
      })
      // 경계 중복(r2)이 다시 와도 한 번만 남아야 한다
      .mockResolvedValueOnce({
        comments: [row('r2', null, '2026-07-02T00:00:00Z'), row('r3', null, '2026-07-03T00:00:00Z')],
        nextCursor: null
      });

    const { result } = renderHook(() => useComments('s1'));
    await waitFor(() => expect(result.current.hasMore).toBe(true));

    act(() => result.current.loadMore());

    await waitFor(() => expect(result.current.hasMore).toBe(false));
    expect(supabase.fetchCommentsPage).toHaveBeenLastCalledWith(expect.anything(), 's1', {
      cursor: { createdAt: '2026-07-02T00:00:00Z', id: 'r2' }
    });
    const ids = result.current.threads.map((thread) => thread.comment.id);
    expect(ids).toEqual(['r1', 'r2', 'r3']);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('loadMore 실패는 loadMoreError로 표면화하고 다시 시도할 수 있다', async () => {
    vi.mocked(supabase.fetchCommentsPage)
      .mockResolvedValueOnce({
        comments: [row('r1', null, '2026-07-01T00:00:00Z')],
        nextCursor: { createdAt: '2026-07-01T00:00:00Z', id: 'r1' }
      })
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce({ comments: [row('r2', null, '2026-07-02T00:00:00Z')], nextCursor: null });

    const { result } = renderHook(() => useComments('s1'));
    await waitFor(() => expect(result.current.hasMore).toBe(true));

    act(() => result.current.loadMore());
    await waitFor(() => expect(result.current.loadMoreError).toBe(true));
    expect(result.current.hasMore).toBe(true); // 커서 보존 → 재시도 가능

    act(() => result.current.loadMore());
    await waitFor(() => expect(result.current.hasMore).toBe(false));
    expect(result.current.loadMoreError).toBe(false);
    expect(result.current.threads.map((thread) => thread.comment.id)).toEqual(['r1', 'r2']);
  });
});

describe('useComments — 등록 실패 표면화', () => {
  it('서버의 한국어 안내(레이트리밋 등)는 그대로 노출하고 낙관적 댓글을 되돌린다', async () => {
    const serverMessage = '댓글을 너무 빠르게 작성하고 있습니다. 잠시 후 다시 시도해 주세요';
    vi.mocked(supabase.createComment).mockRejectedValueOnce(new Error(serverMessage));

    const { result } = renderHook(() => useComments('s1'));
    await waitFor(() => expect(result.current.status).toBe('ready'));

    let ok = true;
    await act(async () => {
      ok = await result.current.addComment('열한 번째 댓글');
    });

    expect(ok).toBe(false);
    expect(result.current.submitError).toBe(serverMessage);
    expect(result.current.threads).toEqual([]); // 낙관적 댓글 롤백
    expect(result.current.totalCount).toBe(0);
  });

  it('식별 불가 에러는 일반 문구로 뭉갠다', async () => {
    vi.mocked(supabase.createComment).mockRejectedValueOnce(new Error('fetch failed'));

    const { result } = renderHook(() => useComments('s1'));
    await waitFor(() => expect(result.current.status).toBe('ready'));

    await act(async () => {
      await result.current.addComment('댓글');
    });

    expect(result.current.submitError).toBe('댓글을 등록하지 못했어요. 잠시 후 다시 시도해 주세요.');
  });

  it('성공하면 에러를 해제하고 총계를 +1 한다', async () => {
    vi.mocked(supabase.createComment)
      .mockRejectedValueOnce(new Error('fetch failed'))
      .mockResolvedValueOnce(row('saved-1', null, '2026-07-05T00:00:00Z'));

    const { result } = renderHook(() => useComments('s1'));
    await waitFor(() => expect(result.current.status).toBe('ready'));

    await act(async () => {
      await result.current.addComment('실패할 댓글');
    });
    expect(result.current.submitError).not.toBeNull();

    await act(async () => {
      await result.current.addComment('성공할 댓글');
    });

    expect(result.current.submitError).toBeNull();
    expect(result.current.totalCount).toBe(1);
    expect(result.current.threads.map((thread) => thread.comment.id)).toEqual(['saved-1']);
  });
});

describe('useComments — 삭제/좋아요 실패 표면화', () => {
  it('삭제 실패는 롤백하고 actionError로 알린다', async () => {
    vi.mocked(supabase.fetchCommentsPage).mockResolvedValueOnce({
      comments: [row('r1', null, '2026-07-01T00:00:00Z')],
      nextCursor: null
    });
    vi.mocked(supabase.fetchVisibleCommentCount).mockResolvedValueOnce(1);
    vi.mocked(supabase.softDeleteComment).mockRejectedValueOnce(new Error('network'));

    const { result } = renderHook(() => useComments('s1'));
    await waitFor(() => expect(result.current.status).toBe('ready'));

    await act(async () => {
      await result.current.remove('r1');
    });

    // 롤백 — 댓글은 삭제되지 않은 상태로 남는다
    expect(result.current.threads[0].comment.deleted_at).toBeNull();
    expect(result.current.totalCount).toBe(1);
    expect(result.current.actionError).toBe('댓글을 삭제하지 못했어요. 잠시 후 다시 시도해 주세요.');
  });

  it('좋아요 실패는 롤백하고 actionError로 알린다', async () => {
    vi.mocked(supabase.fetchCommentsPage).mockResolvedValueOnce({
      comments: [row('r1', null, '2026-07-01T00:00:00Z')],
      nextCursor: null
    });
    vi.mocked(supabase.toggleCommentLike).mockRejectedValueOnce(new Error('network'));

    const { result } = renderHook(() => useComments('s1'));
    await waitFor(() => expect(result.current.status).toBe('ready'));

    act(() => result.current.toggleLike('r1'));

    await waitFor(() =>
      expect(result.current.actionError).toBe('좋아요 처리에 실패했어요. 잠시 후 다시 시도해 주세요.')
    );
    expect(result.current.likedCommentIds.has('r1')).toBe(false); // 롤백
    expect(result.current.threads[0].comment.like_count).toBe(0);
  });
});
