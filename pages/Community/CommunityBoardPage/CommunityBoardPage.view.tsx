import { useEffect, useMemo, useRef } from 'react';
import { COMMUNITY_COPY, POST_CATEGORY_IDS } from '@/shared/constants/community';
import { parseScenarioSimSummary } from '@/shared/lib/snowball';
import { Button } from '@/components/common';
import { PencilIcon } from '@/components/community';
import {
  FeedEmpty,
  FeedError,
  FeedMasthead,
  FeedRowSkeletons,
  FeedTail,
  PostFeedRow
} from '@/pages/Community/components';
import type { CommunityBoardViewProps } from './CommunityBoardPage.types';
import {
  BoardLegend,
  BoardLegendItem,
  BoardLegendLabel,
  BoardList,
  Sentinel
} from './CommunityBoardPage.styled';

const b = COMMUNITY_COPY.board;

/** 머리 면 소제목. 갤러리와 같은 낱말을 써서 두 목록이 한 축(커뮤니티)임을 말한다. */
const MASTHEAD_EYEBROW = '커뮤니티';

/** 범례 라벨. 분류 낱말 자체는 글쓰기 드롭다운과 **같은 맵**을 쓴다(표기가 어긋나지 않게). */
const LEGEND_LABEL = '글 종류';

export default function CommunityBoardView({ viewModel }: CommunityBoardViewProps) {
  const { items, status, reachedEnd, isLoadingMore, loadMoreError, loadMore, retry, onWrite } = viewModel;

  const sentinelRef = useRef<HTMLDivElement>(null);

  // sim_summary는 서버 jsonb라 신뢰하지 않는다 — 검증 파서를 통과한 값만 프리뷰로 쓴다(오염 값은 null).
  // 게시판 글은 대개 첨부가 없어 null → PostFeedRow가 텍스트 행으로 폴백한다.
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
      {/* 예전에는 h1 + 회색 한 줄 + 우측 버튼이 전부였다 — 목록과 같은 무게라 머리가 없는 화면이었다. */}
      <FeedMasthead
        eyebrow={MASTHEAD_EYEBROW}
        title={b.title}
        lead={b.subtitle}
        actionLabel={b.write}
        actionIcon={<PencilIcon size={16} strokeWidth={1.8} />}
        onAction={onWrite}
      />

      {/* 목록에 나타날 분류 배지를 미리 읽어 둔다(필터가 아니라 범례 — BoardLegend 주석). */}
      <BoardLegend>
        <BoardLegendLabel>{LEGEND_LABEL}</BoardLegendLabel>
        {POST_CATEGORY_IDS.map((id) => (
          <BoardLegendItem key={id}>{COMMUNITY_COPY.write.categoryLabels[id]}</BoardLegendItem>
        ))}
      </BoardLegend>

      {status === 'loading' ? (
        <div aria-busy="true">
          <FeedRowSkeletons />
        </div>
      ) : null}

      {status === 'error' ? (
        <FeedError title={b.errorTitle} body={b.errorBody} retryLabel={b.retry} onRetry={retry} />
      ) : null}

      {status === 'empty' ? (
        <FeedEmpty
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
                <PostFeedRow item={item} simSummary={simSummary} />
              </li>
            ))}
          </BoardList>

          <Sentinel ref={sentinelRef} />
          <FeedTail
            isLoadingMore={isLoadingMore}
            loadMoreError={loadMoreError}
            reachedEnd={reachedEnd}
            loadingLabel={b.loadingMore}
            endLabel={b.reachedEnd}
            errorLabel={COMMUNITY_COPY.common.genericError}
            retryLabel={b.retry}
            onRetry={retry}
          />
        </>
      ) : null}
    </section>
  );
}
