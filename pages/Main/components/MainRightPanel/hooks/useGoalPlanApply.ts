import { useEffect, useRef, useState } from 'react';
import { DIVIDEND_UNIVERSE } from '@/shared/constants';
import { PORTFOLIO_PRESET_PLACEHOLDERS } from '@/shared/constants/portfolioPresets';
import {
  LANDING_GOAL_PRESET_ID,
  resolveLandingGoalFromSearch,
  type LandingGoal
} from '@/shared/constants/landingGoals';
import { ANALYTICS_EVENT, trackEvent } from '@/shared/lib/analytics';
import type { YieldFormValues } from '@/shared/types';
import { buildNormalizedAllocation, buildPresetPortfolio, solveGoalMonthlyContribution } from '@/pages/Main/utils';
import type { useScenarioTabs, useSnowballForm } from '@/pages/Main/hooks';

type ScenarioTabs = ReturnType<typeof useScenarioTabs>;

type UseGoalPlanApplyArgs = {
  /** 지금 폼 값. 기간·초기금·세율은 그대로 두고 **월 적립금만** 역산으로 바꾼다. */
  values: YieldFormValues;
  setField: ReturnType<typeof useSnowballForm>['setField'];
  /** 새 탭을 만들 수 있는가. `useScenarioTabs` 의 판정을 그대로 쓴다(규칙 재구현 금지). */
  tabCreationGate: ScenarioTabs['tabCreationGate'];
  createScenarioTab: ScenarioTabs['createScenarioTab'];
  /** 만들어진(또는 재사용된) 탭에 목표 이름을 붙이는 데 쓴다. */
  renameScenarioTab: ScenarioTabs['renameScenarioTab'];
  /** 지금 활성 시나리오. 🔴 이름 붙이기는 **이 값이 갱신된 뒤**에 해야 한다(아래 두 번째 이펙트). */
  activeScenarioId: string;
  /** 프리셋을 지금 시나리오에 조용히 적용한다(`usePortfolioPresetApply.applyPresetSilently`). */
  applyPresetSilently: (preset: (typeof PORTFOLIO_PRESET_PLACEHOLDERS)[number]) => void;
  /** 새 탭을 못 만들 때(비로그인 1탭 게이트) 띄우는 기존 로그인 유도 프롬프트. */
  openLoginNudge: () => void;
  /** 저장된 종목이 하나라도 있으면 "덮으면 잃을 것이 있다"로 본다. */
  hasStoredPortfolio: boolean;
};

/**
 * 목표를 누르면 **그 목표를 달성하는 계획이 완성된 채로** 열린다.
 *
 * ## 왜 생겼나 (2026-08-31 사용자 지적)
 * *"클릭하면 바로 5억 만들기의 포폴이 완성되어있어야하지 않을까."* 그전까지 `?goal=` 은 목표 칸만
 * 채우고 배너로 답을 말했다 — 방문자 입장에서는 **여전히 자기가 포트폴리오를 만들어야 했다.**
 * 목표 버튼을 만든 이유(고르는 일을 줄인다)가 거기서 끊겼다.
 *
 * ## 세 가지를 함께 한다
 * ① 목표 종류에 맞는 **구성**을 담고(자산=배당성장 / 배당=은퇴 준비형 — `LANDING_GOAL_PRESET_ID`)
 * ② 그 구성으로 목표에 닿는 **월 적립금을 역산**하고(`solveGoalMonthlyContribution`)
 * ③ 배당 목표면 **목표 월배당**도 채운다.
 *
 * ## 🔴 새 탭에 만든다 — 남의 작업을 덮지 않는다
 * 저장된 포트폴리오는 사용자 자산이다. 그래서 기본은 **새 시나리오 탭**이고, 탭을 못 만드는
 * 비로그인 사용자에게는 기존 로그인 유도 프롬프트를 띄운다(값은 커밋하지 않는다).
 * ⚠ 게이트 판정은 **탭을 만들기 전에** 해야 한다 — 만들고 나면 활성 탭이 방금 만든 빈 탭이 된다
 *   (`usePortfolioPrefillCommit` 이 같은 함정을 같은 방식으로 피한다).
 *
 * ## 🔴 하이드레이션 뒤에만 돈다
 * 이 훅은 `MainRightPanel` 에서만 불린다 — 그 패널은 하이드레이션 완료 후에 마운트되므로 저장된
 * 워크스페이스 복원이 이 계획을 덮지 못한다. 위로 올리면 2026-08-30 의 결함이 그대로 돌아온다.
 *
 * ## 🔴 탭 이름은 **누른 카드의 이름**이다 (2026-08-31 사용자 지시)
 * `applyPresetSilently` 가 탭을 프리셋 제목("안정적 배당성장")으로 바꿔 버린다 — 사용자가 누른 것은
 * 프리셋이 아니라 목표("5억 만들기")라, 그대로 두면 자기가 무엇을 눌러서 생긴 탭인지 알 수 없다.
 * ⚠ 이름 붙이기는 **두 번째 이펙트**로 미룬다. 새 탭을 만든 직후에는 `activeScenarioId` 가 아직
 *   이전 탭을 가리켜서(그 렌더의 값이다) 같은 프레임에 이름을 바꾸면 **엉뚱한 탭이 바뀐다.**
 *
 * ⚠ 한 번만 적용한다. 주소는 그대로 두되(새로고침하면 다시 만드는 편이 자연스럽다) 같은 마운트
 *   안에서 두 번 도는 것만 막는다.
 */
