import type { ReactNode } from 'react';
import type { SimulationOutput } from '@/shared/types';
import type { ConditionStripItem } from '@/components/ConditionStrip';

export type ResultSummaryCardProps = {
  simulation: SimulationOutput;
  showQuickEstimate: boolean;
  isResultCompact: boolean;
  targetMonthlyDividend: number;
  formatResultAmount: (value: number, compact: boolean) => string;
  formatPercent: (value: number) => string;
  targetYearLabel: (year: number | undefined) => string;
  /** 계산 조건 스트립 항목 — 순수 함수(`buildConditionStripItems`) 산출물. */
  condition: ConditionStripItem[];
  /** 조건 스트립 우측 액션("조건 수정"). 페이지가 설정 진입 버튼을 만들어 넣는다. */
  conditionAction?: ReactNode;
  /**
   * 조건 요약 **바로 아래**에 붙는 각주. "이 계산이 무엇을 넣지 않았는가"는 조건의 일부라
   * 결과 숫자 가까이 있어야 읽힌다(현재 소비자: 환율 민감도 안내).
   */
  footnote?: ReactNode;
  /**
   * 카드 **우측 상단**에 서는 결과 밀도 토글("간략히").
   *
   * 여기 두는 이유: 이 토글이 바꾸는 것은 결과 카드들의 **숫자 표기**이고, 그 숫자가 가장 크게
   * 보이는 곳이 이 카드다 — 조작과 결과가 한눈에 들어온다. 예전에는 시나리오 탭 줄에 있었는데
   * 탭 스트립과 가로를 나눠 써서 좁은 폭에서 가장 먼저 눌렸다(2026-07-29 이동).
   *
   * 이 카드는 제목이 없지만 `Card` 는 `titleRight` 만으로도 헤더를 그린다.
   */
  densityToggle?: ReactNode;
};
