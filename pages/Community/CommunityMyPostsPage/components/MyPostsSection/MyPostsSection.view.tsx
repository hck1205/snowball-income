import { COMMUNITY_COPY } from '@/shared/constants/community';
import { Banner, Button } from '@/components/common';
import { EmptyState, RelativeTime, VisuallyHidden } from '@/components/community';
import type { MyPostsSectionViewProps } from './MyPostsSection.types';
import {
  Count,
  HeaderRow,
  Hint,
  ItemLink,
  ItemTitle,
  List,
  MetaRow,
  RetryRow,
  Section,
  SkeletonList,
  SkeletonRow,
  TitleRow,
  VisibilityBadge
} from './MyPostsSection.styled';

const m = COMMUNITY_COPY.myPosts;

/**
 * 내 글 목록(공개 + **비공개**)의 순수 뷰. 상태 4종(로딩/에러/빈/목록)만 그린다.
 *
 * 공개 전환 버튼은 두지 않는다 — 되돌리기 어려운 동작이라 글 상세/수정의 공개 토글로 보낸다.
 * (그 안내는 헤더 아래 Hint 가 상시 노출한다.)
 */
export default function MyPostsSectionView({ viewModel }: MyPostsSectionViewProps) {
  const { items, status, retry } = viewModel;

  return (
    /*
     * 보이는 제목을 두지 않는다 — 이 섹션은 전용 페이지("내가 쓴 글" h1) 안에 단독으로 놓이므로
     * 시각적으로는 제목이 두 번 반복될 뿐이다(프로필 설정 안의 한 섹션이던 시절의 잔재).
     * 다만 랜드마크 이름은 유지해야 하므로 `aria-label` 로 접근명만 남긴다.
     */
    <Section aria-label={m.sectionLabel}>
      <HeaderRow>{status === 'ready' ? <Count>{m.count(items.length)}</Count> : null}</HeaderRow>
      <Hint>{m.hint}</Hint>

      {status === 'loading' ? (
        <div aria-busy="true">
          <VisuallyHidden role="status">{m.listLoading}</VisuallyHidden>
          <SkeletonList aria-hidden="true">
            {Array.from({ length: 3 }).map((_, index) => (
              <SkeletonRow key={index} />
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

      {status === 'empty' ? <EmptyState title={m.emptyTitle} subtitle={m.emptySubtitle} /> : null}

      {status === 'ready' ? (
        <List>
          {items.map((item) => {
            // 상세 경로는 글의 섹션(kind)을 따른다 — PostCard/PostRow와 동일 규칙.
            const detailPath =
              item.kind === 'board' ? `/community/board/${item.id}` : `/community/portfolio/${item.id}`;

            return (
              <li key={item.id}>
                <ItemLink to={detailPath}>
                  <TitleRow>
                    {/* 색만으로 구분하지 않도록 라벨 텍스트를 반드시 동반한다. */}
                    <VisibilityBadge isPublic={item.is_public}>
                      {item.is_public ? m.visibilityPublic : m.visibilityPrivate}
                    </VisibilityBadge>
                    <ItemTitle>{item.title}</ItemTitle>
                  </TitleRow>
                  <MetaRow>
                    {item.kind === 'board' ? m.kindBoard : m.kindPortfolio}
                    {' · '}
                    <RelativeTime iso={item.created_at} />
                  </MetaRow>
                </ItemLink>
              </li>
            );
          })}
        </List>
      ) : null}
    </Section>
  );
}
