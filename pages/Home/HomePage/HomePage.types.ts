import type { LandingGoal } from '@/shared/constants/landingGoals';

export type HomeViewModel = {
  /** 저장된 작업이 있는가. 있을 때만 "이어서 계산하기" 줄을 그린다. */
  hasStoredWorkspace: boolean;
};

export type HomePageViewProps = {
  viewModel: HomeViewModel;
  /** 목표 선택 — **계측 전용**. 이동은 카드의 `Link` 가 한다. */
  onSelectGoal: (goal: LandingGoal) => void;
  /** 성향 테스트 — 같은 이유로 계측 전용이다. */
  onQuiz: () => void;
  /** 출구("천천히 둘러보기") — 같은 이유로 계측 전용이다. */
  onBrowse: () => void;
  onResume: () => void;
};
