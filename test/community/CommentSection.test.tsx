import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CommentSection } from '@/pages/Community/CommunityDetailPage/components/CommentSection';
import type { UseComments } from '@/pages/Community/CommunityDetailPage/hooks';
import type { CommentThread, CommentWithAuthor } from '@/shared/lib/supabase';

const comment = (over: Partial<CommentWithAuthor> = {}): CommentWithAuthor => ({
  id: 'c1',
  post_id: 's1',
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
  totalCount: 0,
  hasMore: false,
  isLoadingMore: false,
  loadMoreError: false,
  likedCommentIds: new Set<string>(),
  likePendingIds: new Set<string>(),
  submitting: false,
  submitError: null,
  actionError: null,
  isPending: () => false,
  retry: vi.fn(),
  loadMore: vi.fn(),
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
    renderSection({ comments: makeComments({ totalCount: 5, threads: [thread(comment())] }) });
    expect(screen.getByText('댓글 5')).toBeInTheDocument();
  });

  it('빈 상태(글 없음) 안내', () => {
    renderSection({ comments: makeComments({ totalCount: 0, threads: [] }) });
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

  it('대댓글 1단계를 렌더하고, 대댓글에도 답글 버튼을 둔다 (같은 스레드로 이어짐)', () => {
    const root = comment({ id: 'r1', body: '루트 댓글' });
    const reply = comment({ id: 'c2', parent_id: 'r1', body: '대댓글', user_id: 'author-2' });
    renderSection({ comments: makeComments({ totalCount: 2, threads: [thread(root, [reply])] }) });

    expect(screen.getByText('루트 댓글')).toBeInTheDocument();
    expect(screen.getByText('대댓글')).toBeInTheDocument();
    // 루트 + 대댓글 모두 답글 가능 (스레드는 1단계 평면 유지)
    expect(screen.getAllByRole('button', { name: '답글' })).toHaveLength(2);
  });

  it('소프트 삭제된 댓글은 자리표시자로만 남는다', () => {
    const deleted = comment({ id: 'r1', body: '', deleted_at: '2026-07-14T01:00:00Z' });
    const reply = comment({ id: 'c2', parent_id: 'r1', body: '살아있는 대댓글', user_id: 'author-2' });
    renderSection({ comments: makeComments({ totalCount: 1, threads: [thread(deleted, [reply])] }) });

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
    renderSection({ comments: makeComments({ totalCount: 1, threads: [thread(root)], addComment }) });

    await userEvent.click(screen.getByRole('button', { name: '답글' }));

    const replyBox = screen.getByRole('textbox', { name: '답글' });
    await userEvent.type(replyBox, '내 답글');
    const form = replyBox.closest('form');
    expect(form).not.toBeNull();
    await userEvent.click(within(form as HTMLElement).getByRole('button', { name: '등록' }));

    expect(addComment).toHaveBeenCalledWith('내 답글', 'r1');
  });

  it('대댓글의 답글 버튼도 같은 루트 스레드에 addComment(본문, 루트id)를 부른다', async () => {
    const addComment = vi.fn(async () => true);
    const root = comment({ id: 'r1', body: '루트 댓글' });
    const reply = comment({ id: 'c2', parent_id: 'r1', body: '마지막 대댓글', user_id: 'author-2' });
    renderSection({ comments: makeComments({ totalCount: 2, threads: [thread(root, [reply])], addComment }) });

    // 대댓글(두 번째) 쪽 답글 버튼 클릭
    await userEvent.click(screen.getAllByRole('button', { name: '답글' })[1]);

    const replyBox = screen.getByRole('textbox', { name: '답글' });
    await userEvent.type(replyBox, '대화 이어가기');
    const form = replyBox.closest('form');
    expect(form).not.toBeNull();
    await userEvent.click(within(form as HTMLElement).getByRole('button', { name: '등록' }));

    // 부모는 대댓글(c2)이 아니라 루트(r1) — 1단계 평면 스레드 유지
    expect(addComment).toHaveBeenCalledWith('대화 이어가기', 'r1');
  });

  it('좋아요를 누르면 toggleLike(댓글id)를 부른다 (로그인 상태)', async () => {
    const toggleLike = vi.fn();
    renderSection({ comments: makeComments({ totalCount: 1, threads: [thread(comment({ id: 'c9' }))], toggleLike }) });

    await userEvent.click(screen.getByRole('button', { name: '좋아요' }));
    expect(toggleLike).toHaveBeenCalledWith('c9');
  });

  it('비로그인 상태에서 좋아요를 누르면 로그인 게이트를 연다', async () => {
    const onRequireLogin = vi.fn();
    const toggleLike = vi.fn();
    renderSection({
      comments: makeComments({ totalCount: 1, threads: [thread(comment())], toggleLike }),
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
      comments: makeComments({ totalCount: 1, threads: [thread(mine)], remove }),
      currentUserId: 'me'
    });

    await userEvent.click(screen.getByRole('button', { name: '삭제' }));

    const dialog = screen.getByRole('dialog', { name: '댓글을 삭제할까요?' });
    await userEvent.click(within(dialog).getByRole('button', { name: '삭제' }));

    expect(remove).toHaveBeenCalledWith('c-mine');
  });

  it('남의 댓글에는 삭제 버튼이 없다', () => {
    renderSection({
      comments: makeComments({ totalCount: 1, threads: [thread(comment({ user_id: 'someone-else' }))] }),
      currentUserId: 'me'
    });

    expect(screen.queryByRole('button', { name: '삭제' })).not.toBeInTheDocument();
  });
});

