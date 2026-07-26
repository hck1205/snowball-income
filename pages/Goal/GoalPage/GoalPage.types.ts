import type { GoalErrorReason, GoalScenarioStatus } from '../hooks';

export type GoalPageProps = {
  /** '오늘' 주입(테스트 전용). 미지정이면 훅이 마운트 시점의 시각을 고정해 쓴다. */
  now?: Date;
};

/** 조건 요약(접힘)의 한 줄. 라벨·값 모두 이미 포맷된 문자열이다 — 뷰는 계산하지 않는다. */
export type GoalConditionRow = {
  label: string;
  value: string;
};

/** 달성률 미터. `percent`는 0~100 정수(미터 폭 + aria-valuenow), `sentence`는 색 없이 같은 사실을 말하는 병기 문장. */
export type GoalMeterModel = {
  percent: number;
  sentence: string;
};

/** 도달/미도달 한 줄. 색 단독 금지 규칙에 따라 **톤 + 아이콘 + 문장**이 항상 함께 간다. */
export type GoalStatusLine = {
  tone: 'success' | 'warning';
  text: string;
};

export type GoalStatTile = {
  value: string;
  hint: string | null;
};

/**
 * 뷰가 그대로 그리는 화면 모델. **여기 없는 필드는 화면에 없다** — 특히 목표 미설정(`no-target`)일 때
 * `target`·`meter`·`eta`·`statusLine`이 전부 null이라는 사실이 "0원 목표 달성" 오표시를 구조적으로 막는다.
 */
export type GoalViewModel = {
  status: GoalScenarioStatus;
  isLoading: boolean;
  errorReason: GoalErrorReason | null;
  /** 히어로 하단 한 줄(시나리오명 · 종목 요약 · 기준일). 계산이 없으면 기준일만 남는다. */
  asOfLine: string;
  /** 카드 자리를 빈 상태 카드가 **대체**하는가(B 포트폴리오 없음 / G 계산 불가). 카드 안 카드를 만들지 않는다. */
  showEmptyState: boolean;
  /** G에서 빈 상태 위에 붙는 경고 문구. 사유(read-failed/invalid-data)에 따라 문장이 다르다. */
  errorMessage: string | null;
  /** C — 목표 미설정: hero 타일 자리를 안내 패널이 차지한다. */
  showSetupPanel: boolean;
  /** 목표 월배당(hero 타일). 목표 미설정·로딩이면 null. */
  target: string | null;
  /** 현재 예상 월배당. 로딩 중에는 '—'. */
  current: GoalStatTile;
  meter: GoalMeterModel | null;
  /**
   * 남은 금액(목표 − 현재 예상 월배당). **목표 미설정·이미 달성이면 null** —
   * 0원이나 음수를 "남은 금액"으로 보여 주지 않는다(도달 상태는 도달 문구가 말한다).
   */
  remaining: GoalStatTile | null;
  /** 예상 달성(값 + 근거 힌트). 목표 미설정이면 null. */
  eta: GoalStatTile | null;
  statusLine: GoalStatusLine | null;
  /** D — 미도달일 때만 "시뮬레이터에서 조건 바꾸기". */
  showChangeConditions: boolean;
  /** 목표를 이미 정한 상태(D/E/F)에서만 카드 헤더에 [목표 수정]. */
  showEditTarget: boolean;
  /** F 이미 달성 — 다음 행동이 "목표 올리기"라 [목표 수정]을 한 단계 강조한다. */
  emphasizeEditTarget: boolean;
  conditions: GoalConditionRow[] | null;
};

export type GoalViewProps = {
  viewModel: GoalViewModel;
  /** 항상 마운트되는 라이브 리전 문구. 하이드레이션이 끝나기 전에는 로딩 문장. */
  liveMessage: string;
  /** 시뮬레이터로 이동(목표 포커스 없음). B/D/G의 CTA. */
  onOpenSimulator: () => void;
  /** 시뮬레이터로 이동 + 목표 입력 포커스. C의 CTA와 [목표 수정]. */
  onOpenTargetSetup: () => void;
  /**
   * 고른 목표 값(원)을 실어 시뮬레이터로 이동한다. **저장은 시뮬레이터 안에서** 일어난다 —
   * 이 화면에는 자동저장·클라우드 동기화 루프가 없어 여기서 쓰면 조용히 사라진다.
   */
  onCommitTarget: (won: number) => void;
};
