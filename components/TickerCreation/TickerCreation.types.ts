import type { ReactNode } from 'react';
import type { TickerProfile } from '@/shared/types/snowball';

export type TickerCreationProps = {
  topContent?: ReactNode;
  tickerProfiles: TickerProfile[];
  includedTickerIds: string[];
  onOpenCreate: () => void;
  onCreateShareLink: () => Promise<{ ok: true; url: string; copied: boolean } | { ok: false; message: string }>;
  onTickerClick: (profile: TickerProfile) => void;
  onTickerPressStart: (profile: TickerProfile) => void;
  onTickerPressEnd: () => void;
  onOpenEdit: (profile: TickerProfile) => void;
};
