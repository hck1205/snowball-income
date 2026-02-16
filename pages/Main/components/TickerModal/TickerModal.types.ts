import type { MouseEvent } from 'react';
import type { PresetTickerKey } from '@/shared/constants';
import type { TickerDraft } from '@/shared/types/snowball';

export type TickerModalProps = {
  onBackdropClick: (event: MouseEvent<HTMLDivElement>) => void;
  onDelete: () => void;
  onClose: () => void;
  onSave: () => void;
  onHelpExpectedTotalReturn: () => void;
};

export type TickerModalViewProps = TickerModalProps & {
  isOpen: boolean;
  mode: 'create' | 'edit';
  selectedPreset: 'custom' | PresetTickerKey;
  presetTickers: Record<PresetTickerKey, TickerDraft>;
  tickerDraft: TickerDraft;
  onSelectPreset: (preset: 'custom' | PresetTickerKey) => void;
  onChangeDraft: (updater: (prev: TickerDraft) => TickerDraft) => void;
};
