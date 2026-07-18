import { useEffect, useRef, useState } from 'react';
import { COMMUNITY_COPY } from '@/shared/constants/community';
import { COMMENT_BODY_MAX_LENGTH, type CommentWithAuthor } from '@/shared/lib/supabase';
import { Banner, Button } from '@/components/common';
import { Avatar, ConfirmDialog, LikeButton, RelativeTime } from '@/components/community';
import type { UseComments } from '@/pages/Community/CommunityDetailPage/hooks';
import {
  BannerAction,
  CommentActions,
  CommentBody,
  CommentHead,
  CommentRoot,
  CommentsSentinel,
  Composer,
  ComposerBar,
  ComposerCounter,
  CommentTextarea,
  InlineAlert,
  LoadMoreWrap,
  LoadStatusText,
  LoginPrompt,
  ReplyComposerForm,
  ReplyList,
  Section,
  SectionHeading,
  StateText,
  TextAction,
  ThreadList
} from './CommentSection.styled';

const c = COMMUNITY_COPY.comments;

export type CommentSectionProps = {
  comments: UseComments;
  isLoggedIn: boolean;
  currentUserId: string | null;
  onRequireLogin: () => void;
};

type SingleCommentProps = {
  comment: CommentWithAuthor;
  comments: UseComments;
  currentUserId: string | null;
  isLoggedIn: boolean;
  onRequireLogin: () => void;
  onReply: (parentId: string) => void;
  onRequestDelete: (commentId: string) => void;
};

const CommentAuthorLine = ({ comment }: { comment: CommentWithAuthor }) => {
  const name = comment.author?.display_name ?? '익명';
  return (
    <CommentHead>
      <Avatar displayName={name} avatarUrl={comment.author?.avatar_url} size="sm" />
      <b>{name}</b>
      <RelativeTime iso={comment.created_at} />
    </CommentHead>
  );
};

const SingleComment = ({
  comment,
  comments,
  currentUserId,
  isLoggedIn,
  onRequireLogin,
  onReply,
  onRequestDelete
}: SingleCommentProps) => {
  const isDeleted = comment.deleted_at !== null;
  const pending = comments.isPending(comment.id);
  const isMine = currentUserId !== null && comment.user_id === currentUserId;

  if (isDeleted) {
    return (
      <CommentRoot>
        <CommentBody deleted>{c.deletedPlaceholder}</CommentBody>
      </CommentRoot>
    );
  }

  return (
    <CommentRoot pending={pending}>
      <CommentAuthorLine comment={comment} />
      <CommentBody>{comment.body}</CommentBody>
      <CommentActions>
        <LikeButton
          liked={comments.likedCommentIds.has(comment.id)}
          count={comment.like_count}
          disabled={pending || comments.likePendingIds.has(comment.id)}
          onToggle={() => (isLoggedIn ? comments.toggleLike(comment.id) : onRequireLogin())}
        />
        {/* 대댓글에도 답글을 허용하되, 스레드는 1단계 평면 구조를 유지한다
            (velog·유튜브 방식 — 답글의 답글도 같은 루트 스레드 맨 아래에 달린다) */}
        <TextAction type="button" onClick={() => (isLoggedIn ? onReply(comment.id) : onRequireLogin())}>
          {c.reply}
        </TextAction>
        {isMine ? (
          <TextAction type="button" onClick={() => onRequestDelete(comment.id)}>
            {c.delete}
          </TextAction>
        ) : null}
      </CommentActions>
    </CommentRoot>
  );
};

const ReplyComposer = ({
  onSubmit,
  submitting,
  error
}: {
  onSubmit: (body: string) => Promise<boolean>;
  submitting: boolean;
  error: string | null;
}) => {
  const [value, setValue] = useState('');
  return (
    <ReplyComposerForm
      onSubmit={async (event) => {
        event.preventDefault();
        const ok = await onSubmit(value);
        // 실패 시 입력을 지우지 않는다 — 에러 안내를 보고 그대로 재시도할 수 있게.
        if (ok) setValue('');
      }}
    >
      <CommentTextarea
        aria-label={c.reply}
        placeholder={c.placeholder}
        maxLength={COMMENT_BODY_MAX_LENGTH}
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />
      {error ? <InlineAlert role="alert">{error}</InlineAlert> : null}
      <ComposerBar>
        <ComposerCounter>
          {value.length}/{COMMENT_BODY_MAX_LENGTH}
        </ComposerCounter>
        <Button type="submit" variant="primary" size="sm" loading={submitting} disabled={!value.trim()}>
          {c.submit}
        </Button>
      </ComposerBar>
    </ReplyComposerForm>
  );
};

