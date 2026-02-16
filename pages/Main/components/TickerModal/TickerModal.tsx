import { useCallback, useEffect } from 'react';
import { PRESET_TICKERS } from '@/shared/constants';
import {
  useIsTickerModalOpenAtomValue,
  useSelectedPresetAtomValue,
  useSetSelectedPresetWrite,
  useSetTickerDraftWrite,
  useTickerDraftAtomValue,
  useTickerModalModeAtomValue
} from '@/jotai';
import TickerModalView from './TickerModal.view';
import type { TickerModalProps } from './TickerModal.types';

export default function TickerModal(props: TickerModalProps) {
  const isOpen = useIsTickerModalOpenAtomValue();
  const mode = useTickerModalModeAtomValue();
  const selectedPreset = useSelectedPresetAtomValue();
  const setSelectedPreset = useSetSelectedPresetWrite();
  const tickerDraft = useTickerDraftAtomValue();
  const setTickerDraft = useSetTickerDraftWrite();
  const presetKeys = Object.keys(PRESET_TICKERS) as Array<keyof typeof PRESET_TICKERS>;
  const defaultPresetKey = (presetKeys.includes('SCHD') ? 'SCHD' : presetKeys[0]) as keyof typeof PRESET_TICKERS | undefined;

  const handleSelectPreset = useCallback(
    (preset: 'custom' | keyof typeof PRESET_TICKERS) => {
      setSelectedPreset(preset);
      if (preset === 'custom') return;
      const presetDraft = PRESET_TICKERS[preset];
      if (!presetDraft) return;
      setTickerDraft((prev) => ({
        ...prev,
        ...presetDraft
      }));
    },
    [setSelectedPreset, setTickerDraft]
  );

  useEffect(() => {
    if (!isOpen || mode !== 'create' || !defaultPresetKey) return;
    if (selectedPreset !== 'custom') return;
    handleSelectPreset(defaultPresetKey);
  }, [defaultPresetKey, handleSelectPreset, isOpen, mode, selectedPreset]);

  return (
    <TickerModalView
      {...props}
      isOpen={isOpen}
      mode={mode}
      selectedPreset={selectedPreset}
      presetTickers={PRESET_TICKERS}
      tickerDraft={tickerDraft}
      onSelectPreset={handleSelectPreset}
      onChangeDraft={setTickerDraft}
    />
  );
}
