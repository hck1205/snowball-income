import type { GuideContent } from '@/shared/constants/guides';

/** 목차 한 줄. */
export type GuideTocItem = {
  readonly id: string;
  readonly label: string;
  /**
   * 본문 장이면 '01' 같은 두 자리 번호, 부록(FAQ·마무리)이면 `undefined`.
   * 🔴 번호가 있고 없음이 곧 "본문인가 부록인가"다 — 별도 kind 를 두지 않는다.
   */
  readonly index?: string;
};

/** 다른 가이드로 가는 링크 한 장. */
export type GuideLink = {
  readonly slug: string;
  readonly title: string;
  readonly lede: string;
  /** 시작 경로에서 몇 번째 걸음인가(1-based). 경로 밖의 가이드면 `undefined`. */
  readonly step?: number;
};

/** 시작 경로에서 이 글의 자리 — "5걸음 중 2번째". 경로 밖이면 `null`. */
export type GuideStep = {
  readonly current: number;
  readonly total: number;
};

export type GuideViewModel = {
  readonly guide: GuideContent;
  readonly toc: readonly GuideTocItem[];
  readonly step: GuideStep | null;
  /** 읽는 데 걸리는 대략의 분. 1 미만은 1 로 올린다. */
  readonly readingMinutes: number;
  /** 시작 경로의 **바로 다음** 글. 마지막 걸음이거나 경로 밖이면 `null`. */
  readonly next: GuideLink | null;
  /** 다음 글을 뺀 나머지 가이드들. */
  readonly others: readonly GuideLink[];
  /**
   * 표의 열별 정렬 판정. `tableAlignments[섹션 id][열 번호] === true` 면 수치 열이다.
   * 🔴 화면이 매 렌더 다시 재지 않도록 뷰모델이 한 번에 계산한다.
   */
  readonly numericColumns: Readonly<Record<string, readonly boolean[]>>;
};

export type GuideViewProps = {
  readonly viewModel: GuideViewModel;
};
