import type { SimulationOutput } from '@/shared/types';

export type SimulationResultProps = {
  simulation: SimulationOutput;
  showQuickEstimate: boolean;
  isResultCompact: boolean;
  targetMonthlyDividend: number;
  onToggleCompact: (checked: boolean) => void;
  formatResultAmount: (value: number, compact: boolean) => string;
  formatPercent: (value: number) => string;
  targetYearLabel: (year: number | undefined) => string;
  /**
   * 목표 미설정 상태의 빠른 설정 칩 — 원 단위 금액을 그대로 폼에 적용한다.
   * 옵셔널: 격리 렌더(테스트·스토리)에서 배선 없이도 카드가 그대로 뜨게.
   */
  onQuickSetTarget?: (won: number) => void;
  /** 목표 입력 필드로 이동(모바일이면 설정 드로어를 먼저 연다). 옵셔널 이유는 위와 같다. */
  onOpenTargetField?: () => void;
};
