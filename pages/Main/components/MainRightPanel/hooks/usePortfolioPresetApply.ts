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

  const applyPreset = useCallback(
    (preset: PortfolioPresetPlaceholder) => {
      const nextPortfolio = buildPresetPortfolio({ preset, universe: DIVIDEND_UNIVERSE });
      if (!nextPortfolio) return;

      trackEvent(ANALYTICS_EVENT.CTA_CLICK, {
        cta_name: 'apply_portfolio_preset',
        placement: 'empty_result_preset_grid',
        preset_id: preset.id
      });
      trackEvent(ANALYTICS_EVENT.PRESET_APPLIED, {
        preset_id: preset.id,
        ticker_count: nextPortfolio.profiles.length
      });

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

  return { pendingPreset, requestApply: setPendingPreset, cancelApply, confirmApply };
}
