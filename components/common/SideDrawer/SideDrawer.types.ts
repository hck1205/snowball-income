import type { ReactNode } from 'react';
import type { BreakpointKey } from '@/shared/styles';

export type SideDrawerSide = 'left' | 'right';

export type SideDrawerProps = {
  /** 여는 버튼의 `aria-controls` 와 짝을 맺는 id (공통 조상에서 `useId` 로 만들어 양쪽에 내린다). */
  id: string;
  /** 패널이 붙는 화면 가장자리. 기본 `'left'`. */
  side?: SideDrawerSide;
  isOpen: boolean;
  /** 시각 제목(`h2`) 겸 `aria-labelledby` 대상. */
  title: string;
  /** 닫기 버튼의 `aria-label`. */
  closeLabel: string;
  onClose: () => void;
  /** 패널 폭. 기본 `'min(92vw, 400px)'`. */
  width?: string;
  /**
   * 이 브레이크포인트 **이하**에서만 백드롭을 딤하고 body 스크롤을 잠근다. 기본 `'drawer'`(≤960).
   * 그보다 넓은 폭에서는 **투명 스크림**(클릭=닫기)만 남아, 설정을 만지면서 결과를 계속 읽고
   * 스크롤할 수 있다 — "조정 ↔ 확인" 루프를 끊지 않는 것이 이 prop 의 존재 이유다.
   */
  dimBelow?: BreakpointKey;
  children: ReactNode;
};
