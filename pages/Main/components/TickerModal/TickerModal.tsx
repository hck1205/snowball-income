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

  const handleSelectPreset = (preset: 'custom' | keyof typeof PRESET_TICKERS) => {
    setSelectedPreset(preset);
    if (preset === 'custom') return;
    const presetDraft = PRESET_TICKERS[preset];
    if (!presetDraft) return;
    setTickerDraft((prev) => ({
      ...prev,
      ...presetDraft
    }));
  };

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
