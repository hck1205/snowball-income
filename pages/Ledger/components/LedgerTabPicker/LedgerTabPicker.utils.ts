import { LEDGER_COPY } from '../../copy';

/** 탭 전환을 막는 조건. 화면이 아니라 **쓰기 대기 상태**가 정한다. */
export type LedgerTabSwitchGuardInput = {
  /** 추가·수정 폼 모달이 열려 있는가. */
  readonly isFormOpen: boolean;
  /** 저장하지 못한 기록(대기열)이 남아 있는가. */
  readonly hasUnsavedQueue: boolean;
};

/**
 * 탭을 바꿔도 되는가 — 막는다면 그 **사유 문장**을 준다(`null` 이면 바꿔도 된다).
 *
 * 🔴 이 판단은 취향이 아니라 **사고 방지**다. 저장 실패 대기열의 재시도는 그때의 연결(`link`)로
 * 행을 **추가**하는데, 추가에는 행 참조가 없어 `guardRowRef`(옛 스냅샷 차단)가 걸리지 않는다.
 * 그래서 탭이 바뀐 뒤에 재시도하면 **다른 탭에 기록이 들어간다**. 폼도 같은 이유로 막는다 —
 * 입력 중인 내용이 어느 탭으로 갈지가 도중에 바뀌면 안 된다.
 * 🔴 사유 없이 비활성만 하지 않는다 — 반환한 문장은 반드시 화면에 함께 선다.
 */
export const tabSwitchBlockedReason = (input: LedgerTabSwitchGuardInput): string | null => {
  if (input.isFormOpen) return LEDGER_COPY.tab.blockedByForm;
  if (input.hasUnsavedQueue) return LEDGER_COPY.tab.blockedByQueue;
  return null;
};
