/**
 * AI 리포터 파이프라인의 자료형(2026-11-10).
 *
 * 흐름: `facts`(저장소 데이터 → 숫자·표) → 루틴(LLM)이 `ReporterDraft`(제목·짧은 본문)만 쓴다 →
 * `rules`(검사) → `compose`(표와 합침) → `publish`(AI 리포터 계정으로 게시) → 기록 대장에 한 줄.
 *
 * 🔴 숫자는 LLM 이 만들지 않는다. 표는 `facts` 가 HTML 로 굽고, 본문에 쓸 수 있는 숫자는
 *   `ReporterFacts.numbers` 에 있는 것뿐이다(검사기가 대조한다).
 */

/** 다루는 주제. 게시판 주제는 순환하며 쓴다(같은 주제 연속 금지). */
export type ReporterTopic = 'week-ahead' | 'income-target' | 'ticker-spotlight' | 'gallery-portfolio' | 'fire-video';

/** 게시판(`/community/board`) 순환 주제. 갤러리 주제는 따로 정한 요일에만 명시적으로 쓴다(`--topic`). */
export const REPORTER_TOPICS: readonly ReporterTopic[] = ['week-ahead', 'income-target', 'ticker-spotlight'];

/**
 * 갤러리 글의 첨부 — 시뮬레이터 시나리오와 앱 엔진이 구운 결과 요약(2026-11-10).
 * 이것이 있으면 게시판 글이 아니라 **배당 계산 갤러리 글**(`kind='portfolio'`)로 올라간다.
 */
export type ReporterAttachment = {
  /** portfolio = 배당 계산 갤러리(시나리오 첨부) · fire = 파이어족들(영상 링크 카드, 2026-11-11). */
  readonly kind: 'portfolio' | 'fire';
  readonly payload: unknown;
  /** 갤러리 글만. 파이어족들 글에는 없다. */
  readonly simSummary?: unknown;
};

export type ReporterLink = { readonly href: string; readonly label: string };

/** 한 회차의 재료. 같은 `factKey` 는 두 번 발행되지 않는다(중복 방지의 기준). */
export type ReporterFacts = {
  readonly topic: ReporterTopic;
  /** 이 회차를 식별하는 키 — 예: `week-ahead:2026-11-16`, `ticker-spotlight:SCHD:2026-11-08`. */
  readonly factKey: string;
  /** 데이터 기준일(YYYY-MM-DD). 글 끝 출처 줄에 들어간다. */
  readonly asOf: string;
  /** 출처 문장(사람이 읽는 형태). */
  readonly sourceNote: string;
  /** 본문(LLM 작성분)에 써도 되는 숫자 표기들. 이 밖의 숫자가 본문에 있으면 검사기가 거부한다. */
  readonly numbers: readonly string[];
  /** LLM 이 글감으로 쓸 사실 문장(숫자 포함). 리드는 이 중 하나를 중심으로 쓴다. */
  readonly highlights: readonly string[];
  /**
   * 분석 단락의 근거 문장(2026-11-11) — 종목 소개 페이지 참고 정보·지표 정의·회사 이름 등 저장소에서
   * 검증된 것만. 이 문장의 숫자도 본문에 쓸 수 있다. 여기 없는 바깥 지식은 쓰지 않는다(`background.ts`).
   */
  readonly background: readonly string[];
  /** 본문에 그대로 붙는 표 HTML(`data-chart` 포함 가능). LLM 은 손대지 않는다. */
  readonly tablesHtml: string;
  /** 글 끝 "더 보기" 링크(사이트 안). */
  readonly links: readonly ReporterLink[];
  /** 게시판 분류. 갤러리 글은 null(분류가 없다 — DB 기본값). */
  readonly category: 'insight' | 'news' | null;
  /** 갤러리·파이어족들 글 첨부. 없으면 게시판 글. */
  readonly attachment?: ReporterAttachment;
  /**
   * 파이어족들 영상 스냅샷(RSS 에서 가져온 그대로). 발행 시점에 네트워크 없이 같은 글감을 다시 만드는 데 쓴다 —
   * 사실 준비 단계가 `next-facts.json` 에 이 값을 남기고, 발행 단계가 그것을 읽는다.
   */
  readonly video?: import('./youtube').YoutubeVideo;
};

/** 루틴(LLM)이 쓰는 초안. 표·출처·고지는 들어 있지 않다(조립이 붙인다). */
export type ReporterDraft = {
  readonly factKey: string;
  readonly title: string;
  /** 목록 카드 요약 한 줄. */
  readonly description: string;
  /** 리드 — 표 앞. `<p>` 2~3개. 허용 태그: p · strong · em · br. */
  readonly introHtml: string;
  /**
   * 분석 — 표 뒤(2026-11-11, 필수). 소제목(h3) 2~3개 아래 짧은 문단·목록으로 "왜 이런 숫자인가 · 같이 볼 것 ·
   * 다르게 보이는 경우"를 쓴다. 허용 태그: h3 · p · strong · em · br · ul · li.
   */
  readonly analysisHtml: string;
  /**
   * 이미 올린 글을 **고쳐 쓸 때만** — 그 글 id. 있으면 새 글을 만들지 않고 그 글의 제목·요약·본문을 바꾼다.
   * 대장에 같은 회차가 있어도 그 회차의 글이 바로 이 id 면 중복으로 보지 않는다.
   */
  readonly replacesPostId?: string;
};

/** 기록 대장 한 줄 — 발행된 회차. 중복 판정은 이 목록을 본다. */
export type ReporterLedgerEntry = {
  readonly factKey: string;
  readonly topic: ReporterTopic;
  readonly title: string;
  readonly publishedAt: string;
  readonly postId: string | null;
  /** 파이어족들 영상 글의 채널 id — 같은 채널이 연달아 나오지 않게 다음 회차가 본다. */
  readonly channelId?: string;
};

export type ReporterLedger = { readonly entries: readonly ReporterLedgerEntry[] };
