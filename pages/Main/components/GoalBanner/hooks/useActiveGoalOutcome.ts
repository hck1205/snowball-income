import { useMemo, useState } from 'react';
import { resolveLandingGoalFromSearch } from '@/shared/constants/landingGoals';
import type { SimulationResult } from '@/shared/types';
import { resolveGoalOutcome } from '../GoalBanner.utils';
import type { GoalOutcome } from '../GoalBanner.types';
import { useGoalBannerAnalytics } from './useGoalBannerAnalytics';

/**
 * 주소에 실린 목표를 읽어 **지금 결과로 판정하고, 그 판정을 계측까지 한다.**
 *
 * ## 왜 한 훅인가 (2026-08-30 리팩터)
 * 셋은 따로 쓸 일이 없다 — 목표를 읽지 않으면 판정할 것이 없고, 판정하지 않으면 쏠 것이 없다.
 * 호출부(`MainRightPanel`)에 세 조각으로 흩어져 있으면 다음 사람이 하나만 지우거나 순서를
 * 바꾸기 쉽고, 그러면 배너는 뜨는데 계측만 조용히 사라지는 종류의 결함이 난다.
 *
 * ## 🔴 주소는 **마운트 시 한 번만** 읽는다
 * 이펙트로 읽으면 첫 프레임 뒤에 띠가 하나 생겨 결과가 아래로 밀린다. `useSearchParams` 를 쓰지
 * 않는 이유는 `usePresetQueryApply` 와 같다 — 이 패널을 라우터 없이 세우는 테스트가 12파일 있다.
 *
 * ⚠ 판정은 `tableRows` 를 따라 바뀐다(종목·조건을 만지면 답도 바뀐다). 그게 이 배너의 값어치다.
 * ⚠ 목표 없이 들어온 세션에서는 `null` 이고 아무것도 쏘지 않는다.
 */
export const useActiveGoalOutcome = (tableRows: readonly SimulationResult[]): GoalOutcome | null => {
  const [activeGoal] = useState(() =>
    typeof window === 'undefined' ? undefined : resolveLandingGoalFromSearch(window.location.search)
  );

  const outcome = useMemo(
    () => (activeGoal === undefined ? null : resolveGoalOutcome(activeGoal, tableRows)),
    [activeGoal, tableRows]
  );

  useGoalBannerAnalytics(outcome);

  return outcome;
};
