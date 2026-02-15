import type { MouseEvent } from 'react';

export type HelpModalProps = {
  onBackdropClick: (event: MouseEvent<HTMLDivElement>) => void;
  onClose: () => void;
};
