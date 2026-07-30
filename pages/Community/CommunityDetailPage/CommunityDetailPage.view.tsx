import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { COMMUNITY_COPY } from '@/shared/constants/community';
import { formatKRW } from '@/shared/utils/format';
import { Banner, Button, ShareDialog } from '@/components/common';
import {
  Avatar,
  ConfirmDialog,
  EmptyState,
  LikeButton,
  PencilIcon,
  RelativeTime,
  ShareIcon,
  TrashIcon
} from '@/components/community';
import { RichTextContent } from '@/components/community/RichTextContent';
import { CommunityTopBar, TopBarActions } from '@/pages/Community/components';
import { CommentSection, ScenarioPreview, ScrollTopButton } from './components';
import type { CommunityDetailViewProps } from './CommunityDetailPage.types';
import {
  Article,
  AttachCta,
  AttachCtaInfo,
  AttachUnit,
  BannerAction,
  CommentsCard,
  DetailHeader,
  DetailShell,
  Dot,
  LikeRow,
  MetaRow,
  PostCard,
  ShareButton,
  ShareToast,
  StateWrap,
  Title
} from './CommunityDetailPage.styled';

const d = COMMUNITY_COPY.detail;

export default function CommunityDetailView({ viewModel }: CommunityDetailViewProps) {
  const {
    detail,
    comments,
    isLoggedIn,
    currentUserId,
    listPath,
    onRequireLogin,
    onEdit,
    onOpenInSimulator,
    canShare,
    onShare,
    shareToastMessage,
    shareTarget,
    isShareLinkCopied,
    onCopyShareLink,
    onSelectShareChannel,
    onCloseShare
  } = viewModel;
  const navigate = useNavigate();
  const [deleteOpen, setDeleteOpen] = useState(false);
  /* "맨 위로" 이후 포커스가 앉을 자리. 제목이라 스크린리더가 글 제목을 다시 읽어 준다. */
  const titleRef = useRef<HTMLHeadingElement>(null);
  const toastRoot = typeof document !== 'undefined' ? document.body : null;

  if (detail.status === 'loading') {
    return <EmptyState title="불러오는 중…" />;
  }

  if (detail.status === 'notfound') {
    return (
      <StateWrap>
        <EmptyState
          title={d.notFoundTitle}
          action={
            <Button variant="secondary" onClick={() => navigate(listPath)}>
              {d.notFoundCta}
            </Button>
          }
        />
      </StateWrap>
    );
  }

  if (detail.status === 'error' || !detail.post) {
    return (
      <StateWrap>
        <Banner tone="danger" role="alert" title={d.errorTitle}>
          {d.errorBody}
          <BannerAction>
            <Button variant="secondary" size="sm" onClick={detail.retry}>
              {d.retry}
            </Button>
          </BannerAction>
        </Banner>
      </StateWrap>
    );
  }

  const post = detail.post;
  const authorName = post.author?.display_name ?? '익명';
  const ticker = post.payload?.portfolio?.tickerProfiles?.length ?? 0;
  const initial = post.payload?.investmentSettings?.initialInvestment ?? 0;
  const monthly = post.payload?.investmentSettings?.monthlyContribution ?? 0;

  return (
    <DetailShell>
      {/*
       * 본문 첫 줄 = [← 목록] ↔ [수정][삭제] (2026-07-28 사용자 결정 — 게시판·갤러리 상세 공통).
       * 수정·삭제는 예전에 제목 오른쪽에 붙어 있어 긴 제목과 폭을 다퉜다.
       * 🔴 노출 조건(`detail.isOwner`)과 삭제 확인 다이얼로그는 그대로다 — 남의 글에서 보이면 결함이다.
       */}
      <CommunityTopBar
        actions={
          detail.isOwner ? (
            <TopBarActions>
              <Button
                variant="secondary"
                size="sm"
                startIcon={<PencilIcon size={16} strokeWidth={1.8} />}
                onClick={onEdit}
                aria-label={d.edit}
              >
                {d.edit}
              </Button>
              {/* 파괴적 액션은 danger — 옆의 중립 버튼과 색으로 구분된다. */}
              <Button
                variant="danger"
                size="sm"
                startIcon={<TrashIcon size={16} strokeWidth={1.8} />}
                onClick={() => setDeleteOpen(true)}
                aria-label={d.delete}
              >
                {d.delete}
              </Button>
            </TopBarActions>
          ) : null
        }
      />
      <Article aria-label={d.mainLabel}>
          <PostCard>
            <DetailHeader>
              {/*
               * `tabIndex={-1}` 은 "맨 위로" 버튼이 포커스를 넘길 자리를 만들기 위한 것이다(탭 순서
               * 에는 들어가지 않는다). 전역 포커스 링은 `[tabindex='-1']` 을 일부러 제외하므로
               * 클릭으로 제목을 눌러도 테두리가 생기지 않는다.
               */}
              <Title ref={titleRef} tabIndex={-1}>
                {post.title}
              </Title>
              <MetaRow>
                <Avatar displayName={authorName} avatarUrl={post.author?.avatar_url} size="sm" />
                <b>{authorName}</b>
                <Dot aria-hidden="true">·</Dot>
                <RelativeTime iso={post.created_at} />
                <Dot aria-hidden="true">·</Dot>
                <span className="views">
                  {COMMUNITY_COPY.gallery.metaViews} {detail.viewCount}
                </span>
              </MetaRow>
            </DetailHeader>

          {post.body ? <RichTextContent html={post.body} /> : null}

          {post.payload && detail.openInSimulatorHref ? (
            <AttachUnit>
              <AttachCta>
                <AttachCtaInfo>
                  <strong>{d.attachCtaTitle}</strong>
                  <span>{`티커 ${ticker}개 · 초기 ${formatKRW(initial)} · 월 ${formatKRW(monthly)}`}</span>
                </AttachCtaInfo>
                <Button variant="primary" onClick={onOpenInSimulator}>
                  {d.attachCtaButton}
                </Button>
              </AttachCta>
              <ScenarioPreview payload={post.payload} />
            </AttachUnit>
          ) : null}

          <LikeRow>
            <LikeButton
              size="md"
              liked={detail.liked}
              count={detail.likeCount}
              disabled={detail.likePending}
              onToggle={detail.toggleLike}
            />
            {canShare ? (
              <ShareButton type="button" aria-label={d.shareAria} onClick={onShare}>
                <ShareIcon size={16} strokeWidth={1.8} />
                {d.share}
              </ShareButton>
            ) : null}
          </LikeRow>
        </PostCard>

        <CommentsCard>
          <CommentSection
            comments={comments}
            isLoggedIn={isLoggedIn}
            currentUserId={currentUserId}
            onRequireLogin={onRequireLogin}
          />
        </CommentsCard>

        {deleteOpen ? (
          <ConfirmDialog
            title={d.deleteConfirmTitle}
            body={d.deleteConfirmBody}
            confirmLabel={d.deleteConfirm}
            cancelLabel={d.deleteCancel}
            danger
            loading={detail.deleting}
            onConfirm={() => void detail.remove()}
            onCancel={() => setDeleteOpen(false)}
          />
        ) : null}

        {/* 데스크톱 공유 창 — 자기 자신을 body 로 포털한다(상세 본문 카드에 잘리지 않게). */}
        {shareTarget ? (
          <ShareDialog
            url={shareTarget.url}
            isCopied={isShareLinkCopied}
            onCopy={onCopyShareLink}
            onSelectChannel={onSelectShareChannel}
            onClose={onCloseShare}
          />
        ) : null}

        {shareToastMessage && toastRoot
          ? createPortal(
              <ShareToast role="status" aria-live="polite">
                {shareToastMessage}
              </ShareToast>,
              toastRoot
            )
          : null}
      </Article>

      {/*
       * 본문·댓글을 다 내려간 뒤 위로 돌아가는 길. 임계(뷰포트 1개분) 아래에서는 렌더되지 않는다.
       * `Article` 밖에 두는 이유: fixed 요소는 조상이 transform/containment 를 얻는 순간 그 안에
       * 갇힌다 — 본문 카드 바깥, 페이지 스택 바로 아래가 가장 안전한 자리다.
       */}
      <ScrollTopButton focusRef={titleRef} />
    </DetailShell>
  );
}
