import type { ReactNode } from 'react';

export type MobileMenuDrawerProps = {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  left: ReactNode;
  right: ReactNode;
};
