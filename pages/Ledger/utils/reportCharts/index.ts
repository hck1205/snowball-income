/**
 * **한눈에 보기**의 차트 옵션 — 순수 함수만. 컴포넌트는 이걸 그리기만 한다.
 *
 * ## 왜 컴포넌트 폴더 밖인가 (2026-08-09 리팩터)
 *
 * 한 파일이 950 줄을 넘었는데, 컴포넌트 폴더는 구조 가드가 파일 접미사를 잠그고 있어
 * (`X.tsx`/`X.styled.ts`/`X.types.ts`/`X.utils.ts`/…) 그 안에서는 쪼갤 수가 없다.
 * 옵션 빌더는 **DOM 을 모르는 순수 함수**라 `utils` 로 나오는 것이 제자리이기도 하다.
 */
export * from './chartShared';
export * from './chartFlow';
export * from './chartComposition';
export * from './chartHoldings';
