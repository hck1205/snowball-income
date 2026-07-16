import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CommentSection } from '@/pages/Community/CommunityDetailPage/components/CommentSection';
import type { UseComments } from '@/pages/Community/CommunityDetailPage/hooks';
import type { CommentThread, CommentWithAuthor } from '@/shared/lib/supabase';

const comment = (over: Partial<CommentWithAuthor> = {}): CommentWithAuthor => ({
  id: 'c1',
  scenario_id: 's1',
  user_id: 'author-1',
  parent_id: null,
  body: '루트 댓글',
  like_count: 0,
  created_at: '2026-07-14T00:00:00Z',
  updated_at: '2026-07-14T00:00:00Z',
  deleted_at: null,
  author: { id: 'author-1', display_name: '글쓴이', avatar_url: null },
  ...over
});

const thread = (
  root: CommentWithAuthor,
  replies: CommentWithAuthor[] = []
): CommentThread<CommentWithAuthor> => ({ comment: root, replies });

const makeComments = (over: Partial<UseComments> = {}): UseComments => ({
  status: 'ready',
  threads: [],
  visibleCount: 0,
  likedCommentIds: new Set<string>(),
  likePendingIds: new Set<string>(),
  submitting: false,
  isPending: () => false,
  retry: vi.fn(),
  addComment: vi.fn(async () => true),
  toggleLike: vi.fn(),
  remove: vi.fn(async () => undefined),
  ...over
});

const renderSection = (props: {
  comments: UseComments;
  isLoggedIn?: boolean;
  currentUserId?: string | null;
  onRequireLogin?: () => void;
}) =>
  render(
    <CommentSection
      comments={props.comments}
      isLoggedIn={props.isLoggedIn ?? true}
      currentUserId={props.currentUserId ?? null}
      onRequireLogin={props.onRequireLogin ?? (() => undefined)}
    />
  );

describe('CommentSection — 로그인 게이트', () => {
  it('비로그인이면 작성 입력 대신 로그인 안내를 보여준다', async () => {
    const onRequireLogin = vi.fn();
    renderSection({ comments: makeComments(), isLoggedIn: false, onRequireLogin });

    expect(screen.getByText('댓글을 쓰려면 로그인하세요')).toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: '댓글' })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: '로그인' }));
    expect(onRequireLogin).toHaveBeenCalledTimes(1);
  });
});

describe('CommentSection — 표시', () => {
  it('제목에 보이는 댓글 수를 반영한다', () => {
    renderSection({ comments: makeComments({ visibleCount: 5, threads: [thread(comment())] }) });
    expect(screen.getByText('댓글 5')).toBeInTheDocument();
  });

  it('빈 상태(글 없음) 안내', () => {
    renderSection({ comments: makeComments({ visibleCount: 0, threads: [] }) });
    expect(screen.getByText('첫 댓글을 남겨보세요.')).toBeInTheDocument();
  });

  it('로딩/에러 상태', () => {
    const { rerender } = renderSection({ comments: makeComments({ status: 'loading' }) });
    expect(screen.getByText('불러오는 중…')).toBeInTheDocument();

    rerender(
      <CommentSection
        comments={makeComments({ status: 'error' })}
        isLoggedIn
        currentUserId={null}
        onRequireLogin={() => undefined}
      />
    );
    expect(screen.getByRole('alert')).toHaveTextContent('댓글을 불러오지 못했어요');
  });

  it('대댓글 1단계를 렌더하고, 답글 버튼은 루트에만 둔다', () => {
    const root = comment({ id: 'r1', body: '루트 댓글' });
    const reply = comment({ id: 'c2', parent_id: 'r1', body: '대댓글', user_id: 'author-2' });
    renderSection({ comments: makeComments({ visibleCount: 2, threads: [thread(root, [reply])] }) });

    expect(screen.getByText('루트 댓글')).toBeInTheDocument();
    expect(screen.getByText('대댓글')).toBeInTheDocument();
    // 답글 버튼은 루트에만 (대댓글의 대댓글 금지)
    expect(screen.getAllByRole('button', { name: '답글' })).toHaveLength(1);
  });

  it('소프트 삭제된 댓글은 자리표시자로만 남는다', () => {
    const deleted = comment({ id: 'r1', body: '', deleted_at: '2026-07-14T01:00:00Z' });
    const reply = comment({ id: 'c2', parent_id: 'r1', body: '살아있는 대댓글', user_id: 'author-2' });
    renderSection({ comments: makeComments({ visibleCount: 1, threads: [thread(deleted, [reply])] }) });

    expect(screen.getByText('삭제된 댓글입니다')).toBeInTheDocument();
    expect(screen.getByText('살아있는 대댓글')).toBeInTheDocument();
    // 삭제된 자리표시자에는 좋아요 버튼이 없다
    expect(screen.getAllByRole('button', { name: '좋아요' })).toHaveLength(1); // 대댓글의 좋아요만
  });
});

