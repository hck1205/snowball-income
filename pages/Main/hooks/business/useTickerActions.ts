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
import { ANALYTICS_EVENT, setUserProperties, trackEvent } from '@/shared/lib/analytics';

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

  /**
   * 담은 목록을 **한 번에** 생성한다(2026-08-10 다중 생성).
   *
   * 🔴 상태 갱신을 항목마다 반복하지 않고 배열을 한 번에 만들어 한 번씩만 쓴다 — 항목마다
   *    `setTickerProfiles` 를 부르면 각 업데이터가 직전 결과를 못 보고 겹칠 위험(그리고 리렌더
   *    N배)이 있다.
   * 🔴 담은 **순서대로** 목록에 선다. 화면의 목록은 최신이 위이므로 profiles/included 에 넣을 때
   *    새 항목 묶음을 앞에 붙이고, 묶음 안의 순서는 담은 순서를 지킨다.
   * ⚠ 선택(포커스)은 **첫 항목**으로 간다 — 여러 개를 만든 뒤 마지막 것이 선택되면 사용자가 방금
   *   훑어본 목록의 맨 위와 어긋난다.
   */
  const saveTickers = useCallback(
    (items: readonly { draft: TickerDraft; isCustomPreset: boolean }[]) => {
      const profiles = items
        .filter((item) => isTickerDraftValid(item.draft))
        .map((item) =>
          buildTickerProfileFromDraft({
            draft: item.draft,
            mode: 'create',
            isCustomPreset: item.isCustomPreset,
            editingTickerId: null,
            generateId: createTickerId
          })
        );

      if (profiles.length === 0) return;

      const newIds = profiles.map((profile) => profile.id);
      setTickerProfiles((prev: TickerProfile[]) => [...profiles, ...prev]);
      setIncludedTickerIds((prev: string[]) => [...newIds, ...prev]);
      setWeightByTickerId((prev: Record<string, number>) => ({
        ...prev,
        ...Object.fromEntries(newIds.map((id) => [id, 1]))
      }));
      setFixedByTickerId((prev: Record<string, boolean>) => ({
        ...prev,
        ...Object.fromEntries(newIds.map((id) => [id, false]))
      }));
      setSelectedTickerId(profiles[0].id);
      applyTickerProfile(profiles[0]);

      profiles.forEach((profile, index) => {
        const source = items[index]?.isCustomPreset ? 'custom' : 'preset';
        trackEvent(ANALYTICS_EVENT.TICKER_SAVED, { mode: 'create', ticker: profile.ticker, source });
        trackEvent(ANALYTICS_EVENT.TICKER_INCLUDED, { ticker: profile.ticker, source });
      });
      setUserProperties({ has_saved: true });

      closeTickerModal();
    },
    [
      applyTickerProfile,
      closeTickerModal,
      setFixedByTickerId,
      setIncludedTickerIds,
      setSelectedTickerId,
      setTickerProfiles,
      setWeightByTickerId
    ]
  );

  const saveTicker = useCallback((drafts?: readonly { draft: TickerDraft; isCustomPreset: boolean }[]) => {
    /* 목록이 실려 오면 다중 생성 경로다(수정 모드는 인자 없이 들어온다). */
    if (drafts && drafts.length > 0) {
      saveTickers(drafts);
      return;
    }

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
    // 저장한 사용자 코호트(User Property). 매번 set해도 GA4는 마지막 값(true)을 쓴다 — 멱등.
    setUserProperties({ has_saved: true });
    if (tickerModalMode === 'create') {
      trackEvent(ANALYTICS_EVENT.TICKER_INCLUDED, {
        ticker: profile.ticker,
        source: selectedPreset === 'custom' ? 'custom' : 'preset'
      });
    }

    /*
     * 🔴 여기서 설정 드로어를 닫지 않는다(2026-07-31). 종전엔 `setIsConfigDrawerOpen(false)` 가 있었는데
     *   그건 "드로어 = 화면을 덮는 모달"이던 시절의 전제였다. 드로어가 전 해상도 상시가 된 뒤로는
     *   넓은 화면에서 "종목 3개 추가 = 드로어 3번 열기"가 됐다. 지금은 티커 모달만 닫히고 드로어는
     *   그대로 남아, 방금 만든 칩이 종목 섹션에 나타나는 것을 그 자리에서 볼 수 있다.
     *   (결과가 가려지는 문제는 드로어 최상단 결과 스트립이 대신 받는다.)
     */
    closeTickerModal();
  }, [
    applyTickerProfile,
    closeTickerModal,
    editingTickerId,
    selectedTickerId,
    setFixedByTickerId,
    setIncludedTickerIds,
    setSelectedTickerId,
    setTickerProfiles,
    setWeightByTickerId,
    saveTickers,
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

    /* 저장과 같은 이유로 드로어는 열어 둔다 — 지우고 나서 다른 종목을 이어 손보는 것이 자연스럽다. */
    closeTickerModal();
  }, [closeTickerModal, editingTickerId, removeTicker, tickerModalMode]);

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

  const clearAllFixed = useCallback(() => {
    trackEvent(ANALYTICS_EVENT.ALLOCATION_CHANGED, { action: 'clear_all_fixed' });
    // 저장 스키마 불변 — 기존 키를 모두 false로 되돌린다(고정 해제 = 전 종목 재조절 가능).
    setFixedByTickerId((prev: Record<string, boolean>) => {
      const next: Record<string, boolean> = {};
      for (const key of Object.keys(prev)) next[key] = false;
      return next;
    });
  }, [setFixedByTickerId]);

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
    toggleTickerFixed,
    clearAllFixed
  };
};
