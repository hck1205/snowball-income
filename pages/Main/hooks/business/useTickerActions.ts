import { useCallback, useMemo } from 'react';
import type { MouseEvent } from 'react';
import type { TickerDraft, TickerProfile } from '@/shared/types/snowball';
import {
  useAllocationPercentExactByTickerIdAtomValue,
  useCurrentHelpAtomValue,
  useEditingTickerIdAtomValue,
  useFixedByTickerIdAtomValue,
  useIncludedProfilesAtomValue,
  useIncludedTickerIdsAtomValue,
  useIsTickerModalOpenAtomValue,
  useSelectedTickerIdAtomValue,
  useSetActiveHelpWrite,
  useSetEditingTickerIdWrite,
  useSetFixedByTickerIdWrite,
  useSetIncludedTickerIdsWrite,
  useSetIsConfigDrawerOpenWrite,
  useSetIsTickerModalOpenWrite,
  useSelectedPresetAtomValue,
  useSetSelectedPresetWrite,
  useSetSelectedTickerIdWrite,
  useSetTickerDraftWrite,
  useSetTickerModalModeWrite,
  useSetTickerProfilesWrite,
  useSetWeightByTickerIdWrite,
  useSetYieldFormWrite,
  useTickerDraftAtomValue,
  useTickerModalModeAtomValue,
  useTickerProfilesAtomValue,
  useWeightByTickerIdAtomValue,
  useYieldFormAtomValue
} from '@/jotai';
import { useLongPress } from '@/pages/Main/hooks/interaction';
import {
  applyTickerRemoval,
  buildTickerProfileFromDraft,
  createTickerId,
  isTickerDraftValid,
  redistributeAllocationWeights,
  toTickerDraft,
  type TickerPortfolioState,
  type TickerRemovalMode
} from '@/pages/Main/utils';
import { ANALYTICS_EVENT, trackEvent } from '@/shared/lib/analytics';

