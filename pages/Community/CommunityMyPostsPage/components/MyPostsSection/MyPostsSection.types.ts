import type { MyPosts } from '../../hooks';

/**
 * 뷰가 보는 계약 — 데이터 훅(useMyPosts)의 결과 그대로다.
 * (컨테이너가 훅을 부르고, 뷰는 이 props만 보고 그린다.)
 */
export type MyPostsViewModel = MyPosts;

/**
 * 공개 범위 필터. **순수 표시 상태**라 데이터 훅이 아니라 뷰가 소유한다 —
 * 서버 재조회 없이 이미 받은 목록을 좁히기만 하기 때문이다(내 글은 한 화면 규모다).
 */
export type MyPostsVisibilityFilter = 'all' | 'public' | 'private';

export type MyPostsSectionViewProps = {
  viewModel: MyPostsViewModel;
};