describe('CommentSection — 등록 실패 표면화', () => {
  it('실패 사유를 alert로 보여주고 입력을 보존한다 (재시도 가능)', async () => {
    const addComment = vi.fn(async () => false);
    renderSection({
      comments: makeComments({
        addComment,
        submitError: '댓글을 너무 빠르게 작성하고 있습니다. 잠시 후 다시 시도해 주세요'
      })
    });

    const box = screen.getByRole('textbox', { name: '댓글' });
    await userEvent.type(box, '열두 번째 댓글');
    await userEvent.click(screen.getByRole('button', { name: '등록' }));

    expect(addComment).toHaveBeenCalledWith('열두 번째 댓글');
    // 실패 시 입력 보존 — 그대로 다시 등록할 수 있다
    expect(box).toHaveValue('열두 번째 댓글');
    expect(screen.getByRole('alert')).toHaveTextContent('댓글을 너무 빠르게 작성하고 있습니다');
  });

  it('성공하면 입력을 비운다 (에러 해제는 훅 계약 — useComments 테스트)', async () => {
    renderSection({ comments: makeComments() });

    const box = screen.getByRole('textbox', { name: '댓글' });
    await userEvent.type(box, '정상 댓글');
    await userEvent.click(screen.getByRole('button', { name: '등록' }));

    expect(box).toHaveValue('');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('답글 컴포저가 열려 있으면 에러를 그쪽에서 보여준다', async () => {
    const root = comment({ id: 'r1' });
    renderSection({
      comments: makeComments({
        totalCount: 1,
        threads: [thread(root)],
        submitError: '댓글을 등록하지 못했어요. 잠시 후 다시 시도해 주세요.'
      })
    });

    await userEvent.click(screen.getByRole('button', { name: '답글' }));

    const replyBox = screen.getByRole('textbox', { name: '답글' });
    const form = replyBox.closest('form');
    expect(form).not.toBeNull();
    expect(within(form as HTMLElement).getByRole('alert')).toHaveTextContent('등록하지 못했어요');
    // 루트 컴포저 쪽엔 중복 표시하지 않는다 (alert는 폼 안의 1개만)
    expect(screen.getAllByRole('alert')).toHaveLength(1);
  });

  it('삭제/좋아요 실패(actionError)도 alert로 알린다', () => {
    renderSection({
      comments: makeComments({ actionError: '댓글을 삭제하지 못했어요. 잠시 후 다시 시도해 주세요.' })
    });

    expect(screen.getByRole('alert')).toHaveTextContent('댓글을 삭제하지 못했어요');
  });
});

describe('CommentSection — 무한 스크롤(더 보기)', () => {
  it('남은 페이지가 있으면 더 보기 버튼이 loadMore를 부른다', async () => {
    const loadMore = vi.fn();
    renderSection({
      comments: makeComments({ totalCount: 30, hasMore: true, threads: [thread(comment())], loadMore })
    });

    await userEvent.click(screen.getByRole('button', { name: '더 보기' }));
    expect(loadMore).toHaveBeenCalledTimes(1);
  });

  it('마지막 페이지면 더 보기 UI가 없다', () => {
    renderSection({ comments: makeComments({ totalCount: 1, hasMore: false, threads: [thread(comment())] }) });

    expect(screen.queryByRole('button', { name: '더 보기' })).not.toBeInTheDocument();
  });

  it('추가 로드 중이면 role=status로 로딩을 알린다', () => {
    renderSection({
      comments: makeComments({ totalCount: 30, hasMore: true, isLoadingMore: true, threads: [thread(comment())] })
    });

    expect(screen.getByRole('status')).toHaveTextContent('더 불러오는 중…');
  });

  it('추가 로드 실패 시 에러와 재시도(더 보기)가 함께 보인다', () => {
    renderSection({
      comments: makeComments({ totalCount: 30, hasMore: true, loadMoreError: true, threads: [thread(comment())] })
    });

    expect(screen.getByRole('alert')).toHaveTextContent('잠시 후 다시 시도해주세요.');
    expect(screen.getByRole('button', { name: '더 보기' })).toBeInTheDocument();
  });
});
