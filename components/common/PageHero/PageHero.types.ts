import type { ReactNode } from 'react';

/** `gradient` = 페이지 첫인상용 시그니처 배경. `plain` = 그라디언트가 이미 다른 곳에 있을 때. */
export type PageHeroTone = 'gradient' | 'plain';

export type PageHeroProps = {
  /** 장식 글리프(lucide 등). 배지 안에서 `aria-hidden` 처리되므로 의미를 싣지 마라. */
  icon?: ReactNode;
  title: string;
  /**
   * 제목의 헤딩 레벨. 기본 `'h2'` — 이 앱의 `h1` 은 헤더 워드마크가 갖는다.
   * 워드마크가 `h1` 이 아닌 페이지에서만 `'h1'` 을 준다.
   */
  titleAs?: 'h1' | 'h2';
  /** 한 문장 설명. 이 화면이 무엇을 해 주는지. */
  lede?: ReactNode;
  /** 계산의 근거(기준일·환율 등). 없으면 렌더하지 않는다 — "—" 만 남기지 마라. */
  meta?: ReactNode;
  /** 최대 2개(primary 1 + secondary 1)를 넘기지 않는다. */
  actions?: ReactNode;
  tone?: PageHeroTone;
};
