import type { MyPosts } from '../../hooks';

/**
 * 뷰가 보는 계약 — 데이터 훅(useMyPosts)의 결과 그대로다.
 * (컨테이너가 훅을 부르고, 뷰는 이 props만 보고 그린다.)
 */
export type MyPostsViewModel = MyPosts;

export type MyPostsSectionViewProps = {
  viewModel: MyPostsViewModel;
};
