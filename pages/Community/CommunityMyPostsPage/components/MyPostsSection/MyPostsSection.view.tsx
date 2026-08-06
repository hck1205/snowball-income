import { useState } from 'react';
import { Globe, Lock } from 'lucide-react';
import { COMMUNITY_COPY } from '@/shared/constants/community';
import { Banner, BrandGlyph, Button } from '@/components/common';
import {
  ChartIcon,
  CommentIcon,
  EyeIcon,
  HeartIcon,
  ListIcon,
  RelativeTime,
  VisuallyHidden
} from '@/components/community';
import type { MyPostsSectionViewProps, MyPostsVisibilityFilter } from './MyPostsSection.types';
import {
  EmptyAction,
  EmptyActions,
  EmptyGlyph,
  EmptyRoot,
  EmptySubtitle,
  EmptyTitle,
  FilterBar,
  FilterChip,
  FilterCount,
  FilterEmpty,
  Hint,
  ItemExcerpt,
  ItemFoot,
  ItemLink,
  ItemStat,
  ItemStats,
  ItemTitle,
  ItemTopRow,
  KindChip,
  List,
  RetryRow,
  Section,
  SectionRoot,
  SkeletonBar,
  SkeletonCard,
  SkeletonList,
  VisibilityBadge
} from './MyPostsSection.styled';

const m = COMMUNITY_COPY.myPosts;

/** 필터 레일 카피 — 목록 밖 컨트롤이라 목록 카피(COMMUNITY_COPY.myPosts)와 섞지 않는다. */
const FILTER_GROUP_LABEL = '공개 범위';
const FILTER_ALL = '전체';
const FILTER_EMPTY = '이 범위에는 글이 없습니다. 위에서 다른 범위를 골라 주세요.';
const STAT_LIKES = '좋아요';
const STAT_COMMENTS = '댓글';
const STAT_VIEWS = '조회';
const EMPTY_GALLERY_CTA = '갤러리에 글 쓰기';
const EMPTY_BOARD_CTA = '게시판에 글 쓰기';

const FILTERS: readonly { id: MyPostsVisibilityFilter; label: string }[] = [
  { id: 'all', label: FILTER_ALL },
  { id: 'public', label: m.visibilityPublic },
  { id: 'private', label: m.visibilityPrivate }
];

/**
 * 내 글 아카이브(공개 + **비공개**)의 순수 뷰.
 *
 * 공개 전환 버튼은 두지 않는다 — 되돌리기 어려운 동작이라 글 상세/수정의 공개 토글로 보낸다.
 * (그 안내는 목록 머리의 Hint 가 상시 노출한다.)
 *
 * 공개 범위 필터는 **순수 표시 상태**라 여기 로컬로 둔다(useMyPosts 계약 불변).
 */
