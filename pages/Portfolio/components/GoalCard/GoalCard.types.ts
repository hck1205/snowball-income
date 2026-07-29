import type { PortfolioHoldingsStatus } from '../../hooks';

/**
 * 달성률의 **현재값이 어디서 왔는가**. 실측(지금 보유한 종목)과 시뮬 파생값(저장된 투자 조건)은
 * 서로 다른 계열이라, 화면은 언제나 어느 쪽인지 한 줄로 밝힌다.
 */
export type PortfolioGoalFallbackReason = 'no-holdings' | 'no-quantity' | 'read-failed' | 'fx-unavailable';

export type PortfolioGoalBasis =
  | { kind: 'pending' }
  | { kind: 'measured'; amountKrw: number }
  | { kind: 'fallback'; reason: PortfolioGoalFallbackReason };

export type ResolvePortfolioGoalBasisInput = {
  holdingsStatus: PortfolioHoldingsStatus;
  /** 보유 목록 행 수(수량 유무 무관). */
  holdingsCount: number;
  /** 합계에 실제로 반영된 행 수(`summary.counts.included`). */
  includedCount: number;
  /** 실측 세후 월배당(**USD**). 원화 환산은 이 판정 안에서 딱 한 번 일어난다. */
  monthlyAfterTaxUsd: number;
  fxStatus: 'loading' | 'success' | 'stale' | 'error';
  /** 1 USD = N KRW. `success`/`stale`에서만 non-null. */
  fxRateKrwPerUsd: number | null;
};

/** 카드 타일 1개. 값·힌트 모두 **이미 포맷된 문자열**이다 — 뷰는 계산하지 않는다. */
export type GoalTileModel = { label: string; value: string; hint?: string };

/** 도달/미도달 한 줄. 색 단독 금지 규칙에 따라 **톤 + 아이콘 + 문장**이 항상 함께 간다. */
export type GoalStatusLineModel = { tone: 'success' | 'warning'; text: string };

/** 기준 안내 한 줄. `actionLabel`이 있으면 그 자리에 인라인 버튼이 붙는다(드로어 열기). */
export type GoalBasisNoteModel = { text: string; actionLabel: string | null };

/** 가정 요약(`AssumptionsDetails`)의 목표 그룹 한 줄. 페이지의 가정 행과 구조가 같다. */
export type GoalConditionRow = { label: string; value: string };

/**
 * 목표 달성 카드의 화면 모델. **여기 없는 필드는 화면에 없다.**
 *
 * 특히 목표 미설정일 때 `meter`·`statusLine`이 전부 null이고 `tiles`가 비어 있다는 사실이
 * "0원 목표를 달성했다"류 오표시를 구조적으로 막는다.
 */
export type PortfolioGoalCardModel = {
  /** 골격 — 타일 값은 '—', 미터 percent 는 null(값 없는 progressbar 금지). */
  isLoading: boolean;
  showSetupPanel: boolean;
  meter: { percent: number; sentence: string } | null;
  tiles: GoalTileModel[];
  basisNote: GoalBasisNoteModel | null;
  statusLine: GoalStatusLineModel | null;
  /** D·E′ 공용 액션(둘 다 시뮬레이터로, 프리필 없음). */
  actionLabel: string | null;
  showEditTarget: boolean;
  emphasizeEditTarget: boolean;
  /** GA·라이브 리전 파생. */
  hasTarget: boolean;
  progressPercent: number | null;
  currentBasis: 'measured' | 'simulated';
  /**
   * **지금** 목표 이상인가(엔진 판정). GA 진행률 버킷이 이 값을 쓴다 —
   * 반올림된 퍼센트나 "미래 언젠가 도달"(`reachedInRange`)로 판정하면 버킷이 무의미해진다.
   */
  isAlreadyReached: boolean;
  /** 저장된 투자 기간 안에 목표에 닿는가(현재 달성 포함). */
  reachedInRange: boolean;
  /** `AssumptionsDetails` 목표 그룹. 목표·조건이 없으면 빈 배열이라 그룹 자체가 렌더되지 않는다. */
  conditionRows: GoalConditionRow[];
};

export type GoalCardProps = {
  model: PortfolioGoalCardModel;
  /** 종목 추가 드로어 — BasisNote 인라인 액션이 `aria-expanded`/`aria-controls`로 가리킨다. */
  pickerId: string;
  isPickerOpen: boolean;
  /** [목표 수정] — 시뮬레이터의 목표 입력으로(값 없이 포커스만). */
  onOpenTargetSetup: () => void;
  /** 칩·직접 입력으로 고른 목표(원)를 시뮬레이터로 실어 보낸다(이 화면은 저장하지 않는다). */
  onCommitTarget: (won: number) => void;
  /** D·E′ 액션 — 프리필 없이 시뮬레이터로. */
  onOpenSimulator: () => void;
  /** BasisNote 의 [종목 추가] — 같은 화면의 드로어를 연다. */
  onAddHolding: () => void;
};
