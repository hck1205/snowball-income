import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { COMMUNITY_COPY } from '@/shared/constants/community';
import { formatKRW } from '@/shared/utils/format';
import { Banner, Button } from '@/components/common';
import {
  Avatar,
  ConfirmDialog,
  EmptyState,
  LikeButton,
  PencilIcon,
  RelativeTime,
  TrashIcon
} from '@/components/community';
import { RichTextContent } from '@/components/community/RichTextContent';
import { CommentSection, ScenarioPreview } from './components';
import type { CommunityDetailViewProps } from './CommunityDetailPage.types';
import {
  Article,
  AttachCta,
  AttachCtaInfo,
  AttachUnit,
  BannerAction,
  CommentsCard,
  DetailHeader,
  Dot,
  HeaderTopRow,
  LikeRow,
  MetaRow,
  OwnerActions,
  PostCard,
  StateWrap,
  Title
} from './CommunityDetailPage.styled';

const d = COMMUNITY_COPY.detail;

export default function CommunityDetailView({ viewModel }: CommunityDetailViewProps) {
  const { detail, comments, isLoggedIn, currentUserId, onRequireLogin, onEdit, onOpenInSimulator } = viewModel;
  const navigate = useNavigate();
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (detail.status === 'loading') {
    return <EmptyState title="불러오는 중…" />;
  }

  if (detail.status === 'notfound') {
    return (
      <StateWrap>
        <EmptyState
          title={d.notFoundTitle}
          action={
            <Button variant="secondary" onClick={() => navigate('/community')}>
              {d.notFoundCta}
            </Button>
          }
        />
      </StateWrap>
    );
  }

  if (detail.status === 'error' || !detail.scenario) {
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

  const scenario = detail.scenario;
  const authorName = scenario.author?.display_name ?? '익명';
  const ticker = scenario.payload?.portfolio?.tickerProfiles?.length ?? 0;
  const initial = scenario.payload?.investmentSettings?.initialInvestment ?? 0;
  const monthly = scenario.payload?.investmentSettings?.monthlyContribution ?? 0;

  return (
    <Article aria-label={d.mainLabel}>
      <PostCard>
        <DetailHeader>
          <HeaderTopRow>
            <Title>{scenario.title}</Title>
            {detail.isOwner ? (
              <OwnerActions>
                <Button
                  variant="ghost"
                  size="sm"
                  startIcon={<PencilIcon size={16} />}
                  onClick={onEdit}
                  aria-label={d.edit}
                >
                  {d.edit}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  startIcon={<TrashIcon size={16} />}
                  onClick={() => setDeleteOpen(true)}
                  aria-label={d.delete}
                >
                  {d.delete}
                </Button>
              </OwnerActions>
            ) : null}
          </HeaderTopRow>
          <MetaRow>
            <Avatar displayName={authorName} avatarUrl={scenario.author?.avatar_url} size="sm" />
            <b>{authorName}</b>
            <Dot aria-hidden="true">·</Dot>
            <RelativeTime iso={scenario.created_at} />
            <Dot aria-hidden="true">·</Dot>
            <span className="views">
              {COMMUNITY_COPY.gallery.metaViews} {detail.viewCount}
            </span>
          </MetaRow>
        </DetailHeader>

        {scenario.body ? <RichTextContent html={scenario.body} /> : null}

        {scenario.payload && detail.openInSimulatorHref ? (
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
            <ScenarioPreview payload={scenario.payload} />
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
    </Article>
  );
}