export const useGoalPlanApply = ({
  values,
  setField,
  tabCreationGate,
  createScenarioTab,
  renameScenarioTab,
  activeScenarioId,
  applyPresetSilently,
  openLoginNudge,
  hasStoredPortfolio
}: UseGoalPlanApplyArgs): void => {
  const appliedRef = useRef(false);
  /** 붙일 탭 이름. 계획을 적용한 뒤 세우고, 다음 렌더에서(=활성 탭이 확정된 뒤) 실제로 붙인다. */
  const [pendingTabName, setPendingTabName] = useState<string | null>(null);

  /* 이펙트는 마운트 때 한 번만 돈다 — 그 안에서 볼 값들은 ref 로 최신을 유지한다
     (의존성에 넣으면 폼을 만질 때마다 계획이 다시 만들어진다). */
  const latest = useRef({
    values,
    setField,
    tabCreationGate,
    createScenarioTab,
    applyPresetSilently,
    openLoginNudge,
    hasStoredPortfolio
  });
  latest.current = {
    values,
    setField,
    tabCreationGate,
    createScenarioTab,
    applyPresetSilently,
    openLoginNudge,
    hasStoredPortfolio
  };

  useEffect(() => {
    if (appliedRef.current) return;
    if (typeof window === 'undefined') return;

    const goal = resolveLandingGoalFromSearch(window.location.search);
    if (goal === undefined) return;

    const preset = PORTFOLIO_PRESET_PLACEHOLDERS.find(
      (candidate) => candidate.id === LANDING_GOAL_PRESET_ID[goal.kind]
    );
    // 지목한 프리셋이 사라졌으면 아무것도 하지 않는다 — 배너는 여전히 답을 말한다.
    if (!preset) return;

    appliedRef.current = true;
    const current = latest.current;

    /*
     * 🔴 **탭 판정이 먼저다.** 덮을 것이 있는데 새 탭을 못 만들면 커밋하지 않는다 —
     * 사용자가 손으로 만든 구성이 목표 버튼 하나로 사라지면 안 된다.
     */
    if (current.hasStoredPortfolio) {
      if (current.tabCreationGate !== 'allowed') {
        current.openLoginNudge();
        return;
      }
      if (current.createScenarioTab(goalScenarioName(goal)) !== 'created') return;
    }

    current.applyPresetSilently(preset);
    /* 🔴 프리셋 제목이 아니라 **누른 카드 이름**으로 (위 머리말). 실제 rename 은 아래 이펙트가 한다. */
    setPendingTabName(goal.label);

    /*
     * 배당 목표는 폼에 자리가 있다. 자산 목표는 없다 — 그쪽 답은 결과를 훑어 배너가 낸다.
     * ⚠ 목표를 **먼저** 넣는다. 아래 역산이 이 값을 판정선으로 쓰기 때문이다.
     */
    if (goal.kind === 'dividend') setField('targetMonthlyDividend', goal.amount);

    const portfolio = buildPresetPortfolio({ preset, universe: DIVIDEND_UNIVERSE });
    if (!portfolio) return;

    const includedProfiles = portfolio.profiles.filter((profile) =>
      portfolio.includedIds.includes(profile.id)
    );
    const monthlyContribution = solveGoalMonthlyContribution({
      goal,
      includedProfiles,
      normalizedAllocation: buildNormalizedAllocation(includedProfiles, portfolio.weightByTickerId),
      values: {
        ...current.values,
        ...portfolio.formPatch,
        targetMonthlyDividend: goal.kind === 'dividend' ? goal.amount : current.values.targetMonthlyDividend
      }
    });

    /*
     * 🔴 못 풀면 **적립금을 건드리지 않는다.** 어떤 금액으로도 닿지 못하는 구성이 실제로 있고
     * (무배당·마이너스 성장), 그때 숫자를 지어내면 "앱이 알려준 금액을 넣었는데 미도달"이 된다.
     * 배너가 "지금 조건으로는 N년 안에 닿지 않습니다"로 정직하게 답한다.
     */
    if (monthlyContribution === null) {
      trackEvent(ANALYTICS_EVENT.GOAL_PLAN_APPLIED, {
        goal_id: goal.id,
        goal_kind: goal.kind,
        preset_id: preset.id,
        solved: false
      });
      return;
    }

    setField('monthlyContribution', monthlyContribution);
    trackEvent(ANALYTICS_EVENT.GOAL_PLAN_APPLIED, {
      goal_id: goal.id,
      goal_kind: goal.kind,
      preset_id: preset.id,
      solved: true
    });
    // 마운트 시 한 번만 — 의존성이 비어 있는 것이 의도다(위 머리말).
  }, []);

  /*
   * 🔴 **한 프레임 늦게** 이름을 붙인다. 새 탭을 만든 직후의 `activeScenarioId` 는 아직 이전 탭을
   * 가리키므로(그 렌더의 값이다), 같은 프레임에 바꾸면 엉뚱한 탭의 이름이 바뀐다.
   * ⚠ 한 번 붙이면 비운다 — 사용자가 탭 이름을 손으로 고친 뒤 되돌려 놓지 않기 위해서다.
   */
  useEffect(() => {
    if (pendingTabName === null || activeScenarioId === '') return;

    renameScenarioTab(activeScenarioId, pendingTabName);
    setPendingTabName(null);
  }, [activeScenarioId, pendingTabName, renameScenarioTab]);
};

/** 새 탭 이름. 사용자가 무엇을 눌러서 생긴 탭인지 한눈에 알아야 한다 — 누른 카드와 같은 말이다. */
const goalScenarioName = (goal: LandingGoal): string => goal.label;
