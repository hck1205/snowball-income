import { useEffect, useRef, useState } from 'react';

/**
 * 숫자가 바뀔 때 새 값으로 **흘러가게** 보여 준다(ETF 겹침의 중복률 — 담을 때마다 값이 움직이는 느낌).
 *
 * 🔴 `prefers-reduced-motion` 이면 즉시 새 값이다. 🔴 스크린리더에는 이 값이 아니라 최종 값을 읽힌다
 *    (호출부가 `aria-hidden` 으로 이 숫자를 감추고 최종 값을 따로 둔다) — 중간값을 낭독하면 소음이다.
 */
export const useTweenedNumber = (target: number, durationMs = 600): number => {
  const [shown, setShown] = useState(target);
  const shownRef = useRef(target);

  useEffect(() => {
    const reduce =
      typeof window === 'undefined' ||
      typeof window.requestAnimationFrame !== 'function' ||
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const from = shownRef.current;
    if (reduce || from === target) {
      shownRef.current = target;
      setShown(target);
      return;
    }

    let frame = 0;
    const start = performance.now();
    const step = (now: number) => {
      const progress = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = from + (target - from) * eased;
      shownRef.current = value;
      setShown(value);
      if (progress < 1) frame = window.requestAnimationFrame(step);
    };
    frame = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(frame);
  }, [target, durationMs]);

  return shown;
};
