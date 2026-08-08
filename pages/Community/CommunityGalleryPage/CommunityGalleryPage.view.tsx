import { useEffect, useMemo, useRef } from 'react';
import { COMMUNITY_COPY } from '@/shared/constants/community';
import { parseScenarioSimSummary } from '@/shared/lib/snowball';
import { Button, PickCardGrid, Tabs } from '@/components/common';
import {
  ClockIcon,
  CommunitySearchBar,
  FlameIcon,
  GridIcon,
  ListIcon,
  PencilIcon
} from '@/components/community';
import {
  FeedCardSkeletons,
  FeedEmpty,
  FeedError,
  FeedMasthead,
  FeedRowSkeletons,
  FeedTail,
  PostFeedRow,
  PostGalleryCard
} from '@/pages/Community/components';
import type { CommunityGalleryViewProps } from './CommunityGalleryPage.types';
import {
  FeedDeck,
  InlineList,
  SearchRow,
  Sentinel,
  ViewToggle,
  ViewToggleButton,
  ViewToggleLabel
} from './CommunityGalleryPage.styled';

const g = COMMUNITY_COPY.gallery;

/**
 * 머리 면 카피.
 *
 * `shared/constants/community/copy.ts` 가 아니라 여기 있는 이유: 이 세 문장은 **갤러리 목록
 * 화면의 조판 요소**이고 다른 화면이 쓰지 않는다. 공용 카피 파일은 여러 화면이 동시에 고치는
 * 자리라, 한 화면에서만 쓰는 문장을 거기 두면 충돌만 늘린다. 여러 화면이 같은 문장을 요구하는
 * 순간 그때 공용으로 올린다.
 */
const MASTHEAD = {
  eyebrow: '커뮤니티',
  title: '배당계산 갤러리',
  lead: '다른 투자자가 공유한 배당 포트폴리오와 시뮬레이션 결과를 살펴보십시오.'
} as const;

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
    clearFilters,
    onWrite
  } = viewModel;

  const sentinelRef = useRef<HTMLDivElement>(null);

  // sim_summary는 서버 jsonb라 신뢰하지 않는다 — 검증 파서를 통과한 값만 프리뷰로 쓴다(오염 값은
  // null → 텍스트 카드/행 폴백, §E·§I). items가 바뀔 때만 1회 파싱한다(렌더마다 재파싱 방지).
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
    <section aria-label={g.mainLabel}>
      {/* 화면의 이름·성격·주 행동. 글쓰기 CTA 가 헤더도 컨트롤 줄도 아닌 여기 있는 이유는
          FeedMasthead 머리말 참고(문맥은 제목이 주고, 폭은 머리 면이 통째로 갖는다). */}
      <FeedMasthead
        eyebrow={MASTHEAD.eyebrow}
        title={MASTHEAD.title}
        lead={MASTHEAD.lead}
        actionLabel={COMMUNITY_COPY.nav.write}
        actionIcon={<PencilIcon size={16} strokeWidth={1.8} />}
        onAction={onWrite}
      />

      {/* 검색은 본문 첫 줄이다 — 앱 헤더 가운데 슬롯에서 내려왔다(2026-07-31 사용자 지시).
          정렬·뷰 토글과 같은 줄에 두지 않는 이유는 SearchRow 주석 참고. */}
      <SearchRow>
        <CommunitySearchBar />
      </SearchRow>

      <FeedDeck>
        <Tabs
          ariaLabel={g.sortAriaLabel}
          activeId={sort}
          onChange={(id) => setSort(id === 'popular' ? 'popular' : 'recent')}
          items={[
            { id: 'recent', label: g.sortRecent, icon: <ClockIcon size={16} strokeWidth={1.8} /> },
            { id: 'popular', label: g.sortPopular, icon: <FlameIcon size={16} strokeWidth={1.8} /> }
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
            <GridIcon size={14} strokeWidth={1.8} />
            <ViewToggleLabel>카드</ViewToggleLabel>
          </ViewToggleButton>
          <ViewToggleButton
            type="button"
            active={viewType === 'inline'}
            aria-pressed={viewType === 'inline'}
            aria-label={g.viewInline}
            onClick={() => onToggleView('inline')}
          >
            <ListIcon size={14} strokeWidth={1.8} />
            <ViewToggleLabel>목록</ViewToggleLabel>
          </ViewToggleButton>
        </ViewToggle>
      </FeedDeck>

      {status === 'loading' ? (
        <div aria-busy="true">{viewType === 'card' ? <FeedCardSkeletons /> : <FeedRowSkeletons />}</div>
      ) : null}

      {status === 'error' ? (
        <FeedError title={g.errorTitle} body={g.errorBody} retryLabel={g.retry} onRetry={retry} />
      ) : null}

      {status === 'empty' ? (
        <FeedEmpty
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
        <FeedEmpty
          title={g.searchEmptyTitle(query)}
          subtitle={g.searchEmptySubtitle}
          action={
            <Button variant="secondary" onClick={clearSearch}>
              {g.searchEmptyCta}
            </Button>
          }
        />
      ) : null}

      {status === 'filteredEmpty' ? (
        <FeedEmpty
          title={g.filterEmptyTitle}
          subtitle={g.filterEmptySubtitle}
          action={
            <Button variant="secondary" onClick={clearFilters}>
              {g.filterEmptyCta}
            </Button>
          }
        />
      ) : null}

      {status === 'ready' ? (
        <>
          {viewType === 'card' ? (
            /* 고르는 카드의 격자 — 열 폭·간격·부상 여유를 공용 부품이 소유한다(손으로 적지 않는다). */
            <PickCardGrid as="ul" minColumnWidth="300px">
              {parsedItems.map(({ item, simSummary }) => (
                <PostGalleryCard key={item.id} item={item} simSummary={simSummary} />
              ))}
            </PickCardGrid>
          ) : (
            <InlineList>
              {parsedItems.map(({ item, simSummary }) => (
                <li key={item.id}>
                  <PostFeedRow item={item} simSummary={simSummary} />
                </li>
              ))}
            </InlineList>
          )}

          <Sentinel ref={sentinelRef} />
          <FeedTail
            isLoadingMore={isLoadingMore}
            loadMoreError={loadMoreError}
            reachedEnd={reachedEnd}
            loadingLabel={g.loadingMore}
            endLabel={g.reachedEnd}
            errorLabel={COMMUNITY_COPY.common.genericError}
            retryLabel={g.retry}
            onRetry={retry}
          />
        </>
      ) : null}
    </section>
  );
}
