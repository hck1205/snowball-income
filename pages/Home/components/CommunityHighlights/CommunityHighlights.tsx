import { useEffect, useState } from 'react';
import { BarChart3, Heart, Lightbulb, MessageCircleQuestion, MessageSquare, PlayCircle } from 'lucide-react';
import { AiReporterBadge } from '@/components/community';
import { ICON } from '@/shared/styles';
import {
  Card,
  CardTitle,
  Excerpt,
  Grid,
  Meta,
  MetaStat,
  Section,
  SectionHead,
  SectionMore,
  SectionTitle,
  SlotLabel,
  Stat,
  Thumb
} from './CommunityHighlights.styled';
import type { CommunityHighlightsProps, HighlightCard, HighlightSlotId } from './CommunityHighlights.types';
import { HIGHLIGHT_SLOTS, fetchHighlightRows, pickHighlights } from './CommunityHighlights.utils';

const SLOT_ICON: Record<HighlightSlotId, typeof BarChart3> = {
  portfolio: BarChart3,
  insight: Lightbulb,
  question: MessageCircleQuestion,
  video: PlayCircle
};

/**
 * 첫 화면 커뮤니티 칸(2026-11-11 사용자 요청) — 포트폴리오 · 인사이트 리포트 · 질문&고민 · 유튜브 영상을
 * 하나씩. 목표 고르기 아래에 서서 "여기 사람들이 실제로 무엇을 나누는지"를 보여 준다.
 *
 * - 데이터는 화면이 뜬 뒤 REST 한 번으로 받는다(SDK 없음). 받기 전·실패·커뮤니티 비활성이면 **아무것도
 *   그리지 않는다** — 자리 표시자를 두지 않는 이유는 이 칸이 접힘 아래라 늦게 나타나도 흔들림이 없어서다.
 * - 고르는 규칙은 `pickHighlights`(최근 글 중 반응 1위).
 */
export default function CommunityHighlights({ onSelect }: CommunityHighlightsProps) {
  const [cards, setCards] = useState<HighlightCard[]>([]);

  useEffect(() => {
    let alive = true;
    void fetchHighlightRows().then((rows) => {
      if (alive) setCards(pickHighlights(rows));
    });
    return () => {
      alive = false;
    };
  }, []);

  if (cards.length === 0) return null;

  return (
    <Section aria-labelledby="home-community-title">
      <SectionHead>
        <SectionTitle id="home-community-title">커뮤니티에서는 지금</SectionTitle>
        <SectionMore to="/community/board">전체 보기</SectionMore>
      </SectionHead>
      <Grid>
        {cards.map((card) => {
          const Icon = SLOT_ICON[card.slot];
          const label = HIGHLIGHT_SLOTS.find((slot) => slot.id === card.slot)?.label ?? '';
          return (
            <Card
              key={card.slot}
              to={card.href}
              slot={card.slot}
              empty={card.empty}
              data-home-community={card.slot}
              onClick={() => onSelect?.(card.slot)}
            >
              <SlotLabel slot={card.slot}>
                <Icon size={ICON.sm} strokeWidth={2} aria-hidden focusable={false} />
                {label}
              </SlotLabel>
              {card.image ? (
                <Thumb>
                  <img src={card.image} alt="" loading="lazy" decoding="async" />
                </Thumb>
              ) : null}
              <CardTitle>{card.title}</CardTitle>
              {card.stat ? <Stat>{card.stat}</Stat> : null}
              {card.excerpt ? <Excerpt>{card.excerpt}</Excerpt> : null}
              {card.empty ? (
                <Meta>
                  <span>{card.slot === 'question' || card.slot === 'insight' ? '글쓰기 →' : '둘러보기 →'}</span>
                </Meta>
              ) : (
                <Meta>
                  <span>{card.authorName}</span>
                  <AiReporterBadge authorId={card.authorId} />
                  <MetaStat aria-label={`좋아요 ${card.likes}`}>
                    <Heart size={12} strokeWidth={ICON.stroke} aria-hidden focusable={false} />
                    {card.likes}
                  </MetaStat>
                  <MetaStat aria-label={`댓글 ${card.comments}`}>
                    <MessageSquare size={12} strokeWidth={ICON.stroke} aria-hidden focusable={false} />
                    {card.comments}
                  </MetaStat>
                </Meta>
              )}
            </Card>
          );
        })}
      </Grid>
    </Section>
  );
}
