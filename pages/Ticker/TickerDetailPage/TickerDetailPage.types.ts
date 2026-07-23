import type { TickerAccentTheme, TickerContent } from '@/shared/constants/tickers';

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

/** 관련 티커 내부 링크(한글명 조인 포함). `hasContent`면 상세 페이지로 링크, 아니면 비링크 텍스트. */
export type ResolvedRelatedTicker = {
  ticker: string;
  slug: string;
  koreanName: string;
  relationLabel: string;
  /** SEO 콘텐츠 페이지가 존재하는가 — 없으면 데드엔드 링크 대신 텍스트로 렌더(서버 렌더러와 일치). */
  hasContent: boolean;
};

/** reference 팩트에서 실제 값이 있는 항목만 뽑아 표시용으로 포맷한 한 줄. */
export type ReferenceFactLine = {
  label: string;
  value: string;
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
  /** 히어로에 큰 숫자로 내세우는 핵심 지표(배당률/성장률/기대수익/주기). */
  heroStats: ResolvedStat[];
  sections: ResolvedSection[];
  /** 좌측 목차 항목 = 섹션에서 파생. */
  toc: { id: string; navLabel: string }[];
  faqs: ResolvedFaq[];
  referenceFacts: ReferenceFactLine[];
  referenceSectors?: string[];
  referenceAsOfNote: string;
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