describe('CommentSection — 사용자 행동', () => {
  it('루트 댓글을 작성하면 addComment(본문)을 부른다', async () => {
    const addComment = vi.fn(async () => true);
    renderSection({ comments: makeComments({ addComment }) });

    await userEvent.type(screen.getByRole('textbox', { name: '댓글' }), '좋은 시나리오네요');
    await userEvent.click(screen.getByRole('button', { name: '등록' }));

    expect(addComment).toHaveBeenCalledWith('좋은 시나리오네요');
  });

  it('답글 열기 → 대댓글 작성은 addComment(본문, 부모id)를 부른다', async () => {
    const addComment = vi.fn(async () => true);
    const root = comment({ id: 'r1' });
    renderSection({ comments: makeComments({ visibleCount: 1, threads: [thread(root)], addComment }) });

    await userEvent.click(screen.getByRole('button', { name: '답글' }));

    const replyBox = screen.getByRole('textbox', { name: '답글' });
    await userEvent.type(replyBox, '내 답글');
    const form = replyBox.closest('form');
    expect(form).not.toBeNull();
    await userEvent.click(within(form as HTMLElement).getByRole('button', { name: '등록' }));

    expect(addComment).toHaveBeenCalledWith('내 답글', 'r1');
  });

  it('좋아요를 누르면 toggleLike(댓글id)를 부른다 (로그인 상태)', async () => {
    const toggleLike = vi.fn();
    renderSection({ comments: makeComments({ visibleCount: 1, threads: [thread(comment({ id: 'c9' }))], toggleLike }) });

    await userEvent.click(screen.getByRole('button', { name: '좋아요' }));
    expect(toggleLike).toHaveBeenCalledWith('c9');
  });

  it('비로그인 상태에서 좋아요를 누르면 로그인 게이트를 연다', async () => {
    const onRequireLogin = vi.fn();
    const toggleLike = vi.fn();
    renderSection({
      comments: makeComments({ visibleCount: 1, threads: [thread(comment())], toggleLike }),
      isLoggedIn: false,
      onRequireLogin
    });

    await userEvent.click(screen.getByRole('button', { name: '좋아요' }));
    expect(toggleLike).not.toHaveBeenCalled();
    expect(onRequireLogin).toHaveBeenCalledTimes(1);
  });

  it('내 댓글을 삭제하면 확인 후 remove(댓글id)를 부른다', async () => {
    const remove = vi.fn(async () => undefined);
    const mine = comment({ id: 'c-mine', user_id: 'me' });
    renderSection({
      comments: makeComments({ visibleCount: 1, threads: [thread(mine)], remove }),
      currentUserId: 'me'
    });

    await userEvent.click(screen.getByRole('button', { name: '삭제' }));

    const dialog = screen.getByRole('dialog', { name: '댓글을 삭제할까요?' });
    await userEvent.click(within(dialog).getByRole('button', { name: '삭제' }));

    expect(remove).toHaveBeenCalledWith('c-mine');
  });

  it('남의 댓글에는 삭제 버튼이 없다', () => {
    renderSection({
      comments: makeComments({ visibleCount: 1, threads: [thread(comment({ user_id: 'someone-else' }))] }),
      currentUserId: 'me'
    });

    expect(screen.queryByRole('button', { name: '삭제' })).not.toBeInTheDocument();
  });
});
