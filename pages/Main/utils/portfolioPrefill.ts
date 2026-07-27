import type { TickerDraft, TickerProfile } from '@/shared/types/snowball';
import {
  PORTFOLIO_PREFILL_WEIGHT_TOTAL,
  type PortfolioSimulationPrefill
} from '@/shared/constants';
import { defaultYieldFormValues } from '@/shared/lib/snowball';

/**
 * **"내 포트폴리오" 프리필을 시뮬레이터 시나리오로 옮기는 순수 계층.**
 *
 * 커밋 자체는 기존 setter(`setTickerProfiles`·`setWeightByTickerId`·`setField`)가 하고, 여기서는
 * "무엇을 커밋할지"만 계산한다 — 그래야 판정이 React 없이 결정론적으로 테스트된다.
 * 매핑 규칙은 `buildPresetPortfolio`(preset.ts)와 같다: 유니버스에 없는 티커는 버리고 **남은 비중을
 * 100으로 재정규화**한다(버린 만큼 비중이 증발하면 안 된다).
 */

/** 새로 만든 탭에 붙일 이름. 활성 탭에 커밋할 때는 **이름을 건드리지 않는다**(사용자가 지은 이름 보호). */
export const PORTFOLIO_PREFILL_SCENARIO_NAME = '내 포트폴리오';

/** 커밋할 시나리오 내용. `PresetPortfolio`와 같은 모양이라 호출부의 setter 배선이 동일하다. */
export type PortfolioPrefillScenario = {
  profiles: TickerProfile[];
  includedIds: string[];
  selectedTickerId: string | null;
  weightByTickerId: Record<string, number>;
  fixedByTickerId: Record<string, boolean>;
  /** 초기 투자금(원). `setField('initialInvestment', ...)`로 커밋한다. */
  initialInvestment: number;
  /**
   * 유니버스에서 못 찾아 **버린** 티커. 무음 제외 금지 — 호출부가 결과로 돌려받아 표면화할 수 있게 한다
   * (정상 경로에서는 보내는 쪽이 이미 걸러 비어 있다).
   */
  droppedTickers: string[];
};

/**
 * 프리필 → 시나리오 내용. 매핑되는 티커가 하나도 없으면 `null`(아무것도 커밋하지 않는다).
 *
 * `universe`는 주입받는다 — 이 함수가 프리셋 데이터에 직접 묶이면 테스트가 실제 유니버스 변화에
 * 흔들린다(`buildPresetPortfolio`와 같은 이유).
 */
export const buildPortfolioPrefillScenario = ({
  prefill,
  universe
}: {
  prefill: PortfolioSimulationPrefill;
  universe: Readonly<Record<string, TickerDraft>>;
}): PortfolioPrefillScenario | null => {
  const droppedTickers: string[] = [];
  const entries: { profile: TickerProfile; weight: number }[] = [];

  prefill.holdings.forEach((holding, index) => {
    const universeItem = universe[holding.ticker];
    if (!universeItem) {
      droppedTickers.push(holding.ticker);
      return;
    }

    entries.push({
      profile: {
        ...universeItem,
        id: `portfolio-prefill-${holding.ticker.toLowerCase()}-${index + 1}`,
        // 표시명은 티커 규칙(getTickerDisplayName)에 맡긴다 — 프리셋 경로와 같은 관례.
        name: ''
      },
      weight: holding.weightPercent
    });
  });

  if (entries.length === 0) return null;

  const totalWeight = entries.reduce((sum, entry) => sum + entry.weight, 0);
  // 합이 이미 100이면 그대로 둔다(부동소수 잡음 방지). 티커를 버려 합이 줄었으면 비율을 유지한 채 100으로.
  const normalize = (weight: number): number => {
    if (totalWeight <= 0) return 0;
    if (totalWeight === PORTFOLIO_PREFILL_WEIGHT_TOTAL) return weight;
    return (weight * PORTFOLIO_PREFILL_WEIGHT_TOTAL) / totalWeight;
  };

  const profiles = entries.map((entry) => entry.profile);
  const includedIds = profiles.map((profile) => profile.id);

  return {
    profiles,
    includedIds,
    selectedTickerId: includedIds[0] ?? null,
    weightByTickerId: entries.reduce<Record<string, number>>((acc, entry) => {
      acc[entry.profile.id] = normalize(entry.weight);
      return acc;
    }, {}),
    fixedByTickerId: profiles.reduce<Record<string, boolean>>((acc, profile) => {
      acc[profile.id] = false;
      return acc;
    }, {}),
    initialInvestment: prefill.initialInvestmentKrw,
    droppedTickers
  };
};

/** 프리필을 **어디에** 커밋할지. 커밋하지 않는 두 결과(`login-required`·`tab-limit-reached`)도 사유가 남는다. */
export type PortfolioPrefillCommitTarget = 'new-tab' | 'active-tab' | 'login-required' | 'tab-limit-reached';

/**
 * 커밋 대상 판정 — **순수 함수**(React·atom 비의존).
 *
 * 기본은 **새 탭**이다: 사용자가 시뮬레이터에서 만들던 시나리오를 다른 화면의 CTA가 덮으면 안 된다.
 * 새 탭을 못 만드는 경우(비로그인 1탭 게이트·하드 상한)에 한해, **덮어써도 잃을 게 없는 활성 탭**
 * (`isActiveScenarioPristine`)이면 거기에 커밋한다 — 비로그인 사용자도 프리필을 받아볼 수 있게 하되
 * 파괴는 하지 않는 절충이다. 그마저 안 되면 커밋하지 않고 사유만 돌려준다(로그인 유도·무동작).
 */
export const evaluatePortfolioPrefillCommit = ({
  tabCreation,
  isActiveScenarioPristine
}: {
  /** `evaluateScenarioTabCreation`의 판정 결과(useScenarioTabs가 그대로 노출한다). */
  tabCreation: 'allowed' | 'limit-reached' | 'login-required';
  isActiveScenarioPristine: boolean;
}): PortfolioPrefillCommitTarget => {
  if (tabCreation === 'allowed') return 'new-tab';
  if (isActiveScenarioPristine) return 'active-tab';
  return tabCreation === 'login-required' ? 'login-required' : 'tab-limit-reached';
};

/**
 * 활성 시나리오가 **프리필로 덮어써도 잃을 게 없는 상태**인가.
 *
 * 판정 대상은 정확히 "커밋이 건드리는 것"뿐이다 — 티커 구성과 초기 투자금. 월 적립금·목표처럼
 * 커밋이 안 건드리는 값은 사용자가 바꿔놨어도 그대로 살아남으므로 판정에 넣지 않는다.
 * ⚠ `investmentStartDate` 같은 "모듈 로드 시각" 기본값을 비교에 넣지 말 것 — 어제 저장한 사용자가
 * 아무것도 안 고쳤는데 "수정됨"으로 잡혀 비로그인 프리필이 조용히 막힌다.
 */
export const isScenarioPrefillSafe = ({
  tickerProfileCount,
  initialInvestment
}: {
  tickerProfileCount: number;
  initialInvestment: number;
}): boolean => tickerProfileCount === 0 && initialInvestment === defaultYieldFormValues.initialInvestment;
