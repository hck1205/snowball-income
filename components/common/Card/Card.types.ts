import type { ReactNode } from 'react';

export type CardProps = {
  title?: string;
  titleRight?: ReactNode;
  titleRightInline?: boolean;
  children: ReactNode;
};
