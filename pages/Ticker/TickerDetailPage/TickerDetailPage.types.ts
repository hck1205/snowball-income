import type { TickerAccentTheme, TickerCategoryId, TickerContent } from '@/shared/constants/tickers';

/** 토큰이 치환된 숫자 하이라이트. */
export type ResolvedStat = {
  label: string;
  value: string;
  caption?: string;
};

/** 토큰이 치환된 콘텐츠 섹션. */
export type ResolvedSection = {
  id: string;
  navLabel: string;
  heading: string;
  paragraphs: string[];
  bullets?: string[];
  stat?: ResolvedStat;
};

export type ResolvedFaq = {
  question: string;
  answer: string;
};

/**
 * 관련 티커 내부 링크(한글명 조인 포함). `hasContent`면 상세 페이지로 링크, 아니면 비링크 텍스트.
 *
 * `accent`/`seriesVar`/`categoryId` 는 **허브 카드와 색·글리프를 잇기 위해** 조인한 값이다 —
 * 같은 티커가 허브 격자와 이 카드에서 같은 색·같은 모양으로 읽힌다. 콘텐츠가 없는 티커는
 * 액센트도 카테고리도 없으므로 `seriesVar`(집합 안에서 겹치지 않는 시리즈 색)로 떨어진다.
 */
export type ResolvedRelatedTicker = {
  ticker: string;
  slug: string;
  koreanName: string;
  relationLabel: string;
  /** SEO 콘텐츠 페이지가 존재하는가 — 없으면 데드엔드 링크 대신 텍스트로 렌더(서버 렌더러와 일치). */
  hasContent: boolean;
  accent?: TickerAccentTheme;
  /** `assignSeries` 가 이 관련 티커 집합 안에서 배정한 색 변수(액센트 미지정 티커의 폴백). */
  seriesVar: string;
  categoryId?: TickerCategoryId;
};

/** reference 팩트에서 실제 값이 있는 항목만 뽑아 표시용으로 포맷한 한 줄. */
export type ReferenceFactLine = {
  label: string;
  value: string;
};

/** 상위 보유 종목 한 줄 — 순위·비중 막대 폭까지 뷰가 계산하지 않도록 여기서 파생한다. */
export type ResolvedHolding = {
  rank: number;
  symbol: string;
  name: string;
  weightDisplay: string;
  /** 가장 큰 비중을 100 으로 정규화한 막대 폭(%). 절대 비중이 아니라 **상대 길이**다. */
  barPercent: number;
};

/**
 * 상위 보유 종목 묶음(선택). 🔴 합계는 100%가 아니다 — `coveredWeightDisplay` 가 그 사실을
 * 숫자로 직접 말한다(서버 렌더러의 tfoot 합계 행과 같은 취지).
 */
export type ResolvedTopHoldings = {
  holdings: ResolvedHolding[];
  count: number;
  coveredWeightDisplay: string;
  asOfDate: string;
  sourceLabel: string;
  sourceUrl: string;
  excludedNote?: string;
};

/** 이 화면에서 티커가 속한 카테고리(허브 섹션과 같은 라벨). */
export type ResolvedCategory = {
  id: TickerCategoryId;
  label: string;
};

/**
 * 목차 한 줄.
 *
 * 🔴 목차는 이제 **본문 장(chapter)만이 아니라 페이지 전체**를 센다 — 참고 지표·보유 종목·FAQ·
 * 관련 티커까지. 종전 목차는 문서의 앞 60%만 가리켜 뒤쪽으로 내려가면 활성 표시가 멈춰 있었다.
 * `kind` 가 둘을 가른다: 장은 번호를 달고, 부록은 번호 대신 점을 단다.
 */
export type TocEntry = {
  id: string;
  navLabel: string;
  kind: 'chapter' | 'appendix';
  /** 장 번호(`01`…). 부록이면 `undefined`. */
  index?: string;
};

/**
 * 상세 페이지 뷰가 소비하는 완성형 모델. 컨테이너가 `resolveTickerEngineFacts` +
 * `renderTickerContentTemplate` 로 조립해 넘긴다 — 뷰는 어떤 토큰 치환도, 어떤 엔진 조인도 하지 않는다.
 */
export type TickerDetailViewModel = {
  ticker: string;
  slug: string;
  koreanName: string;
  englishName: string;
  heroTagline: string;
  categories: ResolvedCategory[];
  /**
   * 히어로 지표. **`[0]` 이 주역**이고(히어로 숫자 하나), 나머지는 그 아래 보조 줄로 눕는다 —
   * 넷을 같은 크기 카드로 늘어놓으면 이 화면에서 가장 먼저 읽혀야 할 숫자가 무엇인지 사라진다.
   */
  heroStats: ResolvedStat[];
  sections: ResolvedSection[];
  /** 좌측 리더 레일 항목 = 섹션 + 실제로 렌더되는 부록에서 파생. */
  toc: TocEntry[];
  faqs: ResolvedFaq[];
  referenceFacts: ReferenceFactLine[];
  referenceSectors?: string[];
  referenceAsOfNote: string;
  topHoldings?: ResolvedTopHoldings;
  relatedTickers: ResolvedRelatedTicker[];
  /** 티커별 액센트 테마(선택) — 상세 페이지 장식 CSS 변수로 주입. 미지정이면 앱 기본 팔레트. */
  accent?: TickerAccentTheme;
  disclaimer: string;
  contentUpdatedAt: string;
  metaTitle: string;
  metaDescription: string;
};

export type TickerDetailViewProps = {
  viewModel: TickerDetailViewModel;
};

export type BuildViewModelInput = TickerContent;
