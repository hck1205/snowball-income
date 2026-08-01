import type { LedgerPhase } from '../../types';

export type LedgerConnectPanelProps = {
  /** 진행 중인 쪽 버튼만 `loading`, 다른 쪽은 `disabled`(두 흐름을 동시에 시작할 수 없다). */
  phase: LedgerPhase;
  /** 섹션 제목의 id — `<section aria-labelledby>` 가 가리킨다. */
  headingId: string;
  onPickExistingSheet: () => void;
  onCreateSheet: () => void;
  /** 권한 거부 후 복귀했을 때 이 버튼으로 포커스를 옮긴다(§4.9). */
  registerPickButton?: (node: HTMLButtonElement | null) => void;
};
