import type { ReactNode } from 'react';

export type CarouselProps = {
  /**
   * 궤도에 설 항목들. **각 항목은 `li` 로 렌더돼야 한다**(궤도가 `ul` 이다).
   * 🔴 항목 하나의 폭은 궤도가 정한다(1 → 2 → 3칸) — 자식이 자기 폭을 정하면 스냅이 어긋난다.
   */
  children: ReactNode;
  /** 이 캐러셀이 무엇의 목록인지. 스크린리더가 읽는 이름이라 생략하지 마라. */
  ariaLabel: string;
  /**
   * 자동 넘김 간격(초). `0`(기본)이면 넘기지 않는다.
   *
   * 🔴 기본이 꺼짐인 것은 의도다. 자동으로 움직이는 화면은 **읽는 속도를 사용자에게서 뺏는다** —
   * 켜는 쪽이 "여기서는 그래도 괜찮다"를 증명해야 한다. 켜더라도 hover·포커스·터치에 멈춘다.
   * ⚠ 움직임 축소 설정에서는 값과 무관하게 넘기지 않는다.
   */
  autoAdvanceSeconds?: number;
  className?: string;
};
