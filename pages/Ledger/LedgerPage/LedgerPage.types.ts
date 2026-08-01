import type {
  LedgerConnectionState,
  LedgerDraftForm,
  LedgerErrorModel,
  LedgerFieldId,
  LedgerFormModel,
  LedgerMappingModel,
  LedgerMonthSummary,
  LedgerPartialFailureModel,
  LedgerPhase,
  LedgerRemoveTarget,
  LedgerRowModel
} from '../types';

/**
 * 뷰가 그대로 그리는 화면 모델. **여기 없는 필드는 화면에 없다.**
 *
 * 도메인 모델(`LedgerRowModel` 등)은 형제 폴더 `pages/Ledger/types` 가 소유한다 — 훅·컴포넌트도
 * 같은 모델을 쓰기 때문이다(그 파일 상단 주석 참고).
 */
export type LedgerViewModel = {
  state: LedgerConnectionState;
  phase: LedgerPhase;
  /** `checking` 이 300ms 를 넘겼는가. 넘기기 전에는 스켈레톤을 그리지 않는다(깜빡임 방지). */
  showCheckingSkeleton: boolean;
  /** 히어로 `meta` — 연결 전에는 `null`(없는 값에 "—" 를 남기지 않는다). */
  sheetMetaLine: string | null;
  /** 새 탭으로 열 시트 주소. 연결 전에는 `null`. */
  sheetUrl: string | null;
  sheetName: string | null;

  monthLabel: string;
  prevMonthLabel: string;
  nextMonthLabel: string;
  thisMonthLabel: string;
  isCurrentMonth: boolean;
  /** §4.4 — 기록이 있는 가장 최근 달. 없으면 `null`(그 문장을 만들 수 없다). */
  latestMonthLabel: string | null;

  summary: LedgerMonthSummary;
  rows: readonly LedgerRowModel[];
  /** 목록을 다시 읽는 중. 🔴 기존 목록을 지우지 않고 `aria-busy` 만 켠다. */
  isRefetching: boolean;
  /** 첫 로드 — 목록 자리에 스켈레톤. */
  isFirstLoad: boolean;

  /** 🔴 만료돼도 목록·요약은 마지막으로 읽은 그대로 남는다. */
  isExpired: boolean;
  isReconnecting: boolean;
  isConflict: boolean;
  /** 권한 거부 직후 §4.1 로 복귀하며 얹히는 배너. */
  isDenied: boolean;
  /** `window.open` 이 `null` 을 돌려준 경우(예외가 아니다 — pitfalls 2026-07-29). */
  isPopupBlocked: boolean;
  /** 세션 1회 — 새 시트를 방금 만들었을 때만. */
  showCreatedNotice: boolean;
  /** 연결·조회 단계의 실패(§4.2④·§4.11④). */
  connectError: LedgerErrorModel | null;

  /** 매핑 단계 모델. `state === 'mapping'` 일 때만 값이 있다. */
  mapping: LedgerMappingModel | null;

  partialFailure: LedgerPartialFailureModel | null;

  /** 폼 모달. `null` 이면 닫혀 있다. */
  form: LedgerFormModel | null;

  /** 삭제 확인. `null` 이면 닫혀 있다. 🔴 폼과 동시에 열리지 않는다(중첩 오버레이 0). */
  removeTarget: LedgerRemoveTarget | null;
  isRemoving: boolean;
  removeError: LedgerErrorModel | null;

  /** 라이브 리전 문구(화면당 1개). */
  liveMessage: string;
};

export type LedgerViewProps = {
  viewModel: LedgerViewModel;
  /** 페이지 전체를 도는 재시도 카운트다운(🔴 타이머 1개). 행 id → 남은 초. */
  retryCountdowns: ReadonlyMap<string, number>;
  /**
   * 삭제 성공 뒤 포커스를 옮길 행 id. `null` 이면 목록 카드 제목으로 보낸다.
   * 뷰가 가진 유일한 명령형 로직이다(DOM 참조가 필요해 여기 말고는 둘 곳이 없다).
   */
  focusAfterRemoveId: string | null;
  onFocusAfterRemoveHandled: () => void;

  onPickExistingSheet: () => void;
  onCreateSheet: () => void;
  onMappingChange: (field: LedgerFieldId, letter: string | null) => void;
  onConfirmMapping: () => void;

  onPrevMonth: () => void;
  onNextMonth: () => void;
  onThisMonth: () => void;
  onGoLatestMonth: () => void;

  onOpenCreateForm: () => void;
  onOpenEditForm: (id: string) => void;
  onFormChange: (patch: Partial<LedgerDraftForm>) => void;
  onSubmitForm: () => void;
  onCloseForm: () => void;

  onRequestRemove: (id: string) => void;
  onConfirmRemove: () => void;
  onCloseRemove: () => void;

  onRetryRow: (id: string) => void;
  onRetryAll: () => void;
  onReconnect: () => void;
  onRefresh: () => void;
  onOpenSheet: () => void;
  onDismissCreatedNotice: () => void;
};

export type LedgerPageProps = {
  /** '오늘' 주입(테스트 전용). 미지정이면 컨테이너가 마운트 시점의 시각을 고정해 쓴다. */
  now?: Date;
};
