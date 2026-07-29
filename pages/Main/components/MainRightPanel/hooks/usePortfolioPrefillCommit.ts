import { useCallback } from 'react';
import { DIVIDEND_UNIVERSE, type PortfolioSimulationPrefill } from '@/shared/constants';
import type { YieldFormValues } from '@/shared/types';
import type { useScenarioTabs, useSnowballForm } from '@/pages/Main/hooks';
import type {
  useSetFixedByTickerIdWrite,
  useSetIncludedTickerIdsWrite,
  useSetSelectedTickerIdWrite,
  useSetTickerProfilesWrite,
  useSetWeightByTickerIdWrite
} from '@/jotai';
import {
  PORTFOLIO_PREFILL_SCENARIO_NAME,
  buildPortfolioPrefillScenario,
  evaluatePortfolioPrefillCommit,
  isScenarioPrefillSafe,
  type PortfolioPrefillCommitTarget
} from '@/pages/Main/utils';

type ScenarioTabs = ReturnType<typeof useScenarioTabs>;
type SetField = ReturnType<typeof useSnowballForm>['setField'];

type UsePortfolioPrefillCommitArgs = {
  /** 탭 생성 게이트의 현재 판정. `useScenarioTabs`가 주는 값을 그대로 넘긴다(규칙 재구현 금지). */
  tabCreationGate: ScenarioTabs['tabCreationGate'];
  createScenarioTab: ScenarioTabs['createScenarioTab'];
  /**
   * 활성 시나리오가 들고 있는 티커 수 — "덮어써도 잃을 게 없는가" 판정에만 쓴다.
   * ⚠ **포함(included) 개수가 아니라 전체 프로필 개수**여야 한다. 사용자가 만들어 두고 전부 제외한
   * 티커도 지워지면 안 되는 데이터다.
   */
  tickerProfileCount: number;
  /** 활성 시나리오의 초기 투자금 — 같은 판정용. */
  initialInvestment: YieldFormValues['initialInvestment'];
  setTickerProfiles: ReturnType<typeof useSetTickerProfilesWrite>;
  setIncludedTickerIds: ReturnType<typeof useSetIncludedTickerIdsWrite>;
  setWeightByTickerId: ReturnType<typeof useSetWeightByTickerIdWrite>;
  setFixedByTickerId: ReturnType<typeof useSetFixedByTickerIdWrite>;
  setSelectedTickerId: ReturnType<typeof useSetSelectedTickerIdWrite>;
  setField: SetField;
  /** 새 탭을 못 만들고 활성 탭도 못 덮을 때(비로그인) 띄우는 기존 로그인 유도 프롬프트. */
  openLoginNudge: () => void;
};

/**
 * 커밋 결과의 대상. 판정 4종(`evaluatePortfolioPrefillCommit`) + 커밋할 종목이 아예 없던 경우.
 * `nothing-to-commit`은 정상 경로에서는 나오지 않는다(보내는 쪽이 유니버스 밖 티커를 이미 걸렀다).
 */
export type PortfolioPrefillCommitOutcome = PortfolioPrefillCommitTarget | 'nothing-to-commit';

/** 커밋 결과 — 무음 금지. 호출부(테스트·향후 안내 UI)가 무슨 일이 있었는지 알 수 있게 돌려준다. */
export type PortfolioPrefillCommitResult = {
  target: PortfolioPrefillCommitOutcome;
  /** 실제로 폼·포트폴리오에 값이 들어갔는가. */
  committed: boolean;
  /** 커밋된 종목 수. */
  committedTickerCount: number;
  /** 유니버스에서 못 찾아 버린 티커(정상 경로에서는 비어 있다 — 보내는 쪽이 이미 걸렀다). */
  droppedTickers: string[];
};

const NOT_COMMITTED = (target: PortfolioPrefillCommitOutcome): PortfolioPrefillCommitResult => ({
  target,
  committed: false,
  committedTickerCount: 0,
  droppedTickers: []
});

