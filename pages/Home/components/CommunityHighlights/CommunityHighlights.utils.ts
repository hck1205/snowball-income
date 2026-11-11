import { readCommunityEnv } from '@/shared/lib/supabase';
import { parseScenarioSimSummary } from '@/shared/lib/snowball';
import { formatKoreanWon } from '@/shared/utils';
import type { HighlightCard, HighlightRow, HighlightSlotId } from './CommunityHighlights.types';

/** 칸마다 어떤 글을 고르는가, 어디로 가는가. 순서가 화면 순서다. */
export const HIGHLIGHT_SLOTS: readonly {
  readonly id: HighlightSlotId;
  readonly label: string;
  readonly match: (row: HighlightRow) => boolean;
  readonly href: (id: string) => string;
  readonly more: string;
  /** 글이 아직 없을 때 대신 서는 안내 카드. */
  readonly empty: {
    readonly title: string;
    readonly excerpt: string;
    readonly href: string;
  };
}[] = [
  {
    id: 'portfolio',
    label: '포트폴리오',
    match: (row) => row.kind === 'portfolio',
    href: (id) => `/community/portfolio/${id}`,
    more: '/community/portfolio',
    empty: {
      title: '내 배당 포트폴리오를 올려 보세요',
      excerpt: '시뮬레이션 결과를 그대로 공유할 수 있습니다.',
      href: '/community/portfolio'
    }
  },
  {
    id: 'insight',
    label: '인사이트 리포트',
    match: (row) => row.kind === 'board' && row.category === 'insight',
    href: (id) => `/community/board/${id}`,
    more: '/community/board',
    empty: {
      title: '배당 데이터로 본 이야기를 나눠 주세요',
      excerpt: '숫자와 근거가 있는 글이 여기 소개됩니다.',
      href: '/community/board/write'
    }
  },
  {
    id: 'question',
    label: '질문 & 고민',
    match: (row) => row.kind === 'board' && row.category === 'question',
    href: (id) => `/community/board/${id}`,
    more: '/community/board',
    empty: {
      title: '아직 올라온 질문이 없어요',
      excerpt: '배당·은퇴 준비에서 막히는 점을 첫 질문으로 남겨 보세요. 글쓰기에서 분류를 "질문"으로 고르면 됩니다.',
      href: '/community/board/write'
    }
  },
  {
    id: 'video',
    label: '유튜브 영상',
    match: (row) => row.kind === 'fire',
    href: (id) => `/community/firenow/${id}`,
    more: '/community/firenow',
    empty: {
      title: '파이어족들의 이야기를 영상으로',
      excerpt: '조기 은퇴·배당 생활 인터뷰를 모아 둡니다.',
      href: '/community/firenow'
    }
  }
];

/** 한 번에 받아 올 최근 공개 글 수. 네 칸을 모두 채울 만큼이면서 첫 화면에 부담 없는 크기. */
export const HIGHLIGHT_FETCH_LIMIT = 120;

const engagement = (row: HighlightRow): number => (row.like_count ?? 0) + (row.comment_count ?? 0);

const imageOf = (payload: unknown): string | null => {
  if (!payload || typeof payload !== 'object') return null;
  const image = (payload as { image?: unknown }).image;
  return typeof image === 'string' && /^https:\/\//.test(image) ? image : null;
};

const statOf = (row: HighlightRow): string | null => {
  const summary = parseScenarioSimSummary(row.sim_summary);
  if (!summary || summary.finalMonthlyDividend <= 0) return null;
  return `${summary.durationYears}년 뒤 월 배당 ${formatKoreanWon(summary.finalMonthlyDividend)}`;
};

const excerptOf = (row: HighlightRow): string | null => {
  const text = (row.description ?? '').replace(/\s+/g, ' ').trim();
  return text.length > 0 ? text : null;
};

/**
 * 칸마다 대표 글 하나 — **최근 글 중 반응(좋아요+댓글)이 가장 많은 것**, 같으면 최신. 순수 함수.
 * 전체 기간 1위를 고르면 같은 글이 영영 자리를 차지하므로, 받아 온 최근 글 안에서만 고른다.
 * 그 칸에 글이 없으면 **안내 카드**(글쓰기·목록으로)가 대신 선다 — 네 칸이 늘 같은 자리에 있게.
 * 다만 받아 온 글이 하나도 없으면(실패·비활성) 빈 배열 — 안내 카드만 네 장 세우지 않는다.
 */
export const pickHighlights = (rows: readonly HighlightRow[]): HighlightCard[] => {
  if (rows.length === 0) return [];
  return HIGHLIGHT_SLOTS.map((slot) => {
    const candidates = rows.filter(slot.match);
    if (candidates.length === 0) {
      return {
        slot: slot.id,
        id: `empty-${slot.id}`,
        href: slot.empty.href,
        title: slot.empty.title,
        excerpt: slot.empty.excerpt,
        authorName: '',
        authorId: null,
        likes: 0,
        comments: 0,
        image: null,
        stat: null,
        empty: true
      };
    }
    const best = [...candidates].sort((a, b) => engagement(b) - engagement(a) || b.created_at.localeCompare(a.created_at))[0]!;
    return {
      slot: slot.id,
      id: best.id,
      href: slot.href(best.id),
      title: best.title,
      excerpt: excerptOf(best),
      authorName: best.author?.display_name ?? '',
      authorId: best.user_id,
      likes: best.like_count ?? 0,
      comments: best.comment_count ?? 0,
      image: slot.id === 'video' ? imageOf(best.payload) : null,
      stat: slot.id === 'portfolio' ? statOf(best) : null
    };
  });
};

/**
 * 공개 글을 **SDK 없이** REST 로 한 번 받아 온다. 🔴 첫 화면 번들에 supabase-js 를 싣지 않기 위해서다
 * (`shared/lib/supabase/client.ts` 가 SDK 를 동적 import 로 격리한 이유와 같다).
 * 커뮤니티가 꺼져 있거나 실패하면 빈 배열 — 첫 화면은 이 칸 없이도 온전해야 한다.
 */
export const fetchHighlightRows = async (
  env: Record<string, unknown> = import.meta.env as unknown as Record<string, unknown>,
  fetchImpl: typeof fetch = fetch
): Promise<HighlightRow[]> => {
  const config = readCommunityEnv(env);
  if (!config) return [];
  const params = new URLSearchParams({
    select:
      'id,kind,category,title,description,like_count,comment_count,created_at,payload,sim_summary,user_id,author:profiles(display_name)',
    is_public: 'eq.true',
    kind: 'in.(portfolio,board,fire)',
    order: 'created_at.desc',
    limit: String(HIGHLIGHT_FETCH_LIMIT)
  });
  try {
    const response = await fetchImpl(`${config.url.replace(/\/+$/, '')}/rest/v1/posts?${params.toString()}`, {
      headers: {
        apikey: config.anonKey,
        authorization: `Bearer ${config.anonKey}`
      }
    });
    if (!response.ok) return [];
    const rows = (await response.json()) as unknown;
    return Array.isArray(rows) ? (rows as HighlightRow[]) : [];
  } catch {
    return [];
  }
};
