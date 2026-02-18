import { useCallback, useEffect } from 'react';
import { DIVIDEND_UNIVERSE } from '@/shared/constants';
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
import { ANALYTICS_EVENT, trackEvent } from '@/shared/lib/analytics';

export default function TickerModal(props: TickerModalProps) {
  const isOpen = useIsTickerModalOpenAtomValue();
  const mode = useTickerModalModeAtomValue();
  const selectedPreset = useSelectedPresetAtomValue();
  const setSelectedPreset = useSetSelectedPresetWrite();
  const tickerDraft = useTickerDraftAtomValue();
  const setTickerDraft = useSetTickerDraftWrite();
  const presetKeys = Object.keys(DIVIDEND_UNIVERSE) as Array<keyof typeof DIVIDEND_UNIVERSE>;
  const defaultPresetKey = (presetKeys.includes('SCHD') ? 'SCHD' : presetKeys[0]) as keyof typeof DIVIDEND_UNIVERSE | undefined;

  const handleSelectPreset = useCallback(
    (preset: 'custom' | keyof typeof DIVIDEND_UNIVERSE) => {
      setSelectedPreset(preset);
      if (preset === 'custom') return;
      const presetDraft = DIVIDEND_UNIVERSE[preset];
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

  useEffect(() => {
    if (!isOpen) return;
    trackEvent(ANALYTICS_EVENT.MODAL_VIEW, {
      modal_type: 'ticker_modal',
      mode
    });
  }, [isOpen, mode]);

  return (
    <TickerModalView
      {...props}
      isOpen={isOpen}
      mode={mode}
      selectedPreset={selectedPreset}
      presetTickers={DIVIDEND_UNIVERSE}
      tickerDraft={tickerDraft}
      onSelectPreset={handleSelectPreset}
      onChangeDraft={setTickerDraft}
    />
  );
}
