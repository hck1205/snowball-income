import { useEffect, useState } from 'react';

/**
 * 스크롤 위치에 따라 현재 보이는 섹션 id 를 반환한다(목차 활성 하이라이트용).
 *
 * IntersectionObserver 로 각 섹션의 교차를 추적하고, 교차 중인 것들 중 뷰포트 상단에 가장 가까운
 * 섹션을 active 로 삼는다. rootMargin 상단 -45%/하단 -50% 로, 섹션이 화면 상단 근처에 올 때
 * 활성화되게 해 "읽고 있는 위치"와 목차가 어긋나지 않게 한다. 관찰 대상이 없으면 첫 섹션을 반환.
 */
export const useScrollSpy = (ids: string[]): string => {
  const [activeId, setActiveId] = useState<string>(ids[0] ?? '');

  useEffect(() => {
    if (ids.length === 0) return;
    if (typeof IntersectionObserver === 'undefined') return;

    const visible = new Map<string, number>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = entry.target.id;
          if (entry.isIntersecting) visible.set(id, entry.boundingClientRect.top);
          else visible.delete(id);
        }

        if (visible.size === 0) return;

        // 교차 중인 섹션 중 화면 상단에 가장 가까운(top 이 가장 작은) 것을 active 로.
        let topId = '';
        let topValue = Number.POSITIVE_INFINITY;
        for (const [id, top] of visible) {
          if (top < topValue) {
            topValue = top;
            topId = id;
          }
        }
        if (topId) setActiveId(topId);
      },
      { rootMargin: '-45% 0px -50% 0px', threshold: 0 }
    );

    const observed = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    observed.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [ids]);

  return activeId;
};
