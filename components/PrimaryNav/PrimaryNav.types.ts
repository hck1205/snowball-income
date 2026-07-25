export type PrimaryNavProps = {
  /**
   * 브랜드 워드마크를 감쌀 태그.
   * 시뮬레이터(메인) 헤더에선 'h1'로 랜드마크 제목을 겸한다(페이지당 1개). 커뮤니티 헤더 등은 'span'(기본).
   */
  brandAs?: 'h1' | 'span';
  /**
   * 라우트 링크를 함께 렌더할지. 헤더 2줄 개편(2026-07-25) 후 두 헤더 모두 링크를 아래 줄의
   * `PrimaryNavLinks` 로 옮겼다 — 윗줄에는 브랜드만 남기려면 false.
   */
  withLinks?: boolean;
};
