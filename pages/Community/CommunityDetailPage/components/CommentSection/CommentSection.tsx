import { useState } from 'react';
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
  Composer,
  ComposerBar,
  ComposerCounter,
  CommentTextarea,
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
  isReply: boolean;
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
  isReply,
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
        {!isReply ? (
          <TextAction type="button" onClick={() => (isLoggedIn ? onReply(comment.id) : onRequireLogin())}>
            {c.reply}
          </TextAction>
        ) : null}
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
  submitting
}: {
  onSubmit: (body: string) => Promise<boolean>;
  submitting: boolean;
}) => {
  const [value, setValue] = useState('');
  return (
    <ReplyComposerForm
      onSubmit={async (event) => {
        event.preventDefault();
        const ok = await onSubmit(value);
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

  return (
    <Section aria-label={c.sectionLabel}>
      <SectionHeading>{c.heading(comments.visibleCount)}</SectionHeading>

      {isLoggedIn ? (
        <Composer
          onSubmit={async (event) => {
            event.preventDefault();
            const ok = await comments.addComment(rootValue);
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

      {comments.status === 'ready' && comments.visibleCount === 0 ? <StateText>{c.empty}</StateText> : null}

      {comments.status === 'ready' && comments.threads.length > 0 ? (
        <ThreadList>
          {comments.threads.map((thread) => (
            <li key={thread.comment.id}>
              <SingleComment
                comment={thread.comment}
                isReply={false}
                comments={comments}
                currentUserId={currentUserId}
                isLoggedIn={isLoggedIn}
                onRequireLogin={onRequireLogin}
                onReply={(id) => setReplyFor((prev) => (prev === id ? null : id))}
                onRequestDelete={setDeleteTarget}
              />
              {replyFor === thread.comment.id && isLoggedIn ? (
                <ReplyComposer
                  submitting={comments.submitting}
                  onSubmit={async (body) => {
                    const ok = await comments.addComment(body, thread.comment.id);
                    if (ok) setReplyFor(null);
                    return ok;
                  }}
                />
              ) : null}
              {thread.replies.length > 0 ? (
                <ReplyList>
                  {thread.replies.map((reply) => (
                    <li key={reply.id}>
                      <SingleComment
                        comment={reply}
                        isReply
                        comments={comments}
                        currentUserId={currentUserId}
                        isLoggedIn={isLoggedIn}
                        onRequireLogin={onRequireLogin}
                        onReply={() => undefined}
                        onRequestDelete={setDeleteTarget}
                      />
                    </li>
                  ))}
                </ReplyList>
              ) : null}
            </li>
          ))}
        </ThreadList>
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
