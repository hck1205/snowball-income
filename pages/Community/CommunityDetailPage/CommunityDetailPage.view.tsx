import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { COMMUNITY_COPY } from '@/shared/constants/community';
import { formatKRW } from '@/shared/utils/format';
import { Banner, Button, ScrollTopButton, ShareDialog } from '@/components/common';
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
import { CommentSection, ScenarioPreview } from './components';
import type { CommunityDetailViewProps } from './CommunityDetailPage.types';
import {
  ActionRail,
  Article,
  AttachAction,
  AttachCard,
  AttachHead,
  AttachRail,
  AttachStat,
  AttachStats,
  AttachTitle,
  AuthorName,
  BannerAction,
  BodyColumn,
  BodyGrid,
  Byline,
  BylineAvatar,
  BylineMeta,
  CommentsBand,
  DetailShell,
  Dot,
  Kicker,
  Masthead,
  RailLike,
  ShareButton,
  ShareToast,
  SkeletonBar,
  SkeletonLines,
  SkeletonShell,
  StateWrap,
  Title
} from './CommunityDetailPage.styled';

const d = COMMUNITY_COPY.detail;

/** 첨부 조건 3칸의 라벨. 그전에는 " · " 로 이어 붙인 한 줄 회색 텍스트였다. */
const ATTACH_STAT_LABELS = { ticker: '보유 티커', initial: '초기 투자금', monthly: '월 적립액' } as const;

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

  /*
   * 로딩은 **들어올 글의 모양**으로 자리를 잡는다(머리글 한 줄 + 제목 두 줄 + 본문 네 줄).
   * 그전에는 "불러오는 중…" 한 줄이 화면 전체를 대신해, 로드가 끝나는 순간 레이아웃이 통째로 튀었다.
   */
  if (detail.status === 'loading') {
    return (
      <SkeletonShell aria-busy="true" aria-label="불러오는 중">
        <SkeletonBar w="48px" h="6px" />
        <SkeletonBar w="min(100%, 620px)" h="40px" />
        <SkeletonBar w="min(70%, 420px)" h="40px" />
        <SkeletonBar w="220px" h="20px" />
        <SkeletonLines>
          <SkeletonBar w="100%" h="14px" />
          <SkeletonBar w="96%" h="14px" />
          <SkeletonBar w="99%" h="14px" />
          <SkeletonBar w="62%" h="14px" />
        </SkeletonLines>
      </SkeletonShell>
    );
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

      {/* 🔴 `Article` 은 상단 바와 같은 부모(DetailShell)의 직계 자식이어야 한다 — 좌우 경계 정합 계약. */}
      <Article aria-label={d.mainLabel}>
        {/*
         * 머리글. 카드를 벗기고 제목을 화면에서 가장 큰 타이포로 올렸다.
         * 작성자·시간·조회수는 아바타 거터 오른쪽 두 줄로 접어 제목과 무게를 다투지 않게 한다.
         */}
        <Masthead>
          <Kicker aria-hidden="true" />
          {/*
           * `tabIndex={-1}` 은 "맨 위로" 버튼이 포커스를 넘길 자리다(탭 순서에는 들어가지 않는다).
           * 전역 포커스 링은 `[tabindex='-1']` 을 일부러 제외한다.
           */}
          <Title ref={titleRef} tabIndex={-1}>
            {post.title}
          </Title>
          <Byline>
            <BylineAvatar>
              <Avatar displayName={authorName} avatarUrl={post.author?.avatar_url} size="md" />
            </BylineAvatar>
            <AuthorName>{authorName}</AuthorName>
            <BylineMeta>
              <RelativeTime iso={post.created_at} />
              <Dot aria-hidden="true">·</Dot>
              <span className="views">
                {COMMUNITY_COPY.gallery.metaViews} {detail.viewCount}
              </span>
            </BylineMeta>
          </Byline>
        </Masthead>

        {/*
         * 🔴 DOM 순서는 [본문][레일] 이다 — 모바일에서는 이 순서 그대로 흐르고(기존 배치와 동일),
         * 데스크톱에서만 grid-template-areas 가 레일을 본문 왼쪽으로 옮겨 sticky 로 세운다.
         */}
        <BodyGrid>
          <BodyColumn>
            {post.body ? <RichTextContent html={post.body} /> : null}

            {post.payload && detail.openInSimulatorHref ? (
              <AttachCard aria-label={d.attachCtaTitle}>
                <AttachRail aria-hidden="true" />
                <AttachHead>
                  <AttachTitle>{d.attachCtaTitle}</AttachTitle>
                  {/* 래퍼가 하는 일은 하나 — 헤딩 서체의 잉크 중심에 버튼을 맞추는 광학 보정이다. */}
                  <AttachAction>
                    <Button variant="primary" onClick={onOpenInSimulator}>
                      {d.attachCtaButton}
                    </Button>
                  </AttachAction>
                </AttachHead>
                {/* 조건 3종을 라벨/값 격자로 세운다 — 이 글이 다루는 전제이므로 읽히는 무게를 올렸다. */}
                <AttachStats>
                  <AttachStat>
                    <dt>{ATTACH_STAT_LABELS.ticker}</dt>
                    <dd>{`${ticker}종목`}</dd>
                  </AttachStat>
                  <AttachStat>
                    <dt>{ATTACH_STAT_LABELS.initial}</dt>
                    <dd>{formatKRW(initial)}</dd>
                  </AttachStat>
                  <AttachStat>
                    <dt>{ATTACH_STAT_LABELS.monthly}</dt>
                    <dd>{formatKRW(monthly)}</dd>
                  </AttachStat>
                </AttachStats>
                <ScenarioPreview payload={post.payload} />
              </AttachCard>
            ) : null}
          </BodyColumn>

          {/* 반응 레일 — 데스크톱에서는 본문 왼쪽에 서서 따라 내려온다(긴 글 도중에도 손이 닿는다). */}
          <ActionRail>
            <RailLike>
              <LikeButton
                size="md"
                liked={detail.liked}
                count={detail.likeCount}
                disabled={detail.likePending}
                onToggle={detail.toggleLike}
              />
            </RailLike>
            {canShare ? (
              <ShareButton type="button" aria-label={d.shareAria} onClick={onShare}>
                <ShareIcon size={16} strokeWidth={1.8} />
                {d.share}
              </ShareButton>
            ) : null}
          </ActionRail>
        </BodyGrid>

        <CommentsBand>
          <CommentSection
            comments={comments}
            isLoggedIn={isLoggedIn}
            currentUserId={currentUserId}
            onRequireLogin={onRequireLogin}
          />
        </CommentsBand>

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

        {/* 데스크톱 공유 창 — 자기 자신을 body 로 포털한다(상세 본문에 잘리지 않게). */}
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
       * 갇힌다 — 본문 바깥, 페이지 스택 바로 아래가 가장 안전한 자리다.
       */}
      <ScrollTopButton focusRef={titleRef} />
    </DetailShell>
  );
}
