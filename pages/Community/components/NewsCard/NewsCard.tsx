import { Heart, MessageSquare } from 'lucide-react';
import { COMMUNITY_COPY } from '@/shared/constants/community';
import { ICON } from '@/shared/styles';
import { newsHostLabel, parseNewsPayload, type NewsListItem } from '@/shared/lib/supabase';
import {
  Body,
  CardRoot,
  Foot,
  FootAuthor,
  FootAvatar,
  FootLink,
  FootStat,
  Note,
  Source,
  Summary,
  Thumb,
  Title
} from './NewsCard.styled';

const copy = COMMUNITY_COPY.news;

/**
 * 미디어 뉴스 한 장.
 *
 * 🔴 **카드 전체가 원문으로 가는 링크다.** 이 화면이 모으는 것은 우리 글이 아니라 바깥 글이고,
 * 사용자가 카드를 누르는 이유도 원문을 읽기 위해서다. 그래서 우리 상세 페이지가 아니라
 * 원문으로 보낸다 — 댓글·좋아요는 상세에서 하지만, 그건 이 카드의 주된 목적이 아니다.
 * ⚠ 그래서 카드 안에 **다른 링크를 넣지 않는다**(중첩 링크는 유효하지 않은 DOM 이다).
 *   좋아요·댓글 수는 링크가 아니라 **숫자 표시**로만 둔다.
 *
 * 🔴 `payload` 는 서버 jsonb 이고 그 안의 문자열은 남의 사이트에서 왔다 — `parseNewsPayload` 를
 * 통과한 값만 그린다. 통과하지 못하면 **아무것도 그리지 않는다**(깨진 카드보다 없는 편이 낫다).
 *
 * ⚠ `rel="noopener nofollow ugc"`: noopener 는 보안(새 창이 우리 창을 조작하지 못하게),
 *   nofollow·ugc 는 SEO — 사용자가 붙인 링크에 우리 도메인의 신뢰를 실어 주지 않는다.
 */
export default function NewsCard({ item }: { item: NewsListItem }) {
  const news = parseNewsPayload(item.payload);
  if (!news) return null;

  const author = item.author?.display_name ?? '';

  return (
    <CardRoot href={news.url} target="_blank" rel="noopener nofollow ugc">
      {news.image ? (
        <Thumb>
          {/* 장식이 아니라 원문의 대표 그림이지만, 제목이 바로 아래 있어 이름은 제목이 진다. */}
          <img src={news.image} alt="" loading="lazy" decoding="async" />
        </Thumb>
      ) : null}

      <Body>
        <Source>{newsHostLabel(news)}</Source>
        <Title>{news.title}</Title>
        {news.summary ? <Summary>{news.summary}</Summary> : null}
        {/* 공유한 사람이 붙인 한 줄. 원문 요약과 섞이지 않게 왼쪽 레일을 갖는다. */}
        {item.description ? <Note>{item.description}</Note> : null}
      </Body>

      <Foot>
        <FootAuthor>
          {item.author?.avatar_url ? (
            <FootAvatar src={item.author.avatar_url} alt="" loading="lazy" decoding="async" />
          ) : null}
          {author}
        </FootAuthor>
        <FootStat>
          <Heart size={12} strokeWidth={ICON.stroke} aria-hidden focusable={false} />
          {item.like_count}
        </FootStat>
        <FootStat>
          <MessageSquare size={12} strokeWidth={ICON.stroke} aria-hidden focusable={false} />
          {item.comment_count}
        </FootStat>
        <FootLink>{copy.openOriginal}</FootLink>
      </Foot>
    </CardRoot>
  );
}
