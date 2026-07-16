/**
 * 커뮤니티 페이지 그룹.
 *
 * ⚠ 여기서 페이지 컴포넌트를 정적으로 재export하지 않는다. 라우터(`router/routes.tsx`)가 각 페이지
 *   폴더를 `React.lazy(() => import('@/pages/Community/<Page>'))`로 개별 청크 로드해야 하기 때문이다.
 *   이 배럴이 페이지들을 정적으로 묶으면 코드 스플리팅이 하나로 합쳐진다.
 */
export {};
