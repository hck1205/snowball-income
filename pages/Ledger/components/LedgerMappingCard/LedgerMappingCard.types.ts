import type { LedgerFieldId, LedgerMappingModel, LedgerPhase } from '../../types';

export type LedgerMappingCardProps = {
  model: LedgerMappingModel;
  phase: LedgerPhase;
  onMappingChange: (field: LedgerFieldId, letter: string | null) => void;
  onConfirm: () => void;
  /** "다른 시트 고르기" — 피커를 다시 연다(§4.1 과 같은 진입점). */
  /** 열 지정을 그만두고 연결 선택 화면으로. 🔴 피커를 다시 열지 않는다. */
  onBack: () => void;
  onReselect: () => void;
};
