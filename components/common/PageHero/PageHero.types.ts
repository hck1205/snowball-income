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
  /**
   * 리드 아래 한 줄 고지(예: "달력의 날짜는 과거 이력에서 추정한 예상일"). `role="note"` 로 나간다.
   *
   * 경고·오류에는 쓰지 마라 — 그건 히어로 밖 `Banner` 의 자리다. 여기 들어오는 것은
   * "이 화면의 숫자를 어떻게 읽어야 하는가" 수준의 상시 안내뿐이다.
   */
  notice?: ReactNode;
  /** 계산의 근거(기준일·환율 등). 없으면 렌더하지 않는다 — "—" 만 남기지 마라. */
  meta?: ReactNode;
  /** 최대 2개(primary 1 + secondary 1)를 넘기지 않는다. */
  actions?: ReactNode;
  /**
   * 제목과 **같은 줄** 맨 오른쪽에 서는 작은 액션(아이콘 버튼 한 개 수준).
   *
   * `actions` 는 좁은 폭에서 제목 아래로 내려가 전폭을 쓰지만, 이 슬롯은 **어느 폭에서도 제목 줄에
   * 남는다.** 좁은 화면에서도 제목 옆자리를 지켜야 하는 보조 동작(예: 결과 이미지 저장)에 쓴다.
   * 여러 개를 넣지 마라 — 제목 줄이 잘린다.
   */
  titleAction?: ReactNode;
  tone?: PageHeroTone;
};
