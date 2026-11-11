/** 첫 화면 커뮤니티 칸 — 네 자리. 순서가 화면 순서다. */
export type HighlightSlotId = 'portfolio' | 'insight' | 'question' | 'video';

/** REST 로 받은 공개 글 한 줄(필요한 열만). */
export type HighlightRow = {
  readonly id: string;
  readonly kind: string;
  readonly category: string | null;
  readonly title: string;
  readonly description: string | null;
  readonly like_count: number | null;
  readonly comment_count: number | null;
  readonly created_at: string;
  readonly payload: unknown;
  readonly sim_summary: unknown;
  readonly user_id: string | null;
  readonly author: { readonly display_name: string | null } | null;
};

/** 화면이 그리는 카드 하나. */
export type HighlightCard = {
  readonly slot: HighlightSlotId;
  readonly id: string;
  readonly href: string;
  readonly title: string;
  readonly excerpt: string | null;
  readonly authorName: string;
  readonly authorId: string | null;
  readonly likes: number;
  readonly comments: number;
  /** 유튜브 썸네일(파이어족들 글만). */
  readonly image: string | null;
  /** 포트폴리오 글의 결과 한 줄(예: "20년 뒤 월 배당 152만원"). */
  readonly stat: string | null;
  /** 그 칸에 글이 아직 없다 — 글쓰기로 안내하는 카드다(제목·요약이 안내 문구). */
  readonly empty?: boolean;
};

export type CommunityHighlightsProps = {
  /** 카드 클릭 계측. 이동은 카드의 Link 가 한다. */
  readonly onSelect?: (slot: HighlightSlotId) => void;
};
