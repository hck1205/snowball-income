import { useEffect, useRef, useState } from 'react';
import { prefersReducedMotion } from '../TickerDetailPage.utils';

/**
 * 요소가 뷰포트에 처음 진입하면 `true` 를 반환한다(섹션 등장 애니메이션용). 한 번 보이면 계속 true.
 *
 * `prefers-reduced-motion` 이면 관찰을 아예 시작하지 않고 처음부터 true 를 반환한다 — 모션을 끈
 * 사용자에게는 콘텐츠가 즉시 보여야 한다(opacity:0 에 갇히지 않게). IntersectionObserver 가 없는
 * 환경(테스트 스텁 등)에서도 안전하게 true 로 폴백한다.
 */
export const useInView = <T extends HTMLElement>(): [React.RefObject<T>, boolean] => {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState<boolean>(() => prefersReducedMotion());

  useEffect(() => {
    if (inView) return;
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true);
            observer.disconnect();
            return;
          }
        }
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.05 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [inView]);

  return [ref, inView];
};