export const useTickerActions = () => {
  const values = useYieldFormAtomValue();
  const setYieldFormValues = useSetYieldFormWrite();
  const tickerDraft = useTickerDraftAtomValue();
  const setTickerDraft = useSetTickerDraftWrite();
  const editingTickerId = useEditingTickerIdAtomValue();
  const setEditingTickerId = useSetEditingTickerIdWrite();
  const tickerModalMode = useTickerModalModeAtomValue();
  const setTickerModalMode = useSetTickerModalModeWrite();
  const selectedTickerId = useSelectedTickerIdAtomValue();
  const setSelectedTickerId = useSetSelectedTickerIdWrite();
  const includedTickerIds = useIncludedTickerIdsAtomValue();
  const setIncludedTickerIds = useSetIncludedTickerIdsWrite();
  const tickerProfiles = useTickerProfilesAtomValue();
  const setTickerProfiles = useSetTickerProfilesWrite();
  const includedProfiles = useIncludedProfilesAtomValue();
  const fixedByTickerId = useFixedByTickerIdAtomValue();
  const setFixedByTickerId = useSetFixedByTickerIdWrite();
  const weightByTickerId = useWeightByTickerIdAtomValue();
  const setWeightByTickerId = useSetWeightByTickerIdWrite();
  const allocationPercentExactByTickerId = useAllocationPercentExactByTickerIdAtomValue();
  const currentHelp = useCurrentHelpAtomValue();
  const setActiveHelp = useSetActiveHelpWrite();
  const isTickerModalOpen = useIsTickerModalOpenAtomValue();
  const setIsTickerModalOpen = useSetIsTickerModalOpenWrite();
  const selectedPreset = useSelectedPresetAtomValue();
  const setSelectedPreset = useSetSelectedPresetWrite();
  const setIsConfigDrawerOpen = useSetIsConfigDrawerOpenWrite();

  const applyTickerProfile = useCallback((profile: TickerDraft) => {
    setYieldFormValues((prev) => ({
      ...prev,
      ticker: profile.ticker,
      initialPrice: profile.initialPrice,
      dividendYield: profile.dividendYield,
      dividendGrowth: profile.dividendGrowth,
      expectedTotalReturn: profile.expectedTotalReturn,
      frequency: profile.frequency
    }));
  }, [setYieldFormValues]);

  const openTickerModal = useCallback(() => {
    trackEvent(ANALYTICS_EVENT.CTA_CLICK, {
      cta_name: 'ticker_create_open',
      placement: 'ticker_creation_panel'
    });
    trackEvent(ANALYTICS_EVENT.TICKER_CREATE_STARTED, {
      source: 'main_left_panel'
    });
    setTickerDraft({
      ticker: '',
      name: '',
      initialPrice: 0,
      dividendYield: 0,
      dividendGrowth: 0,
      expectedTotalReturn: 0,
      frequency: values.frequency
    });
    setSelectedPreset('custom');
    setTickerModalMode('create');
    setEditingTickerId(null);
    setIsTickerModalOpen(true);
  }, [setEditingTickerId, setIsTickerModalOpen, setSelectedPreset, setTickerDraft, setTickerModalMode, values]);

  const openTickerEditModal = useCallback((profile: TickerProfile) => {
    trackEvent(ANALYTICS_EVENT.CTA_CLICK, {
      cta_name: 'ticker_edit_open',
      placement: 'ticker_chip',
      ticker: profile.ticker
    });
    setTickerDraft(toTickerDraft(profile));
    setSelectedPreset('custom');
    setTickerModalMode('edit');
    setEditingTickerId(profile.id);
    setIsTickerModalOpen(true);
  }, [setEditingTickerId, setIsTickerModalOpen, setSelectedPreset, setTickerDraft, setTickerModalMode]);

  const closeTickerModal = useCallback(() => {
    setIsTickerModalOpen(false);
    setTickerModalMode('create');
    setEditingTickerId(null);
  }, [setEditingTickerId, setIsTickerModalOpen, setTickerModalMode]);

  const closeHelp = useCallback(() => setActiveHelp(null), [setActiveHelp]);
  const openHelpExpectedTotalReturn = useCallback(() => {
    trackEvent(ANALYTICS_EVENT.CTA_CLICK, {
      cta_name: 'open_help_expected_total_return',
      placement: 'ticker_modal'
    });
    setActiveHelp('expectedTotalReturn');
  }, [setActiveHelp]);

  const handleBackdropClick = useCallback((event: MouseEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    if (currentHelp) closeHelp();
    if (isTickerModalOpen) closeTickerModal();
  }, [closeHelp, closeTickerModal, currentHelp, isTickerModalOpen]);

  const saveTicker = useCallback(() => {
    if (!isTickerDraftValid(tickerDraft)) return;

    const profile = buildTickerProfileFromDraft({
      draft: tickerDraft,
      mode: tickerModalMode,
      isCustomPreset: selectedPreset === 'custom',
      editingTickerId,
      generateId: createTickerId
    });

    if (tickerModalMode === 'edit') {
      setTickerProfiles((prev: TickerProfile[]) => prev.map((item) => (item.id === profile.id ? profile : item)));
      if (selectedTickerId === profile.id) {
        applyTickerProfile(profile);
      }
    } else {
      setTickerProfiles((prev: TickerProfile[]) => [profile, ...prev]);
      setSelectedTickerId(profile.id);
      setIncludedTickerIds((prev: string[]) => [profile.id, ...prev]);
      setWeightByTickerId((prev: Record<string, number>) => ({ ...prev, [profile.id]: 1 }));
      setFixedByTickerId((prev: Record<string, boolean>) => ({ ...prev, [profile.id]: false }));
      applyTickerProfile(profile);
    }

    trackEvent(ANALYTICS_EVENT.TICKER_SAVED, {
      mode: tickerModalMode,
      ticker: profile.ticker,
      source: selectedPreset === 'custom' ? 'custom' : 'preset'
    });
    if (tickerModalMode === 'create') {
      trackEvent(ANALYTICS_EVENT.TICKER_INCLUDED, {
        ticker: profile.ticker,
        source: selectedPreset === 'custom' ? 'custom' : 'preset'
      });
    }

    setIsConfigDrawerOpen(false);
    closeTickerModal();
  }, [
    applyTickerProfile,
    closeTickerModal,
    editingTickerId,
    selectedTickerId,
    setFixedByTickerId,
    setIncludedTickerIds,
    setIsConfigDrawerOpen,
    setSelectedTickerId,
    setTickerProfiles,
    setWeightByTickerId,
    tickerDraft,
    tickerModalMode,
    selectedPreset
  ]);

  const portfolioState = useMemo<TickerPortfolioState>(
    () => ({
      tickerProfiles,
      includedTickerIds,
      weightByTickerId,
      fixedByTickerId,
      selectedTickerId
    }),
    [fixedByTickerId, includedTickerIds, selectedTickerId, tickerProfiles, weightByTickerId]
  );

  const removeTicker = useCallback(
    (removingTickerId: string, mode: TickerRemovalMode) => {
      const next = applyTickerRemoval(portfolioState, removingTickerId, mode);

      if (mode === 'delete') {
        setTickerProfiles(next.tickerProfiles);
        setWeightByTickerId(next.weightByTickerId);
      }
      setIncludedTickerIds(next.includedTickerIds);
      setFixedByTickerId(next.fixedByTickerId);

      if (next.didChangeSelection) {
        setSelectedTickerId(next.selectedTickerId);
        if (next.nextSelectedProfile) {
          applyTickerProfile(next.nextSelectedProfile);
        }
      }

      return next;
    },
    [applyTickerProfile, portfolioState, setFixedByTickerId, setIncludedTickerIds, setSelectedTickerId, setTickerProfiles, setWeightByTickerId]
  );

  const deleteTicker = useCallback(() => {
    if (tickerModalMode !== 'edit' || !editingTickerId) return;

    const next = removeTicker(editingTickerId, 'delete');

    trackEvent(ANALYTICS_EVENT.TICKER_DELETED, {
      ticker: next.removedProfile?.ticker ?? '',
      mode: tickerModalMode
    });

    setIsConfigDrawerOpen(false);
    closeTickerModal();
  }, [closeTickerModal, editingTickerId, removeTicker, setIsConfigDrawerOpen, tickerModalMode]);

  const toggleIncludeTicker = useCallback((profile: TickerProfile) => {
    const isIncluded = includedTickerIds.includes(profile.id);

    if (isIncluded) {
      // Included ticker chips act as "select" only; removal is handled by right-side x button or modal delete.
      trackEvent(ANALYTICS_EVENT.TICKER_SELECTED, {
        ticker: profile.ticker,
        source: 'ticker_chip'
      });
      setSelectedTickerId(profile.id);
      applyTickerProfile(profile);
      return;
    }

    trackEvent(ANALYTICS_EVENT.TICKER_INCLUDED, {
      ticker: profile.ticker,
      source: 'ticker_chip'
    });
    setIncludedTickerIds((prev: string[]) => [...prev, profile.id]);
    setWeightByTickerId((weights: Record<string, number>) => ({ ...weights, [profile.id]: weights[profile.id] ?? 1 }));
    setFixedByTickerId((fixed: Record<string, boolean>) => ({ ...fixed, [profile.id]: fixed[profile.id] ?? false }));
    setSelectedTickerId(profile.id);
    applyTickerProfile(profile);
  }, [applyTickerProfile, includedTickerIds, setFixedByTickerId, setIncludedTickerIds, setSelectedTickerId, setWeightByTickerId]);

  const removeIncludedTicker = useCallback((profileId: string) => {
    const targetProfile = tickerProfiles.find((item) => item.id === profileId);
    trackEvent(ANALYTICS_EVENT.ALLOCATION_CHANGED, {
      action: 'remove_included_ticker',
      ticker: targetProfile?.ticker ?? '',
      ticker_id: profileId
    });
    removeTicker(profileId, 'exclude');
  }, [removeTicker, tickerProfiles]);

  const setTickerWeight = useCallback((profileId: string, value: number) => {
    if (fixedByTickerId[profileId]) return;

    const nextMap = redistributeAllocationWeights({
      targetId: profileId,
      rawValue: value,
      includedIds: includedProfiles.map((profile) => profile.id),
      fixedById: fixedByTickerId,
      percentExactById: allocationPercentExactByTickerId
    });

    setWeightByTickerId((prev: Record<string, number>) => ({ ...prev, ...nextMap }));
    const targetProfile = includedProfiles.find((item) => item.id === profileId);
    trackEvent(ANALYTICS_EVENT.ALLOCATION_CHANGED, {
      action: 'set_weight',
      ticker: targetProfile?.ticker ?? '',
      ticker_id: profileId,
      weight_percent: Math.round((nextMap[profileId] ?? 0) * 10) / 10
    });
  }, [allocationPercentExactByTickerId, fixedByTickerId, includedProfiles, setWeightByTickerId]);

  const toggleTickerFixed = useCallback((profileId: string) => {
    const nextIsFixed = !fixedByTickerId[profileId];
    const targetProfile = includedProfiles.find((item) => item.id === profileId);
    trackEvent(ANALYTICS_EVENT.ALLOCATION_CHANGED, {
      action: 'toggle_fixed',
      ticker: targetProfile?.ticker ?? '',
      ticker_id: profileId,
      is_fixed: nextIsFixed
    });
    setFixedByTickerId((prev: Record<string, boolean>) => ({ ...prev, [profileId]: !prev[profileId] }));
  }, [fixedByTickerId, includedProfiles, setFixedByTickerId]);

  const { consumeTriggered, handlePressEnd, handlePressStart } = useLongPress<TickerProfile>({
    delayMs: 550,
    onLongPress: openTickerEditModal
  });

  const handleTickerChipClick = useCallback((profile: TickerProfile) => {
    if (consumeTriggered()) return;
    toggleIncludeTicker(profile);
  }, [consumeTriggered, toggleIncludeTicker]);

  const handleTickerPressStart = useCallback((profile: TickerProfile) => {
    handlePressStart(profile);
  }, [handlePressStart]);

  const handleTickerPressEnd = useCallback(() => {
    handlePressEnd();
  }, [handlePressEnd]);

  return {
    closeHelp,
    closeTickerModal,
    deleteTicker,
    handleBackdropClick,
    handleTickerChipClick,
    handleTickerPressEnd,
    handleTickerPressStart,
    openTickerEditModal,
    openHelpExpectedTotalReturn,
    openTickerModal,
    removeIncludedTicker,
    saveTicker,
    setTickerWeight,
    toggleTickerFixed
  };
};
