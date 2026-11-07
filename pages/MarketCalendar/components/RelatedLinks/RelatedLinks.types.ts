import type { ReactNode } from 'react';

export type RelatedLinkItem = {
  /** 앱 내부 경로. */
  to: string;
  /** 카드 제목 — 내비와 같은 이름(`COMMUNITY_COPY.nav`). */
  title: string;
  /** 이 페이지 맥락의 한 줄 설명. */
  description: string;
  /** 레일 캡 글리프. 색이 단독 채널이 되지 않게 묶음마다 다른 모양을 준다(PickCard 계약). */
  glyph: ReactNode;
};

export type RelatedLinksProps = {
  /** `nav` 랜드마크 이름. 섹션 제목과 같은 문구를 준다. */
  label: string;
  items: readonly RelatedLinkItem[];
  /** 카드를 누를 때 목적지 경로로 불린다(계측). 이동 자체는 막지 않는다. */
  onNavigate?: (to: string) => void;
};
