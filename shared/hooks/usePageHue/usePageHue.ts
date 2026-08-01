import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { applyPageHue, resolvePageHue } from './usePageHue.utils';

/**
 * 현재 라우트의 **페이지 정체성 hue**(`--sb-page-hue`)를 문서 루트에 발행한다.
 *
 * 🔴 **이 훅이 이 변수의 유일한 발행처다.** 페이지(예: `PageHero`)가 각자 발행하지 않는 이유:
 *   ① `/community/*` 에는 히어로가 아예 없다 — 히어로가 발행하면 커뮤니티는 영원히 배정을 못 받는다.
 *   ② 라우트 전환마다 히어로가 언마운트→마운트(lazy Suspense)된다. 그 사이 변수가 사라져
 *      **상단 내비 활성 알약이 매 이동마다 폴백색으로 한 번 깜빡인다.**
 *   ③ 발행처가 둘이면 히어로와 내비가 서로 다른 색을 말하는 순간이 생긴다.
 *
 * 그래서 **라우트를 아는 단 하나의 상시 마운트 지점**(`router/routes.tsx` 의 `RootLayout`)에서만
 * 부른다. 라우트→hue 매핑은 `usePageHue.utils.ts` 가 소유한다.
 *
 * 📝 `useLayoutEffect`(커밋 단계)로 충분하다 — 이 변수를 **렌더 단계에서 `getComputedStyle` 로
 * 읽는 소비처가 없다**(전부 CSS 가 읽는다). 팔레트 전환이 동기 DOM 쓰기를 요구했던 이유는
 * 차트 옵션 `useMemo` 가 렌더 중에 실제 값을 읽기 때문이고, 여기엔 그런 소비처가 없다.
 * 언마운트 정리를 하지 않는 것도 의도다 — 라우트 전환 사이에 변수가 잠깐 비면 그게 곧 깜빡임이다.
 */
export function usePageHue(): void {
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    applyPageHue(resolvePageHue(pathname));
  }, [pathname]);
}
