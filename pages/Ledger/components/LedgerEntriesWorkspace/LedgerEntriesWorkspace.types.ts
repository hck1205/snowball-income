import type { LedgerViewProps } from '../../LedgerPage/LedgerPage.types';

/**
 * 기록 화면의 props.
 *
 * 🔴 콜백 타입은 **`LedgerViewProps` 에서 그대로 집어 온다**(`Pick`). 여기서 다시 적으면 시그니처가
 * 조용히 갈라지고, 그건 타입이 있는데도 못 잡는 종류의 드리프트다.
 *
 * ⚠ 이 목록이 짧아 보이는 이유는 **이 화면 전용이던 것들을 부품이 직접 갖기 때문**이다 —
 *   요약 카드 렌더러·id 넷·삭제 뒤 포커스 복구·파생 플래그. 부모에 남겨 두면 부모가 쓰지도 않는
 *   상태를 계속 넘겨야 한다.
 * ⚠ `expiredHintId` 만 예외다 — 오버레이와 **같은 줄**을 가리켜야 해서 부모가 소유한다.
 */
export type LedgerEntriesWorkspaceProps = Pick<
  LedgerViewProps,
  | 'viewModel'
  | 'retryCountdowns'
  | 'focusAfterRemoveId'
  | 'onFocusAfterRemoveHandled'
  | 'onSelectTab'
  | 'onSelectPayerScope'
  | 'onPrevMonth'
  | 'onNextMonth'
  | 'onThisMonth'
  | 'onGoLatestMonth'
  | 'onOpenCreateForm'
  | 'onOpenEditForm'
  | 'onRequestRemove'
  | 'onRetryRow'
  | 'onRetryAll'
  | 'onRefresh'
  | 'onOpenCarryOver'
  | 'onConfirmCarryOver'
  | 'onCloseCarryOver'
  | 'onRunBackfill'
  | 'onToggleDividendOverlay'
> & {
  /** 만료 안내 문구의 id. 오버레이와 같은 줄을 가리켜야 해서 부모가 만든다. */
  expiredHintId: string;
};
