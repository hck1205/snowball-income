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

  const handleSelectPreset = useCallback(
    (preset: 'custom' | keyof typeof DIVIDEND_UNIVERSE) => {
      setSelectedPreset(preset);
      if (preset === 'custom') return;
      const presetDraft = DIVIDEND_UNIVERSE[preset];
      if (!presetDraft) return;
      setTickerDraft((prev) => ({
        ...prev,
        ...presetDraft,
        // ⚠ 프리셋의 name(영문 풀네임)을 draft에 싣지 않는다. getTickerDisplayName은 name이 있으면
        //   그걸 우선 표시하므로, 실으면 좌측 목록이 티커 심볼(SCHD) 대신 풀네임(Schwab US Dividend
        //   Equity ETF)으로 보인다. 프리셋의 정체성은 심볼이므로 직접입력 경로처럼 name을 비운다.
        name: ''
      }));
    },
    [setSelectedPreset, setTickerDraft]
  );

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
