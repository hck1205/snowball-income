import { useEffect, useRef, useState } from 'react';

/**
 * 그래프 자리의 **실제 폭**(px)을 잰다. 0 이면 아직 못 쟀다는 뜻이다.
 *
 * 🔴 왜 재야 하나 — ECharts 의 `axisLabel.distance` 는 **퍼센트를 받지 않는다.** 반지름은
 *    `radius: '90%'` 로 폭에 따라 줄어드는데 라벨 거리만 픽셀로 고정되면, 폭이 좁아질수록 라벨이
 *    (상대적으로) 링에서 더 멀어져 다이얼 안쪽으로 파고든다. 그래서 폭을 알아야 거리를 같은
 *    비율로 좁힐 수 있다.
 * ⚠ `ResponsiveEChart` 도 자기 컨테이너를 재지만, 그건 캔버스 크기를 맞추는 용도라 **옵션을 만드는
 *   쪽**(이 카드)에는 오지 않는다. 옵션의 수치를 폭에 맞추는 것은 옵션을 만드는 쪽의 일이다.
 */
export const useElementWidth = <T extends HTMLElement>() => {
  const ref = useRef<T | null>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;

    const measure = () => setWidth(Math.floor(element.getBoundingClientRect().width));
    measure();

    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(measure);
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  return [ref, width] as const;
};
