import { useEffect, useMemo, useRef } from 'react';
import { COMMUNITY_COPY } from '@/shared/constants/community';
import { parseScenarioSimSummary } from '@/shared/lib/snowball';
import { Banner, Button } from '@/components/common';
import { EmptyState, PencilIcon, PostRow, UsersIcon } from '@/components/community';
import type { CommunityBoardViewProps } from './CommunityBoardPage.types';
import {
  BannerAction,
  BoardHeader,
  BoardHeading,
  BoardList,
  BoardSubtitle,
  BoardTitle,
  ErrorWrap,
  InlineRetry,
  LoadStatus,
  Sentinel,
  SkeletonLine,
  SkeletonRow,
  Spinner
} from './CommunityBoardPage.styled';

const b = COMMUNITY_COPY.board;

const RowSkeletons = () => (
  <div aria-hidden="true">
    {Array.from({ length: 8 }).map((_, index) => (
      <SkeletonRow key={index}>
        <SkeletonLine w="55%" />
        <SkeletonLine w="20%" />
      </SkeletonRow>
    ))}
  </div>
);

export default function CommunityBoardView({ viewModel }: CommunityBoardViewProps) {
  const { items, status, reachedEnd, isLoadingMore, loadMoreError, loadMore, retry, onWrite } = viewModel;

  const sentinelRef = useRef<HTMLDivElement>(null);

  // sim_summary는 서버 jsonb라 신뢰하지 않는다 — 검증 파서를 통과한 값만 프리뷰로 쓴다(오염 값은 null).
  // 게시판 글은 대개 첨부가 없어 null → PostRow가 텍스트 행으로 폴백한다.
  const parsedItems = useMemo(
    () => items.map((item) => ({ item, simSummary: parseScenarioSimSummary(item.sim_summary) })),
    [items]
  );

  useEffect(() => {
    if (status !== 'ready' || reachedEnd) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) loadMore();
      },
      { rootMargin: '400px 0px' }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore, reachedEnd, status]);

  return (
    <section aria-label={b.mainLabel}>
      <BoardHeader>
        <BoardHeading>
          <BoardTitle>{b.title}</BoardTitle>
          <BoardSubtitle>{b.subtitle}</BoardSubtitle>
        </BoardHeading>
        <Button variant="primary" size="sm" startIcon={<PencilIcon size={16} />} onClick={onWrite}>
          {b.write}
        </Button>
      </BoardHeader>

      {status === 'loading' ? <div aria-busy="true">{<RowSkeletons />}</div> : null}

      {status === 'error' ? (
        <ErrorWrap>
          <Banner tone="danger" role="alert" title={b.errorTitle}>
            {b.errorBody}
            <BannerAction>
              <Button variant="secondary" size="sm" onClick={retry}>
                {b.retry}
              </Button>
            </BannerAction>
          </Banner>
        </ErrorWrap>
      ) : null}

      {status === 'empty' ? (
        <EmptyState
          icon={<UsersIcon size={24} />}
          title={b.emptyTitle}
          subtitle={b.emptySubtitle}
          action={
            <Button variant="primary" onClick={onWrite}>
              {b.emptyCta}
            </Button>
          }
        />
      ) : null}

      {status === 'ready' ? (
        <>
          <BoardList>
            {parsedItems.map(({ item, simSummary }) => (
              <li key={item.id}>
                <PostRow item={item} simSummary={simSummary} />
              </li>
            ))}
          </BoardList>

          <Sentinel ref={sentinelRef} />
          <LoadStatus role="status" aria-live="polite">
            {loadMoreError ? (
              <>
                {COMMUNITY_COPY.common.genericError}{' '}
                <InlineRetry type="button" onClick={retry}>
                  {b.retry}
                </InlineRetry>
              </>
            ) : isLoadingMore ? (
              <>
                <Spinner aria-hidden="true" />
                {b.loadingMore}
              </>
            ) : reachedEnd ? (
              b.reachedEnd
            ) : null}
          </LoadStatus>
        </>
      ) : null}
    </section>
  );
}
