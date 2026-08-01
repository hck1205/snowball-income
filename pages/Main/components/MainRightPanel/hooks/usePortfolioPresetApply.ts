import { useCallback, useState } from 'react';
import type { TickerProfile, YieldFormValues } from '@/shared/types';
import { DIVIDEND_UNIVERSE } from '@/shared/constants';
import { buildPresetPortfolio } from '@/pages/Main/utils';
import { ANALYTICS_EVENT, trackEvent } from '@/shared/lib/analytics';
import type { PortfolioPresetPlaceholder } from '../components';

type PortfolioPresetApplyDeps = {
  activeScenarioId: string;
  renameScenarioTab: (scenarioId: string, name: string) => void;
  setTickerProfiles: (profiles: TickerProfile[]) => void;
  setIncludedTickerIds: (ids: string[]) => void;
  setSelectedTickerId: (id: string | null) => void;
  setWeightByTickerId: (weights: Record<string, number>) => void;
  setFixedByTickerId: (fixed: Record<string, boolean>) => void;
  setShowPortfolioDividendCenter: (show: boolean) => void;
  setYieldFormValues: (update: (prev: YieldFormValues) => YieldFormValues) => void;
};

export type PortfolioPresetApply = {
  /** 확인 모달이 떠 있는 대상(없으면 `null`). */
  pendingPreset: PortfolioPresetPlaceholder | null;
  /** 프리셋 카드 클릭 — 바로 적용하지 않고 확인을 먼저 받는다. */
  requestApply: (preset: PortfolioPresetPlaceholder) => void;
  cancelApply: () => void;
  confirmApply: () => void;
  /**
   * 확인 모달 없이 **조용히** 적용한다(첫 방문 기본 시나리오 프리필 전용).
   * 계측을 쏘지 않는 이유는 아래 `applyPreset` 주석 참고.
   */
  applyPresetSilently: (preset: PortfolioPresetPlaceholder) => void;
};

/**
 * 추천 포트폴리오 프리셋 적용.
 *
 * **확인 모달을 한 번 거치는 것이 핵심**이다 — 모바일에서 스크롤 중 실수로 카드를 눌러 사용자가
 * 만들던 포트폴리오가 통째로 덮이는 사고를 막는다. 쓰기는 전부 기존 setter를 그대로 타므로
 * 자동저장·클라우드 동기화 경로가 바뀌지 않는다.
 */
export function usePortfolioPresetApply(deps: PortfolioPresetApplyDeps): PortfolioPresetApply {
  const {
    activeScenarioId,
    renameScenarioTab,
    setTickerProfiles,
    setIncludedTickerIds,
    setSelectedTickerId,
    setWeightByTickerId,
    setFixedByTickerId,
    setShowPortfolioDividendCenter,
    setYieldFormValues
  } = deps;

  const [pendingPreset, setPendingPreset] = useState<PortfolioPresetPlaceholder | null>(null);

  /**
   * 프리셋을 워크스페이스에 커밋한다.
   *
   * `isUserChoice` 는 **계측 게이트**다. `preset_applied` 는 "프리셋 인기 순위"의 모수이고
   * `cta_click`(apply_portfolio_preset)은 클릭 수라, 첫 방문에 앱이 대신 적용하는
   * 기본 시나리오(프리필)까지 여기 섞이면 **모든 방문이 한 프리셋에 1표씩 주는 꼴**이 되어
   * 순위가 통째로 무의미해진다. 그래서 프리필은 **미발화**를 골랐다
   * (`source:'prefill'` 파라미터 추가안은 기각 — 기존 대시보드·탐색 질의가 그 파라미터를
   *  필터링하지 않아 "필터를 안 걸면 틀린 값"이 되고, 그건 조용히 틀리는 쪽이다).
   * 상태 쓰기 경로는 사용자 선택과 **완전히 동일**하다.
   */
  const applyPreset = useCallback(
    (preset: PortfolioPresetPlaceholder, { isUserChoice = true }: { isUserChoice?: boolean } = {}) => {
      const nextPortfolio = buildPresetPortfolio({ preset, universe: DIVIDEND_UNIVERSE });
      if (!nextPortfolio) return;

      if (isUserChoice) {
        trackEvent(ANALYTICS_EVENT.CTA_CLICK, {
          cta_name: 'apply_portfolio_preset',
          placement: 'empty_result_preset_grid',
          preset_id: preset.id
        });
        trackEvent(ANALYTICS_EVENT.PRESET_APPLIED, {
          preset_id: preset.id,
          ticker_count: nextPortfolio.profiles.length
        });
      }

      setTickerProfiles(nextPortfolio.profiles);
      setIncludedTickerIds(nextPortfolio.includedIds);
      setSelectedTickerId(nextPortfolio.selectedTickerId);
      setWeightByTickerId(nextPortfolio.weightByTickerId);
      setFixedByTickerId(nextPortfolio.fixedByTickerId);
      setShowPortfolioDividendCenter(true);
      renameScenarioTab(activeScenarioId, nextPortfolio.scenarioName);
      setYieldFormValues((prev) => ({ ...prev, ...nextPortfolio.formPatch }));
    },
    [
      activeScenarioId,
      renameScenarioTab,
      setFixedByTickerId,
      setIncludedTickerIds,
      setSelectedTickerId,
      setShowPortfolioDividendCenter,
      setTickerProfiles,
      setWeightByTickerId,
      setYieldFormValues
    ]
  );

  const cancelApply = useCallback(() => setPendingPreset(null), []);
  const confirmApply = useCallback(() => {
    if (pendingPreset) applyPreset(pendingPreset);
    setPendingPreset(null);
  }, [applyPreset, pendingPreset]);
  const applyPresetSilently = useCallback(
    (preset: PortfolioPresetPlaceholder) => applyPreset(preset, { isUserChoice: false }),
    [applyPreset]
  );

  return { pendingPreset, requestApply: setPendingPreset, cancelApply, confirmApply, applyPresetSilently };
}
