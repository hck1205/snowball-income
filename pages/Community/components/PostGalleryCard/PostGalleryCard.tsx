import { COMMUNITY_COPY } from '@/shared/constants/community';
import { buildPostShareUrl, formatCompactCount } from '@/shared/lib/community';
import {
  ChartIcon,
  CommentIcon,
  EyeIcon,
  HeartIcon,
  PencilIcon,
  PostShareButton,
  RelativeTime,
  SimBadge,
  SimSummaryStats,
  VisuallyHidden
} from '@/components/community';
import type { PostGalleryCardProps } from './PostGalleryCard.types';
import {
  CardSummary,
  GalleryCardShell,
  MetaCount,
  MetaCounts,
  MetaStrip,
  SimTile,
  SubtitleAuthor,
  SubtitleDot
} from './PostGalleryCard.styled';

const { metaViews, metaLikes, metaComments } = COMMUNITY_COPY.gallery;

/**
 * 갤러리 격자의 글 카드 — **고르는 면**이므로 공용 `PickCard` 위에 세운다.
 *
 * ## 예전 카드에서 바꾼 것
 * - **순서**: (숫자판) → 제목 → 요약 → 메타 → 구분선 → 푸터  ⟶  6px 레일 + 글리프 →
 *   **제목** → 작성자·시간 → 요약 → 숫자판 → 계수 줄. 카드에서 가장 먼저 읽혀야 하는 것이
 *   글의 이름이라는 판단이다. 숫자는 "결론"이라 아래에 두되 크기(30px)로 무게를 유지한다.
 * - **형태**: 그림자만 있던 면 → 테두리(평상) + hover 부상(`PickCard` 규율). 눌릴 수 있음을
 *   정적 무게가 아니라 상태 변화로 말한다.
 * - **기하**: 24px 반경 → `PICK_RADIUS`(30~34px). 고르는 면의 반경 대역으로 옮겼다.
 * - **색**: 시뮬 첨부 여부를 6px 레일 색 + **글리프 모양**이 함께 말한다(색 단독 채널 금지).
 *   레일은 높이 6px 이라 `tintscan` 의 면 하한(8px) 아래다 — 격자에 몇 장이 깔려도 예산 0.
 */
export default function PostGalleryCard({ item, simSummary }: PostGalleryCardProps) {
  const authorName = item.author?.display_name ?? '익명';
  // 상세 링크는 글의 섹션(kind)을 따른다 — 포트폴리오=/community/portfolio/:id, 게시판=/community/board/:id.
  const detailPath = item.kind === 'board' ? `/community/board/${item.id}` : `/community/portfolio/${item.id}`;
  const hasSim = Boolean(simSummary) || item.has_payload;

  return (
    <GalleryCardShell
      as="li"
      to={detailPath}
      titleAs="h3"
      title={item.title}
      subtitle={
        <>
          <SubtitleAuthor>{authorName}</SubtitleAuthor>
          <SubtitleDot aria-hidden="true">·</SubtitleDot>
          <RelativeTime iso={item.created_at} />
        </>
      }
      cap={{
        kind: 'rail',
        axis: hasSim ? 'accent' : 'brand',
        glyph: hasSim ? (
          <ChartIcon size={20} strokeWidth={1.8} />
        ) : (
          <PencilIcon size={20} strokeWidth={1.8} />
        )
      }}
      // 숫자판이 없을 때만 배지가 "시뮬 첨부"를 대신 말한다 — 숫자가 있으면 숫자가 이미 말한다.
      titleRight={!simSummary && item.has_payload ? <SimBadge /> : undefined}
      actions={
        <MetaStrip>
          <MetaCounts>
            <MetaCount>
              <EyeIcon size={12} strokeWidth={1.8} />
              <VisuallyHidden>{metaViews}</VisuallyHidden>
              {formatCompactCount(item.view_count)}
            </MetaCount>
            <MetaCount>
              <CommentIcon size={12} strokeWidth={1.8} />
              <VisuallyHidden>{metaComments}</VisuallyHidden>
              {formatCompactCount(item.comment_count)}
            </MetaCount>
            <MetaCount>
              <HeartIcon size={12} strokeWidth={1.8} />
              <VisuallyHidden>{metaLikes}</VisuallyHidden>
              {formatCompactCount(item.like_count)}
            </MetaCount>
          </MetaCounts>
          {/* 카드 전체가 상세 링크라, 공유는 클릭 시 네비게이션을 막고 그 글의 공개 URL을 공유한다. */}
          <PostShareButton
            postId={item.id}
            kind={item.kind}
            title={item.title}
            url={buildPostShareUrl(detailPath)}
            placement="feed"
          />
        </MetaStrip>
      }
    >
      {item.description ? <CardSummary>{item.description}</CardSummary> : null}
      {simSummary ? (
        <SimTile>
          <SimSummaryStats variant="card" summary={simSummary} />
        </SimTile>
      ) : null}
    </GalleryCardShell>
  );
}
