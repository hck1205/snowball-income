import { useCallback } from 'react';
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
  useYieldFormAtomValue
} from '@/jotai';
import { useLongPress } from '@/pages/Main/hooks/interaction';
import { toTickerDraft } from '@/pages/Main/utils';
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
    const tickerName = tickerDraft.ticker.trim();
    const displayName = tickerDraft.name.trim();
    const normalizedName = tickerModalMode === 'create' && selectedPreset !== 'custom' ? '' : displayName;
    const hasInvalidNumericValue = ![
      tickerDraft.initialPrice,
      tickerDraft.dividendYield,
      tickerDraft.dividendGrowth,
      tickerDraft.expectedTotalReturn
    ].every((value) => Number.isFinite(value));
    if (!tickerName || hasInvalidNumericValue) return;

    const profile: TickerProfile = {
      ...tickerDraft,
      ticker: tickerName,
      name: normalizedName,
      id: editingTickerId ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    };

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

  const deleteTicker = useCallback(() => {
    if (tickerModalMode !== 'edit' || !editingTickerId) return;

    const deletingId = editingTickerId;
    const deletingProfile = tickerProfiles.find((profile) => profile.id === deletingId);
    const nextProfiles = tickerProfiles.filter((profile) => profile.id !== deletingId);
    const nextIncludedIds = includedTickerIds.filter((id) => id !== deletingId);
    const fallbackSelectedId = nextIncludedIds[0] ?? null;

    setTickerProfiles(nextProfiles);
    setIncludedTickerIds(nextIncludedIds);
    setWeightByTickerId((prev: Record<string, number>) => {
      const next = { ...prev };
      delete next[deletingId];
      return next;
    });
    setFixedByTickerId((prev: Record<string, boolean>) => {
      const next = { ...prev };
      delete next[deletingId];
      return next;
    });

    if (selectedTickerId === deletingId) {
      setSelectedTickerId(fallbackSelectedId);
      const fallbackProfile = nextProfiles.find((profile) => profile.id === fallbackSelectedId);
      if (fallbackProfile) {
        applyTickerProfile(fallbackProfile);
      }
    }

    trackEvent(ANALYTICS_EVENT.TICKER_DELETED, {
      ticker: deletingProfile?.ticker ?? '',
      mode: tickerModalMode
    });

    setIsConfigDrawerOpen(false);
    closeTickerModal();
  }, [
    applyTickerProfile,
    closeTickerModal,
    editingTickerId,
    includedTickerIds,
    selectedTickerId,
    setFixedByTickerId,
    setIncludedTickerIds,
    setIsConfigDrawerOpen,
    setSelectedTickerId,
    setTickerProfiles,
    setWeightByTickerId,
    tickerModalMode,
    tickerProfiles
  ]);

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
    const nextIncludedIds = includedTickerIds.filter((id) => id !== profileId);
    const targetProfile = tickerProfiles.find((item) => item.id === profileId);
    trackEvent(ANALYTICS_EVENT.ALLOCATION_CHANGED, {
      action: 'remove_included_ticker',
      ticker: targetProfile?.ticker ?? '',
      ticker_id: profileId
    });
    setIncludedTickerIds(nextIncludedIds);
    setFixedByTickerId((prev: Record<string, boolean>) => ({ ...prev, [profileId]: false }));

    if (selectedTickerId === profileId) {
      const nextSelectedId = nextIncludedIds[0] ?? null;
      setSelectedTickerId(nextSelectedId);
      if (nextSelectedId) {
        const nextProfile = tickerProfiles.find((item) => item.id === nextSelectedId);
        if (nextProfile) {
          applyTickerProfile(nextProfile);
        }
      }
    }
  }, [applyTickerProfile, includedTickerIds, selectedTickerId, setFixedByTickerId, setIncludedTickerIds, setSelectedTickerId, tickerProfiles]);

  const setTickerWeight = useCallback((profileId: string, value: number) => {
    if (fixedByTickerId[profileId]) return;

    const nextTarget = Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 0;
    const fixedIds = includedProfiles
      .filter((profile) => fixedByTickerId[profile.id] && profile.id !== profileId)
      .map((profile) => profile.id);
    const otherMutableIds = includedProfiles
      .filter((profile) => !fixedByTickerId[profile.id] && profile.id !== profileId)
      .map((profile) => profile.id);

    const fixedSum = fixedIds.reduce((sum, id) => sum + (allocationPercentExactByTickerId[id] ?? 0), 0);
    const maxTarget = Math.max(0, 100 - fixedSum);
    const targetValue = otherMutableIds.length === 0 ? maxTarget : Math.min(nextTarget, maxTarget);
    const remaining = Math.max(0, maxTarget - targetValue);

    const nextMap: Record<string, number> = {};
    fixedIds.forEach((id) => {
      nextMap[id] = allocationPercentExactByTickerId[id] ?? 0;
    });
    nextMap[profileId] = targetValue;

    if (otherMutableIds.length > 0) {
      const otherBase = otherMutableIds.reduce((sum, id) => sum + (allocationPercentExactByTickerId[id] ?? 0), 0);
      if (otherBase === 0) {
        const equalWeight = remaining / otherMutableIds.length;
        otherMutableIds.forEach((id) => {
          nextMap[id] = equalWeight;
        });
      } else {
        otherMutableIds.forEach((id) => {
          nextMap[id] = (remaining * (allocationPercentExactByTickerId[id] ?? 0)) / otherBase;
        });
      }
    }

    setWeightByTickerId((prev: Record<string, number>) => ({ ...prev, ...nextMap }));
    const targetProfile = includedProfiles.find((item) => item.id === profileId);
    trackEvent(ANALYTICS_EVENT.ALLOCATION_CHANGED, {
      action: 'set_weight',
      ticker: targetProfile?.ticker ?? '',
      ticker_id: profileId,
      weight_percent: Math.round(targetValue * 10) / 10
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
