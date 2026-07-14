import type { MouseEventHandler, ReactNode } from 'react';

export type ModalProps = {
  title: string;
  children: ReactNode;
  /** 하단 액션 영역(버튼들). */
  actions?: ReactNode;
  /** 배경 클릭. 호출부가 "패널 내부 클릭은 무시" 판정을 갖고 있어서 그대로 위임한다. */
  onBackdropClick?: MouseEventHandler<HTMLDivElement>;
};
