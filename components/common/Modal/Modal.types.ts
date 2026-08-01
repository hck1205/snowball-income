import type { MouseEventHandler, ReactNode } from 'react';
import type { OverlayPhase } from '@/shared/hooks';

export type ModalProps = {
  title: string;
  children: ReactNode;
  /** 하단 액션 영역(버튼들). */
  actions?: ReactNode;
  /** 배경 클릭. 호출부가 "패널 내부 클릭은 무시" 판정을 갖고 있어서 그대로 위임한다. */
  onBackdropClick?: MouseEventHandler<HTMLDivElement>;
  /**
   * 진입/퇴장 단계. **주지 않으면 진입만** 한다(기존 호출부 무영향).
   * `'exit'` 을 주려면 호출부가 `useOverlayPresence` 로 트리를 `MODAL_EXIT_MS` 동안 붙잡아야 한다 —
   * 그러지 않으면 이 값이 그려지기 전에 언마운트된다.
   */
  phase?: OverlayPhase;
};