export default function CommentSection({ comments, isLoggedIn, currentUserId, onRequireLogin }: CommentSectionProps) {
  const [rootValue, setRootValue] = useState('');
  const [replyFor, setReplyFor] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const { status, hasMore, loadMore } = comments;

  // 센티널 자동 로드 — 미지원/테스트 환경에서는 아래 "더 보기" 버튼이 같은 일을 한다.
  useEffect(() => {
    if (status !== 'ready' || !hasMore) return;
    if (typeof IntersectionObserver === 'undefined') return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) loadMore();
      },
      { rootMargin: '200px 0px' }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadMore, status]);

  return (
    <Section aria-label={c.sectionLabel}>
      <SectionHeading>{c.heading(comments.totalCount)}</SectionHeading>

      {/* 삭제/좋아요 실패 — 낙관적 롤백을 무음으로 두지 않는다. */}
      {comments.actionError ? <InlineAlert role="alert">{comments.actionError}</InlineAlert> : null}

      {isLoggedIn ? (
        <Composer
          onSubmit={async (event) => {
            event.preventDefault();
            const ok = await comments.addComment(rootValue);
            // 실패 시 입력을 지우지 않는다 — 에러 안내를 보고 그대로 재시도할 수 있게.
            if (ok) setRootValue('');
          }}
        >
          <CommentTextarea
            aria-label={c.sectionLabel}
            placeholder={c.placeholder}
            maxLength={COMMENT_BODY_MAX_LENGTH}
            value={rootValue}
            onChange={(event) => setRootValue(event.target.value)}
          />
          {/* 답글 컴포저가 열려 있으면 에러는 그쪽(마지막 입력 지점)에서 보여준다. */}
          {comments.submitError && replyFor === null ? (
            <InlineAlert role="alert">{comments.submitError}</InlineAlert>
          ) : null}
          <ComposerBar>
            <ComposerCounter>
              {rootValue.length}/{COMMENT_BODY_MAX_LENGTH}
            </ComposerCounter>
            <Button type="submit" variant="primary" size="sm" loading={comments.submitting} disabled={!rootValue.trim()}>
              {c.submit}
            </Button>
          </ComposerBar>
        </Composer>
      ) : (
        <LoginPrompt>
          <span>{c.loginPrompt}</span>
          <Button variant="secondary" size="sm" onClick={onRequireLogin}>
            {COMMUNITY_COPY.nav.login}
          </Button>
        </LoginPrompt>
      )}

      {comments.status === 'loading' ? <StateText>불러오는 중…</StateText> : null}

      {comments.status === 'error' ? (
        <Banner tone="danger" role="alert" title={c.errorTitle}>
          {COMMUNITY_COPY.common.genericError}
          <BannerAction>
            <Button variant="secondary" size="sm" onClick={comments.retry}>
              {c.retry}
            </Button>
          </BannerAction>
        </Banner>
      ) : null}

      {comments.status === 'ready' && comments.threads.length === 0 ? <StateText>{c.empty}</StateText> : null}

      {comments.status === 'ready' && comments.threads.length > 0 ? (
        <ThreadList>
          {comments.threads.map((thread) => (
            <li key={thread.comment.id}>
              <SingleComment
                comment={thread.comment}
                comments={comments}
                currentUserId={currentUserId}
                isLoggedIn={isLoggedIn}
                onRequireLogin={onRequireLogin}
                onReply={(id) => setReplyFor((prev) => (prev === id ? null : id))}
                onRequestDelete={setDeleteTarget}
              />
              {thread.replies.length > 0 ? (
                <ReplyList>
                  {thread.replies.map((reply) => (
                    <li key={reply.id}>
                      <SingleComment
                        comment={reply}
                        comments={comments}
                        currentUserId={currentUserId}
                        isLoggedIn={isLoggedIn}
                        onRequireLogin={onRequireLogin}
                        onReply={() =>
                          // 대댓글의 답글도 같은 루트 스레드로 — 1단계 평면 구조 유지
                          setReplyFor((prev) => (prev === thread.comment.id ? null : thread.comment.id))
                        }
                        onRequestDelete={setDeleteTarget}
                      />
                    </li>
                  ))}
                </ReplyList>
              ) : null}
              {/* 컴포저는 스레드 맨 아래 — 마지막 대댓글 뒤에서 대화를 이어간다 */}
              {replyFor === thread.comment.id && isLoggedIn ? (
                <ReplyComposer
                  submitting={comments.submitting}
                  error={comments.submitError}
                  onSubmit={async (body) => {
                    const ok = await comments.addComment(body, thread.comment.id);
                    if (ok) setReplyFor(null);
                    return ok;
                  }}
                />
              ) : null}
            </li>
          ))}
        </ThreadList>
      ) : null}

      {/* 루트 댓글 20개 단위 무한 스크롤 — 센티널(자동) + "더 보기"(수동/폴백) 겸용 */}
      {comments.status === 'ready' && comments.hasMore ? (
        <LoadMoreWrap>
          <CommentsSentinel ref={sentinelRef} aria-hidden="true" />
          {comments.loadMoreError ? (
            <InlineAlert role="alert">{COMMUNITY_COPY.common.genericError}</InlineAlert>
          ) : null}
          <LoadStatusText role="status" aria-live="polite">
            {comments.isLoadingMore ? c.loadingMore : null}
          </LoadStatusText>
          <Button variant="secondary" size="sm" loading={comments.isLoadingMore} onClick={() => comments.loadMore()}>
            {c.loadMore}
          </Button>
        </LoadMoreWrap>
      ) : null}

      {deleteTarget ? (
        <ConfirmDialog
          title={c.deleteConfirmTitle}
          confirmLabel={c.deleteConfirm}
          cancelLabel={c.deleteCancel}
          danger
          onConfirm={() => {
            void comments.remove(deleteTarget);
            setDeleteTarget(null);
          }}
          onCancel={() => setDeleteTarget(null)}
        />
      ) : null}
    </Section>
  );
}
