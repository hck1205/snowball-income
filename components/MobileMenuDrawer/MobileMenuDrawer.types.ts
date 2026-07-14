import type { ReactNode } from 'react';

export type MobileMenuDrawerProps = {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  left: ReactNode;
  right: ReactNode;
  /** 헤더 바로 아래, 본문 위에 놓이는 공지 슬롯. 이 컴포넌트가 헤더를 소유하고 있어 여기서만 그 자리를 만들 수 있다. */
  notice?: ReactNode;
};