export default function MyPostsSectionView({ viewModel }: MyPostsSectionViewProps) {
  const { items, status, retry } = viewModel;
  const [filter, setFilter] = useState<MyPostsVisibilityFilter>('all');

  const publicCount = items.filter((item) => item.is_public).length;
  const counts: Record<MyPostsVisibilityFilter, number> = {
    all: items.length,
    public: publicCount,
    private: items.length - publicCount
  };

  const visible = items.filter((item) => {
    if (filter === 'public') return item.is_public;
    if (filter === 'private') return !item.is_public;
    return true;
  });

  return (
    <SectionRoot>
      {/* 필터 레일은 **목록 밖**에 선다 — 고르는 면과 읽는 면을 섞지 않는다. */}
      {status === 'ready' && items.length > 0 ? (
        <FilterBar role="group" aria-label={FILTER_GROUP_LABEL}>
          {FILTERS.map((entry) => (
            <FilterChip
              key={entry.id}
              type="button"
              active={filter === entry.id}
              aria-pressed={filter === entry.id}
              onClick={() => setFilter(entry.id)}
            >
              {entry.label}
              <FilterCount>{m.count(counts[entry.id])}</FilterCount>
            </FilterChip>
          ))}
        </FilterBar>
      ) : null}

      {/*
       * 보이는 제목을 두지 않는다 — 이 섹션은 전용 페이지("내가 쓴 글" h1) 안에 단독으로 놓이므로
       * 시각적으로는 제목이 두 번 반복될 뿐이다. 랜드마크 이름만 aria-label 로 남긴다.
       */}
      <Section aria-label={m.sectionLabel}>
        <Hint>
          <Lock size={14} strokeWidth={1.8} aria-hidden focusable={false} />
          {m.hint}
        </Hint>

        {status === 'loading' ? (
          <div aria-busy="true">
            <VisuallyHidden role="status">{m.listLoading}</VisuallyHidden>
            <SkeletonList aria-hidden="true">
              {Array.from({ length: 4 }).map((_, index) => (
                <SkeletonCard key={index}>
                  <SkeletonBar w="88px" h="18px" />
                  <SkeletonBar w="90%" h="20px" />
                  <SkeletonBar w="65%" h="20px" />
                  <SkeletonBar w="100%" h="14px" />
                </SkeletonCard>
              ))}
            </SkeletonList>
          </div>
        ) : null}

        {status === 'error' ? (
          <Banner tone="danger" role="alert" title={m.errorTitle}>
            {m.errorBody}
            <RetryRow>
              <Button variant="secondary" size="sm" onClick={retry}>
                {m.retry}
              </Button>
            </RetryRow>
          </Banner>
        ) : null}

        {status === 'empty' ? (
          <EmptyRoot>
            {/* 빈 상태 마스코트는 브랜드 계단(96)을 쓴다 — 커뮤니티 피드·포폴의 빈 상태와 같은 크기다. */}
            <EmptyGlyph>
              <BrandGlyph size={96} />
            </EmptyGlyph>
            <EmptyTitle>{m.emptyTitle}</EmptyTitle>
            <EmptySubtitle>{m.emptySubtitle}</EmptySubtitle>
            <EmptyActions>
              <EmptyAction to="/community/portfolio/write" $primary>
                {EMPTY_GALLERY_CTA}
              </EmptyAction>
              <EmptyAction to="/community/board/write">{EMPTY_BOARD_CTA}</EmptyAction>
            </EmptyActions>
          </EmptyRoot>
        ) : null}

        {status === 'ready' && visible.length === 0 ? <FilterEmpty>{FILTER_EMPTY}</FilterEmpty> : null}

        {status === 'ready' && visible.length > 0 ? (
          <List>
            {visible.map((item) => {
              // 상세 경로는 글의 섹션(kind)을 따른다 — PostCard/PostRow와 동일 규칙.
              const isBoard = item.kind === 'board';
              const detailPath = isBoard
                ? `/community/board/${item.id}`
                : `/community/portfolio/${item.id}`;

              return (
                <li key={item.id}>
                  <ItemLink to={detailPath} $isPublic={item.is_public}>
                    <ItemTopRow>
                      {/* 색만으로 구분하지 않도록 라벨 텍스트와 글리프를 반드시 동반한다. */}
                      <VisibilityBadge isPublic={item.is_public}>
                        {item.is_public ? (
                          <Globe size={12} strokeWidth={1.8} aria-hidden focusable={false} />
                        ) : (
                          <Lock size={12} strokeWidth={1.8} aria-hidden focusable={false} />
                        )}
                        {item.is_public ? m.visibilityPublic : m.visibilityPrivate}
                      </VisibilityBadge>
                      <KindChip>
                        {isBoard ? (
                          <ListIcon size={12} strokeWidth={1.8} />
                        ) : (
                          <ChartIcon size={12} strokeWidth={1.8} />
                        )}
                        {isBoard ? m.kindBoard : m.kindPortfolio}
                      </KindChip>
                    </ItemTopRow>

                    <ItemTitle>{item.title}</ItemTitle>
                    {item.description ? <ItemExcerpt>{item.description}</ItemExcerpt> : null}

                    <ItemFoot>
                      <RelativeTime iso={item.created_at} />
                      <ItemStats>
                        <ItemStat>
                          {/* 계수 글리프는 피드 카드·행(PostGalleryCard/PostFeedRow)과 같은 12/1.8 이다. */}
                          <HeartIcon size={12} strokeWidth={1.8} />
                          <VisuallyHidden>{STAT_LIKES}</VisuallyHidden>
                          {item.like_count}
                        </ItemStat>
                        <ItemStat>
                          <CommentIcon size={12} strokeWidth={1.8} />
                          <VisuallyHidden>{STAT_COMMENTS}</VisuallyHidden>
                          {item.comment_count}
                        </ItemStat>
                        <ItemStat>
                          <EyeIcon size={12} strokeWidth={1.8} />
                          <VisuallyHidden>{STAT_VIEWS}</VisuallyHidden>
                          {item.view_count}
                        </ItemStat>
                      </ItemStats>
                    </ItemFoot>
                  </ItemLink>
                </li>
              );
            })}
          </List>
        ) : null}
      </Section>
    </SectionRoot>
  );
}
