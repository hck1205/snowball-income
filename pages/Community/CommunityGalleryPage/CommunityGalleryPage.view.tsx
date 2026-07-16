import { useEffect, useRef } from 'react';
import { COMMUNITY_COPY } from '@/shared/constants/community';
import { Banner, Button, Tabs } from '@/components/common';
import {
  ClockIcon,
  EmptyState,
  FlameIcon,
  GridIcon,
  ListIcon,
  ScenarioCard,
  ScenarioRow,
  UsersIcon
} from '@/components/community';
import type { CommunityGalleryViewProps } from './CommunityGalleryPage.types';
import {
  BannerAction,
  CardGrid,
  ControlBar,
  ErrorWrap,
  InlineList,
  InlineRetry,
  LoadStatus,
  Sentinel,
  SkeletonCard,
  SkeletonLine,
  SkeletonRow,
  Spinner,
  ViewToggle,
  ViewToggleButton
} from './CommunityGalleryPage.styled';

const g = COMMUNITY_COPY.gallery;

const CardSkeletons = () => (
  <CardGrid aria-hidden="true">
    {Array.from({ length: 6 }).map((_, index) => (
      <li key={index}>
        <SkeletonCard>
          <SkeletonLine w="40%" />
          <SkeletonLine w="80%" h="18px" />
          <SkeletonLine w="60%" />
          <SkeletonLine w="50%" />
        </SkeletonCard>
      </li>
    ))}
  </CardGrid>
);

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

export default function CommunityGalleryView({ viewModel }: CommunityGalleryViewProps) {
  const {
    items,
    status,
    sort,
    query,
    viewType,
    reachedEnd,
    isLoadingMore,
    loadMoreError,
    setSort,
    onToggleView,
    loadMore,
    retry,
    clearSearch,
    onWrite
  } = viewModel;

  const sentinelRef = useRef<HTMLDivElement>(null);

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
    <section aria-label={g.mainLabel}>
      <ControlBar>
        <Tabs
          ariaLabel={g.sortAriaLabel}
          activeId={sort}
          onChange={(id) => setSort(id === 'popular' ? 'popular' : 'recent')}
          items={[
            { id: 'recent', label: g.sortRecent, icon: <ClockIcon size={15} /> },
            { id: 'popular', label: g.sortPopular, icon: <FlameIcon size={15} /> }
          ]}
        />
        <ViewToggle>
          <ViewToggleButton
            type="button"
            active={viewType === 'card'}
            aria-pressed={viewType === 'card'}
            aria-label={g.viewCard}
            onClick={() => onToggleView('card')}
          >
            <GridIcon size={16} />
          </ViewToggleButton>
          <ViewToggleButton
            type="button"
            active={viewType === 'inline'}
            aria-pressed={viewType === 'inline'}
            aria-label={g.viewInline}
            onClick={() => onToggleView('inline')}
          >
            <ListIcon size={16} />
          </ViewToggleButton>
        </ViewToggle>
      </ControlBar>

      {status === 'loading' ? (
        <div aria-busy="true">{viewType === 'card' ? <CardSkeletons /> : <RowSkeletons />}</div>
      ) : null}

      {status === 'error' ? (
        <ErrorWrap>
          <Banner tone="danger" role="alert" title={g.errorTitle}>
            {g.errorBody}
            <BannerAction>
              <Button variant="secondary" size="sm" onClick={retry}>
                {g.retry}
              </Button>
            </BannerAction>
          </Banner>
        </ErrorWrap>
      ) : null}

      {status === 'empty' ? (
        <EmptyState
          icon={<UsersIcon size={24} />}
          title={g.emptyTitle}
          subtitle={g.emptySubtitle}
          action={
            <Button variant="primary" onClick={onWrite}>
              {g.emptyCta}
            </Button>
          }
        />
      ) : null}

      {status === 'searchEmpty' ? (
        <EmptyState
          title={g.searchEmptyTitle(query)}
          subtitle={g.searchEmptySubtitle}
          action={
            <Button variant="secondary" onClick={clearSearch}>
              {g.searchEmptyCta}
            </Button>
          }
        />
      ) : null}

      {status === 'ready' ? (
        <>
          {viewType === 'card' ? (
            <CardGrid>
              {items.map((item) => (
                <li key={item.id}>
                  <ScenarioCard item={item} />
                </li>
              ))}
            </CardGrid>
          ) : (
            <InlineList>
              {items.map((item) => (
                <li key={item.id}>
                  <ScenarioRow item={item} />
                </li>
              ))}
            </InlineList>
          )}

          <Sentinel ref={sentinelRef} />
          <LoadStatus role="status" aria-live="polite">
            {loadMoreError ? (
              <>
                {COMMUNITY_COPY.common.genericError}{' '}
                <InlineRetry type="button" onClick={retry}>
                  {g.retry}
                </InlineRetry>
              </>
            ) : isLoadingMore ? (
              <>
                <Spinner aria-hidden="true" />
                {g.loadingMore}
              </>
            ) : reachedEnd ? (
              g.reachedEnd
            ) : null}
          </LoadStatus>
        </>
      ) : null}
    </section>
  );
}
