import { Heart, MessageSquare } from 'lucide-react';
import { COMMUNITY_COPY } from '@/shared/constants/community';
import { ICON } from '@/shared/styles';
import { linkHostLabel, parseLinkPayload, type NewsListItem } from '@/shared/lib/supabase';
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
} from './FireCard.styled';

const copy = COMMUNITY_COPY.fire;

/**
 * 미디어 뉴스 한 장.
 *
 * 🔴 **카드는 우리 상세 화면으로 간다**(2026-08-09 사용자 신고로 바꿨다). 뉴스 지면이었을 때는
 * 카드가 곧바로 원문으로 나갔다 — 사용자가 카드를 누르는 이유가 원문을 읽기 위해서였으니까.
 * 그런데 파이어족들은 **댓글·좋아요가 목적**인 지면이라, 밖으로 먼저 내보내면 그 기능에 닿을
 * 길이 없다. 원본으로 나가는 길은 상세 화면의 버튼 하나(`FireLinkBlock`)가 진다.
 * ⚠ 그래서 카드 안에 **다른 링크를 넣지 않는다**(중첩 링크는 유효하지 않은 DOM 이다).
 *   좋아요·댓글 수는 링크가 아니라 **숫자 표시**로만 둔다.
 *
 * 🔴 `payload` 는 서버 jsonb 이고 그 안의 문자열은 남의 사이트에서 왔다 — `parseLinkPayload` 를
 * 통과한 값만 그린다. 통과하지 못하면 **아무것도 그리지 않는다**(깨진 카드보다 없는 편이 낫다).
 *
 */
export default function FireCard({ item }: { item: NewsListItem }) {
  const news = parseLinkPayload(item.payload);
  if (!news) return null;

  const author = item.author?.display_name ?? '';

  return (
    <CardRoot to={`/community/firenow/${item.id}`}>
      {news.image ? (
        <Thumb>
          {/* 장식이 아니라 원문의 대표 그림이지만, 제목이 바로 아래 있어 이름은 제목이 진다. */}
          <img src={news.image} alt="" loading="lazy" decoding="async" />
        </Thumb>
      ) : null}

      <Body>
        <Source>{linkHostLabel(news)}</Source>
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
        <FootLink>{copy.openDetail}</FootLink>
      </Foot>
    </CardRoot>
  );
}
