import { useEffect, useRef, useState } from 'react';

/**
 * **화면에 들어오면 한 번 켜지는 스위치.** 등장 연출(페이드·슬라이드)의 방아쇠로 쓴다.
 *
 * ## 왜 훅인가
 * 등장 연출을 CSS 만으로 하면(마운트 시 animation) 접힘 아래 카드가 **보이기도 전에** 다 재생된다.
 * 스크롤해서 도착했을 때는 이미 끝나 있어 아무 일도 일어나지 않는다. 실제로 "들어올 때 나타나는"
 * 연출은 뷰포트 진입을 알아야 하고, 그 관찰을 이 훅이 맡는다.
 *
 * ## 규율
 * 🔴 **한 번만 켠다.** 스크롤을 오르내릴 때마다 다시 재생되면 화면이 안절부절못하고, 읽던 자리를
 *   잃는다. 켜진 뒤에는 관찰을 해제해 비용도 0 으로 만든다.
 * 🔴 **움직임을 줄이라는 설정을 존중한다**(`prefers-reduced-motion`). 그 경우 관찰 없이 처음부터
 *   켜진 상태로 시작한다 — 연출만 사라지고 **내용은 그대로 보인다**. 이 순서가 중요하다:
 *   "숨겨 두고 애니메이션으로 보여 주는" 구조에서 애니메이션만 끄면 화면이 영영 비어 있게 된다.
 * ⚠ `IntersectionObserver` 가 없는 환경(jsdom·구형 브라우저)에서도 **켜진 상태로 시작**한다.
 *   연출은 선택이지만 내용은 필수다.
 *
 * ```tsx
 * const { ref, shown } = useRevealOnScroll<HTMLLIElement>();
 * <Card ref={ref} $shown={shown} $delay={index * 60} />
 * ```
 */
/**
 * 관찰자가 끝내 발화하지 않아도 이만큼 지나면 켠다(ms). 아래 "안전망" 주석이 이유를 말한다.
 * 2.5초는 "스크롤해서 도착하는 사람은 그 전에 관찰자가 켠다"와 "실패해도 사용자가 빈 화면을
 * 오래 보지 않는다" 사이의 값이다.
 */
const REVEAL_FALLBACK_MS = 2_500;

export const useRevealOnScroll = <T extends HTMLElement>(): {
  ref: (node: T | null) => void;
  shown: boolean;
} => {
  const [shown, setShown] = useState(false);
  const nodeRef = useRef<T | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => () => cleanupRef.current?.(), []);

  const ref = (node: T | null) => {
    if (nodeRef.current === node) return;
    cleanupRef.current?.();
    cleanupRef.current = null;
    nodeRef.current = node;
    if (!node) return;

    const reduced =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduced || typeof IntersectionObserver === 'undefined') {
      setShown(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          setShown(true);
          observer.disconnect();
        }
      },
      /* 요소가 조금(12%) 들어왔을 때 켠다 — 0 이면 가장자리에 1px 걸친 순간 재생돼 헛돈다. */
      { threshold: 0.12 }
    );

    observer.observe(node);

    /**
     * 🔴 **안전망 — 이 타이머가 없으면 화면이 비어 있을 수 있다.**
     *
     * 이 훅이 켜지지 않으면 소비처는 `opacity: 0` 에 머문다. 즉 연출이 실패하는 순간 그것은
     * "연출이 없는 화면"이 아니라 **"내용이 없는 화면"** 이다. 관찰자가 발화하지 않는 경로는
     * 실제로 존재한다 — 컨테이너에 `content-visibility` 가 걸린 경우, 헤드리스 캡처처럼 스크롤이
     * 일어나지 않는 환경, 관찰 등록 전에 이미 지나가 버린 경우.
     * 그래서 일정 시간이 지나면 무조건 켠다. 스크롤해서 도착하는 사람은 그 전에 관찰자가 먼저
     * 켜므로 연출을 그대로 본다 — 잃는 것은 없고, 최악의 경우가 "연출 없이 보인다"로 바뀐다.
     */
    const fallback = window.setTimeout(() => setShown(true), REVEAL_FALLBACK_MS);

    cleanupRef.current = () => {
      observer.disconnect();
      window.clearTimeout(fallback);
    };
  };

  return { ref, shown };
};
