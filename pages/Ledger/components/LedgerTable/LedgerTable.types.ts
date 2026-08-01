import type { LedgerRowModel } from '../../types';

export type LedgerTableProps = {
  rows: readonly LedgerRowModel[];
  /** 표 캡션(sr-only)에 들어갈 달 이름. */
  monthLabel: string;
  /** 만료 상태 — 행의 수정·삭제를 막는다. 읽기(월 이동)는 막지 않는다. */
  isWriteBlocked: boolean;
  /**
   * 🔴 무음 비활성 금지 — 비활성 버튼이 가리킬 **화면에 하나뿐인** 사유 줄의 id.
   * 같은 문장을 버튼 수만큼 그리면 스크린리더가 같은 말을 열 번 읽는다.
   */
  writeBlockedHintId: string;
  /** 행 id → 재시도까지 남은 초(429). 없으면 재시도 버튼이 활성이다. */
  retryCountdowns: ReadonlyMap<string, number>;
  onEdit: (id: string) => void;
  onRemove: (id: string) => void;
  onRetry: (id: string) => void;
  /** 삭제 후 다음 행으로 포커스를 옮기기 위해 호출부가 버튼 노드를 잡아 둔다. */
  registerRemoveButton?: (id: string, node: HTMLButtonElement | null) => void;
};
