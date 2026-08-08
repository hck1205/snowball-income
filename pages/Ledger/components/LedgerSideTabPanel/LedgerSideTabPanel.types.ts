import type { HoldingsModel, InvestmentsModel, LedgerViewTabId, RulesModel } from '../../utils';

/**
 * 옆탭 하나의 상태.
 *
 * 🔴 `records` 와 `error` 를 **동시에** 들지 않는다 — 반쯤 읽은 표를 보여 주면 사용자는
 *    그것이 전부라고 믿는다.
 */
export type LedgerSideTabState =
  | { readonly status: 'idle' }
  | { readonly status: 'loading' }
  | { readonly status: 'error'; readonly message: string }
  | { readonly status: 'ready'; readonly holdings: HoldingsModel }
  | { readonly status: 'ready'; readonly investments: InvestmentsModel }
  | { readonly status: 'ready'; readonly rules: RulesModel };

export type LedgerSideTabPanelProps = {
  readonly tab: Exclude<LedgerViewTabId, 'entries'>;
  readonly state: LedgerSideTabState;
  /** 이 탭이 가리키는 시트 탭을 새 창에서 여는 주소. 적는 것은 시트에서 한다. */
  readonly sheetUrl?: string;
  readonly onRetry: () => void;
  /**
   * 이 탭에 **직접 적기**. 🔴 앱에도 입력을 두되 검증 규칙은 시트 쓰기와 **한 곳**을 쓴다
   * (`ledgerSideForm.ts`) — 경로가 둘이어도 규칙이 하나면 갈리지 않는다.
   */
  readonly onAdd: () => void;
};
