import type { ReactNode } from 'react';

export type MobileMenuDrawerProps = {
  /**
   * 드로어 패널의 DOM id. **여는 버튼이 이 컴포넌트 밖(`SimulatorHeader`)에 살기 때문에**
   * id를 여기서 만들지 않고 두 곳의 공통 조상(`Main.view`)에서 받아 `aria-controls`와 짝을 맞춘다.
   */
  drawerId: string;
  isOpen: boolean;
  onClose: () => void;
  left: ReactNode;
  right: ReactNode;
  /** 페이지 설명 아래, 본문 위에 놓이는 공지 슬롯. */
  notice?: ReactNode;
};
