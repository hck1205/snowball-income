import type { ReactNode } from 'react';

export type CardProps = {
  title?: string;
  titleRight?: ReactNode;
  children: ReactNode;
};
