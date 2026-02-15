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

  return (
    <TickerModalView
      {...props}
      isOpen={isOpen}
      mode={mode}
      selectedPreset={selectedPreset}
      presetTickers={PRESET_TICKERS}
      tickerDraft={tickerDraft}
      onSelectPreset={setSelectedPreset}
      onChangeDraft={setTickerDraft}
    />
  );
}
