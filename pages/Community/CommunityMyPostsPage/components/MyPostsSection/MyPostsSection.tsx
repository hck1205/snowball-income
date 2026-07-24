import { useMyPosts } from '../../hooks';
import MyPostsSectionView from './MyPostsSection.view';

/**
 * "내 글" 섹션 컨테이너 — 데이터 훅을 부르고 뷰에 넘긴다(컨테이너/뷰 분리).
 *
 * 페이지 viewModel 에 얹지 않고 **자기 데이터를 스스로 쥐는** 이유는 PrecisionSearch 와 같다:
 * 이 섹션의 로딩/실패는 인증 게이트와 아무 관계가 없어서, 한 viewModel 로 묶으면 서로 무관한
 * 상태가 한 계약에 섞인다. 페이지 뷰는 로그인 게이트 뒤에서 이 컴포넌트를 놓기만 한다.
 */
export default function MyPostsSection() {
  const myPosts = useMyPosts();
  return <MyPostsSectionView viewModel={myPosts} />;
}
