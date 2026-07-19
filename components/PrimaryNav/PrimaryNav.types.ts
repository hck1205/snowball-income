export type PrimaryNavProps = {
  /**
   * 브랜드 워드마크를 감쌀 태그.
   * 시뮬레이터(메인) 헤더에선 'h1'로 랜드마크 제목을 겸한다(페이지당 1개). 커뮤니티 헤더 등은 'span'(기본).
   */
  brandAs?: 'h1' | 'span';
};
