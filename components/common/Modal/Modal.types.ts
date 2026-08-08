import type { MouseEventHandler, ReactNode } from 'react';
import type { OverlayPhase } from '@/shared/hooks';

export type ModalProps = {
  /**
   * 패널 폭. 기본 `md`(520px).
   *
   * 🔴 `lg`(720px)는 **칸이 많아 세로 스크롤이 생기는 폼**에만 쓴다 — 넓히면 두 칸씩 나란히 세워
   *    한 화면에 담을 수 있다. 문장 몇 줄짜리 모달에는 쓰지 마라(읽기가 나빠진다).
   */
  size?: 'md' | 'lg';
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
