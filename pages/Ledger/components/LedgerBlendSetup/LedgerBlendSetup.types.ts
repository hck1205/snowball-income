import type { LedgerBlendSetupModel, LedgerBlendSourceKey } from '../../types';

export type LedgerBlendSetupProps = {
  model: LedgerBlendSetupModel;
  onChangeSource: (source: LedgerBlendSourceKey, value: string) => void;
  onChangeLabel: (source: LedgerBlendSourceKey, label: string) => void;
  /** 🔴 막혀 있을 때는 버튼이 비활성이라 호출되지 않는다(같은 링크 두 개·미선택). */
  onSubmit: () => void;
  onCancel: () => void;
  /** 저장된 구성을 지운다. 링크·기록은 그대로 남는다. */
  onClear: () => void;
};
