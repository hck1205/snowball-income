import type { PresetTickerKey } from '@/shared/constants';
import type { TickerDraft } from '@/shared/types/snowball';
import type { StagedTicker } from './TickerModal.utils';

export type TickerModalProps = {
  onDelete: () => void;
  onClose: () => void;
  /**
   * 저장/생성. **인자가 있으면 그 목록을 한 번에 만든다**(다중 생성), 없으면 종전처럼
   * 드래프트 하나를 다룬다(수정 모드는 항상 후자다).
   *
   * 🔴 시그니처를 넓히기만 했다 — `onSave={saveTicker}` 로 이어진 기존 배선(Main.view)이 그대로
   *    유효해야 다중 생성이 페이지 컨테이너까지 번지지 않는다.
   */
  onSave: (drafts?: readonly StagedTicker[]) => void;
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
