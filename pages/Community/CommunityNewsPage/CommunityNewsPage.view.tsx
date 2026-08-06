import { useEffect, useRef } from 'react';
import { COMMUNITY_COPY } from '@/shared/constants/community';
import { Button } from '@/components/common';
import { PencilIcon } from '@/components/community';
import { FeedCardSkeletons, FeedEmpty, FeedError, FeedMasthead, FeedTail, NewsCard, NewsCardList } from '../components';
import type { CommunityNewsViewProps } from './CommunityNewsPage.types';
import { Sentinel } from './CommunityNewsPage.styled';

const n = COMMUNITY_COPY.news;

/** 갤러리·게시판과 같은 낱말을 써서 세 목록이 한 축(커뮤니티)임을 말한다. */
const MASTHEAD_EYEBROW = '커뮤니티';

/**
 * `/community/news` — 미디어 뉴스 목록.
 *
 * 🔴 조판은 갤러리·게시판과 **같은 부품**(FeedMasthead·FeedEmpty·FeedTail)을 쓴다. 세 목록이
 * 같은 머리·같은 빈상태·같은 꼬리를 가져야 사용자가 화면을 옮길 때 규칙을 다시 배우지 않는다.
 * 다른 것은 줄이 아니라 **카드**라는 점 하나다 — 썸네일이 이 지면의 정보이기 때문이다.
 */
export default function CommunityNewsView({ viewModel }: CommunityNewsViewProps) {
  const { items, status, reachedEnd, isLoadingMore, loadMoreError, loadMore, retry, onWrite } = viewModel;
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
    <section aria-label={n.mainLabel}>
      <FeedMasthead
        eyebrow={MASTHEAD_EYEBROW}
        title={n.title}
        lead={n.subtitle}
        actionLabel={n.write}
        actionIcon={<PencilIcon size={16} strokeWidth={1.8} />}
        onAction={onWrite}
      />

      {status === 'loading' ? (
        <div aria-busy="true">
          <FeedCardSkeletons />
        </div>
      ) : null}

      {status === 'error' ? (
        <FeedError title={n.errorTitle} body={n.errorBody} retryLabel={n.retry} onRetry={retry} />
      ) : null}

      {status === 'empty' ? (
        <FeedEmpty
          title={n.emptyTitle}
          subtitle={n.emptySubtitle}
          action={
            <Button variant="primary" onClick={onWrite}>
              {n.emptyCta}
            </Button>
          }
        />
      ) : null}

      {status === 'ready' ? (
        <>
          <NewsCardList>
            {items.map((item) => (
              <li key={item.id}>
                {/* payload 를 못 읽는 행은 카드가 스스로 null 을 낸다 — 깨진 카드보다 없는 편이 낫다. */}
                <NewsCard item={item} />
              </li>
            ))}
          </NewsCardList>

          <Sentinel ref={sentinelRef} />
          <FeedTail
            isLoadingMore={isLoadingMore}
            loadMoreError={loadMoreError}
            reachedEnd={reachedEnd}
            loadingLabel={n.loadingMore}
            endLabel={n.reachedEnd}
            errorLabel={COMMUNITY_COPY.common.genericError}
            retryLabel={n.retry}
            onRetry={retry}
          />
        </>
      ) : null}
    </section>
  );
}