/**
 * **"내 포트폴리오" 프리필의 커밋 지점.**
 *
 * 커밋은 전부 **기존 경로**를 탄다 — 시나리오 탭 API(`createScenarioTab`) + 포트폴리오 setter +
 * `setField`. 사용자가 손으로 조작한 것과 같은 경로라 자동저장·클라우드 동기화·계측이 그대로 따라온다
 * (저장 payload·공유 URL·클라우드 스키마는 **아무것도 바뀌지 않는다**).
 *
 * 기본 동작은 **새 탭 생성**이다: 사용자가 시뮬레이터에서 만들던 시나리오를 다른 화면의 CTA가 덮으면
 * 안 된다. 새 탭을 못 만들 때(비로그인 1탭 게이트·하드 상한)만, 덮어써도 잃을 게 없는 활성 탭이면
 * 거기에 커밋한다. 판정은 순수 함수(`evaluatePortfolioPrefillCommit`·`isScenarioPrefillSafe`)에 있다.
 *
 * ⚠ 게이트 판정은 **탭을 만들기 전에** 해야 한다 — 만들고 나면 활성 탭이 방금 만든 빈 탭으로 바뀌어
 * "활성 탭이 비었는가" 판정이 항상 참이 된다.
 */
export const usePortfolioPrefillCommit = ({
  tabCreationGate,
  createScenarioTab,
  tickerProfileCount,
  initialInvestment,
  setTickerProfiles,
  setIncludedTickerIds,
  setWeightByTickerId,
  setFixedByTickerId,
  setSelectedTickerId,
  setField,
  openLoginNudge
}: UsePortfolioPrefillCommitArgs) => {
  return useCallback(
    (prefill: PortfolioSimulationPrefill): PortfolioPrefillCommitResult => {
      const scenario = buildPortfolioPrefillScenario({ prefill, universe: DIVIDEND_UNIVERSE });
      // 매핑되는 티커가 하나도 없으면 아무것도 만들지 않는다(빈 탭만 남기지 않는다).
      if (!scenario) return NOT_COMMITTED('nothing-to-commit');

      const target = evaluatePortfolioPrefillCommit({
        tabCreation: tabCreationGate,
        isActiveScenarioPristine: isScenarioPrefillSafe({ tickerProfileCount, initialInvestment })
      });

      if (target === 'login-required') {
        // 파괴 없음 — 값은 커밋하지 않고 기존 로그인 유도 프롬프트만 띄운다.
        openLoginNudge();
        return NOT_COMMITTED(target);
      }
      if (target === 'tab-limit-reached') return NOT_COMMITTED(target);

      if (target === 'new-tab') {
        const outcome = createScenarioTab(PORTFOLIO_PREFILL_SCENARIO_NAME);
        // 게이트를 통과했는데도 생성이 거부되면(경합) 커밋하지 않는다 — 남의 탭을 덮지 않는다.
        if (outcome !== 'created') return NOT_COMMITTED(outcome === 'login-required' ? 'login-required' : 'tab-limit-reached');
      }

      setTickerProfiles(scenario.profiles);
      setIncludedTickerIds(scenario.includedIds);
      setWeightByTickerId(scenario.weightByTickerId);
      setFixedByTickerId(scenario.fixedByTickerId);
      setSelectedTickerId(scenario.selectedTickerId);
      // 금액은 반드시 setField로 — 계측·검증·자동저장이 붙어 있는 유일한 쓰기 경로다.
      setField('initialInvestment', scenario.initialInvestment);

      return {
        target,
        committed: true,
        committedTickerCount: scenario.profiles.length,
        droppedTickers: scenario.droppedTickers
      };
    },
    [
      createScenarioTab,
      initialInvestment,
      openLoginNudge,
      setField,
      setFixedByTickerId,
      setIncludedTickerIds,
      setSelectedTickerId,
      setTickerProfiles,
      setWeightByTickerId,
      tabCreationGate,
      tickerProfileCount
    ]
  );
};
