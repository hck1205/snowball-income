export type PostMetaProps = {
  viewCount: number;
  likeCount: number;
  commentCount: number;
  /** true면 조회수를 숨긴다(밀도 높은 inline 뷰의 모바일 축약용). */
  hideViews?: boolean;
};
