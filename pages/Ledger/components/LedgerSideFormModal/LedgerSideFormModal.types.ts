import type { LedgerSideDraft, LedgerSideFormKind } from '../../utils';
import type { LedgerErrorModel } from '../../types';

export type LedgerSideFormModalProps = {
  readonly kind: LedgerSideFormKind;
  readonly draft: LedgerSideDraft;
  readonly errors: Readonly<Record<string, string>>;
  readonly isSaving: boolean;
  /** 저장 실패. 🔴 실패해도 입력값을 버리지 않는다 — 모달이 열린 채 남는다. */
  readonly writeError: LedgerErrorModel | null;
  readonly onChange: (patch: Readonly<Record<string, string>>) => void;
  readonly onSubmit: () => void;
  readonly onClose: () => void;
};
