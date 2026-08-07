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
  const { items, status, reachedEnd, isLoadingMore, loadMoreError, loadMore, retry, canWrite, onWrite } = viewModel;
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
      {/* 공유 권한이 없으면 주 행동 자체를 넘기지 않는다 — 머리 면에 버튼이 서지 않는다. */}
      <FeedMasthead
        eyebrow={MASTHEAD_EYEBROW}
        title={n.title}
        lead={n.subtitle}
        actionLabel={canWrite ? n.write : undefined}
        actionIcon={canWrite ? <PencilIcon size={16} strokeWidth={1.8} /> : undefined}
        onAction={canWrite ? onWrite : undefined}
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
          /* 빈 상태의 출구도 같은 권한을 본다 — 여기만 열어 두면 머리 면에서 막은 것이 무의미해진다. */
          action={
            canWrite ? (
              <Button variant="primary" onClick={onWrite}>
                {n.emptyCta}
              </Button>
            ) : undefined
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
