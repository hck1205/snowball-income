import type { TickerProfile } from '@/shared/types/snowball';

export type TickerCreationProps = {
  tickerProfiles: TickerProfile[];
  includedTickerIds: string[];
  onOpenCreate: () => void;
  onSaveNamedState: (name: string) => Promise<{ ok: true; savedName: string }>;
  onListSavedStateNames: () => Promise<Array<{ name: string; updatedAt: number }>>;
  onLoadNamedState: (name: string) => Promise<{ ok: true } | { ok: false; message: string }>;
  onDeleteNamedState: (name: string) => Promise<{ ok: true } | { ok: false; message: string }>;
  onDownloadNamedStateAsJson: (name: string) => Promise<{ ok: true } | { ok: false; message: string }>;
  onLoadStateFromJsonText: (jsonText: string) => Promise<{ ok: true } | { ok: false; message: string }>;
  onTickerClick: (profile: TickerProfile) => void;
  onTickerPressStart: (profile: TickerProfile) => void;
  onTickerPressEnd: () => void;
  onOpenEdit: (profile: TickerProfile) => void;
};
