/**
 * AI 리포터 파이프라인의 자료형(2026-11-10).
 *
 * 흐름: `facts`(저장소 데이터 → 숫자·표) → 루틴(LLM)이 `ReporterDraft`(제목·짧은 본문)만 쓴다 →
 * `rules`(검사) → `compose`(표와 합침) → `publish`(AI 리포터 계정으로 게시) → 기록 대장에 한 줄.
 *
 * 🔴 숫자는 LLM 이 만들지 않는다. 표는 `facts` 가 HTML 로 굽고, 본문에 쓸 수 있는 숫자는
 *   `ReporterFacts.numbers` 에 있는 것뿐이다(검사기가 대조한다).
 */

/** 다루는 주제. 순환하며 쓴다(같은 주제 연속 금지). */
export type ReporterTopic = 'week-ahead' | 'income-target' | 'ticker-spotlight';

export const REPORTER_TOPICS: readonly ReporterTopic[] = ['week-ahead', 'income-target', 'ticker-spotlight'];

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
  /** LLM 이 글감으로 쓸 사실 문장(숫자 포함). 본문은 이 중 하나를 중심으로 짧게 쓴다. */
  readonly highlights: readonly string[];
  /** 본문에 그대로 붙는 표 HTML(`data-chart` 포함 가능). LLM 은 손대지 않는다. */
  readonly tablesHtml: string;
  /** 글 끝 "더 보기" 링크(사이트 안). */
  readonly links: readonly ReporterLink[];
  /** 게시판 분류. */
  readonly category: 'insight' | 'news';
};

/** 루틴(LLM)이 쓰는 초안. 표·출처·고지는 들어 있지 않다(조립이 붙인다). */
export type ReporterDraft = {
  readonly factKey: string;
  readonly title: string;
  /** 목록 카드 요약 한 줄. */
  readonly description: string;
  /** 본문 앞부분. `<p>` 2~4개 정도. 허용 태그: p · strong · em · br. */
  readonly introHtml: string;
};

/** 기록 대장 한 줄 — 발행된 회차. 중복 판정은 이 목록을 본다. */
export type ReporterLedgerEntry = {
  readonly factKey: string;
  readonly topic: ReporterTopic;
  readonly title: string;
  readonly publishedAt: string;
  readonly postId: string | null;
};

export type ReporterLedger = { readonly entries: readonly ReporterLedgerEntry[] };
