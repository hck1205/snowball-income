import { COMMUNITY_COPY } from '@/shared/constants/community';
import { buildPostShareUrl, formatCompactCount } from '@/shared/lib/community';
import {
  CommentIcon,
  EyeIcon,
  HeartIcon,
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
 * - **색**: 2026-08-05 부터 이 카드는 **캡을 갖지 않는다**(사용자 지시). 시뮬 첨부 여부는 카드 안의
 *   숫자판과 `SimBadge` 가 말한다 — 레일 색·글리프는 같은 사실의 세 번째 반복이었다.
 */
export default function PostGalleryCard({ item, simSummary }: PostGalleryCardProps) {
  const authorName = item.author?.display_name ?? '익명';
  // 상세 링크는 글의 섹션(kind)을 따른다 — 포트폴리오=/community/portfolio/:id, 게시판=/community/board/:id.
  const detailPath = item.kind === 'board' ? `/community/board/${item.id}` : `/community/portfolio/${item.id}`;

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
      /*
       * 🔴 **캡(6px 레일 + 글리프 배지)을 걷어냈다**(2026-08-05 사용자 지시: "카드 타이틀 위 아이콘이
       * 아무 의미 없고 카드마다 반복돼 불필요하다").
       *
       * 종전에는 레일 색 + 글리프 모양이 "시뮬 첨부 여부"를 말했다. 문제는 그 사실이 **카드 안에서
       * 이미 두 번 더** 말해지고 있었다는 것이다 — 숫자판(SimSummaryStats)이 있거나, 없으면
       * `SimBadge` 가 뜬다. 세 번째 채널은 정보가 아니라 소음이었고, 격자에 12장이 깔리면
       * 같은 아이콘이 12번 반복돼 카드 제목보다 먼저 눈에 들어왔다.
       *
       * ⚠ **글리프만 빼고 레일만 남기지 마라.** 그러면 색이 유일한 채널이 되어 회색조·색각이상에서
       *   구분이 사라진다(PickCard 가 cap.glyph 를 필수로 둔 이유). 없앨 거면 캡째 없앤다.
       */
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
