import { useCallback, useMemo } from 'react';
import type { MouseEvent } from 'react';
import type { TickerDraft, TickerProfile } from '@/shared/types/snowball';
import {
  useAllocationPercentExactByTickerIdAtomValue,
  useCurrentHelpAtomValue,
  useDisplayCurrencyViewAtomValue,
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
  NEW_TICKER_WEIGHT,
  applyTickerAmount,
  applyTickerRemoval,
  buildTickerProfileFromDraft,
  createTickerId,
  isTickerDraftValid,
  redistributeAllocationWeights,
  toAmountFromShares,
  toTickerDraft,
  type TickerPortfolioState,
  type TickerRemovalMode
} from '@/pages/Main/utils';
import { toKrwUnitPrice } from '@/shared/lib/tickerPrice';
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
  /* 환율은 주식 수 ↔ 금액 환산에만 쓴다 — 미국 상장 종목의 주가가 달러 숫자라서다. */
  const displayCurrency = useDisplayCurrencyViewAtomValue();
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
    /*
     * 🔴 파라미터 이름이 `source` 가 아니라 `placement` 다(2026-08-22 교체).
     *
     * GA4 는 `source` 를 **유입 출처 귀속**에 쓰는 이름으로 취급한다. 이벤트 파라미터로 실어 보내면
     * 그 세션의 출처가 이 값으로 덮인다 — 실측에서 `sessionSource = main_left_panel` 19세션,
     * `ticker_chip` 3세션이 **가짜 유입**으로 잡혀 있었다(28일 기준 약 28세션). 세션 수가 부풀고,
     * "사람들이 어디서 오는가"라는 질문의 답이 통째로 오염된다.
     *
     * `placement` 는 이 레포가 이미 쓰고 있는 이름이고(바로 위 cta_click), GA4 예약 의미가 없다.
     * ⚠ 이름을 바꿨으므로 이 이벤트의 **그 이전 데이터와 시계열이 끊긴다.** 지금(데이터가 적을 때)이
     *   바꾸기 가장 싼 시점이라 감수한 것이다 — 되돌리지 마라.
     */
    trackEvent(ANALYTICS_EVENT.TICKER_CREATE_STARTED, {
      placement: 'main_left_panel'
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
        ...Object.fromEntries(newIds.map((id) => [id, NEW_TICKER_WEIGHT]))
      }));
      setFixedByTickerId((prev: Record<string, boolean>) => ({
        ...prev,
        ...Object.fromEntries(newIds.map((id) => [id, false]))
      }));
      setSelectedTickerId(profiles[0].id);
      applyTickerProfile(profiles[0]);

      profiles.forEach((profile, index) => {
        /*
         * 🔴 `source` 가 아니라 `origin` 이다(2026-08-22 교체). GA4 는 `source` 를 유입 출처 귀속에
         * 쓰므로, 이벤트 파라미터로 실으면 세션 출처가 이 값으로 덮인다 — 실측에서
         * `sessionSource = preset` 4세션, `custom` 2세션이 가짜 유입으로 잡혀 있었다.
         * ⚠ 이름을 바꿨으므로 이 이벤트의 그 이전 데이터와 시계열이 끊긴다(감수한 교체다).
         */
        const origin = items[index]?.isCustomPreset ? 'custom' : 'preset';
        trackEvent(ANALYTICS_EVENT.TICKER_SAVED, { mode: 'create', ticker: profile.ticker, origin });
        trackEvent(ANALYTICS_EVENT.TICKER_INCLUDED, { ticker: profile.ticker, origin });
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
      setWeightByTickerId((prev: Record<string, number>) => ({ ...prev, [profile.id]: NEW_TICKER_WEIGHT }));
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

      /*
       * 🔴 **빠지는 종목의 금액만큼 초기 투자금이 줄어든다** (2026-08-23 사용자 결정).
       *
       * 종전에는 총액을 예산처럼 고정해 두고 남은 종목에 재분배했다. 금액만 다루던 시절에는
       * 자연스러웠지만, 주식 수는 절대량이라 그 규칙과 충돌한다 — SCHD 5,000주 · QQQ 5,000주에서
       * QQQ 를 빼면 SCHD 가 총액을 통째로 받아 **73,016주**가 됐다(14.6배).
       *
       * 그 종목의 금액을 0 으로 두는 것이 곧 "예산에서 뺀다"이므로 `applyTickerAmount` 를 그대로
       * 쓴다 — 남은 종목 금액은 건드리지 않고 총액만 줄어드는 것이 그 함수의 정의다.
       */
      const released = applyTickerAmount({
        targetId: removingTickerId,
        nextAmount: 0,
        includedIds: includedProfiles.map((profile) => profile.id),
        percentExactById: allocationPercentExactByTickerId,
        totalAmount: values.initialInvestment
      });

      if (mode === 'delete') {
        setTickerProfiles(next.tickerProfiles);
        /* 비중을 먼저 반영하고 **그다음** 삭제 키를 지운다 — 순서를 뒤집으면 지운 키가 되살아난다. */
        const nextWeights = { ...next.weightByTickerId, ...released.percentById };
        delete nextWeights[removingTickerId];
        setWeightByTickerId(nextWeights);
      } else {
        setWeightByTickerId((prev: Record<string, number>) => ({ ...prev, ...released.percentById }));
      }
      setYieldFormValues((prev) => ({ ...prev, initialInvestment: released.totalAmount }));
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
    [
      allocationPercentExactByTickerId,
      applyTickerProfile,
      includedProfiles,
      portfolioState,
      setFixedByTickerId,
      setIncludedTickerIds,
      setSelectedTickerId,
      setTickerProfiles,
      setWeightByTickerId,
      setYieldFormValues,
      values.initialInvestment
    ]
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
      // 🔴 `source` 금지 — GA4 유입 출처를 덮는다(위 openTickerModal 주석에 실측 근거).
      trackEvent(ANALYTICS_EVENT.TICKER_SELECTED, {
        ticker: profile.ticker,
        placement: 'ticker_chip'
      });
      setSelectedTickerId(profile.id);
      applyTickerProfile(profile);
      return;
    }

    // 🔴 `source` 금지 — 같은 이유.
    trackEvent(ANALYTICS_EVENT.TICKER_INCLUDED, {
      ticker: profile.ticker,
      placement: 'ticker_chip'
    });
    setIncludedTickerIds((prev: string[]) => [...prev, profile.id]);
    /* 다시 담는 것도 새로 담는 것과 같다 — 예전 비중을 되살리면 총액이 저절로 늘어난다. */
    setWeightByTickerId((weights: Record<string, number>) => ({ ...weights, [profile.id]: NEW_TICKER_WEIGHT }));
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

  /**
   * 종목의 **보유 주식 수**를 직접 정한다 — 슬라이더와 같은 배분을 반대 방향에서 만지는 입력이다.
   *
   * 슬라이더(`setTickerWeight`)는 총 투자금을 고정하고 몫만 나누는 **상대량**이고, 여기는 다른 종목을
   * 건드리지 않고 이 종목의 크기만 바꾸는 **절대량**이다. 그래서 총 투자금이 따라 움직이고 비중이
   * 다시 계산된다(규칙과 근거는 `applyTickerAmount` 머리말).
   *
   * ⚠ 고정 핀을 보지 않는다. 핀은 "슬라이더를 끌 때 안 움직인다"는 뜻이라 자기 절대량 입력과
   *   충돌하지 않는다 — `setTickerWeight` 첫 줄의 `fixedByTickerId` 가드를 여기 복사하면
   *   핀을 걸어 둔 종목의 주식 수를 영영 못 고치게 된다.
   */
  const setTickerShares = useCallback((profileId: string, shares: number) => {
    const targetProfile = includedProfiles.find((item) => item.id === profileId);
    if (!targetProfile) return;

    /*
     * 🔴 주가를 **원 단위로 되맞춰** 곱한다. 프리셋이 미국 종목의 달러 가격을 그대로 담고 있어서
     *    원가격으로 곱하면 6000주가 25억이 아니라 181만원이 된다(`toKrwUnitPrice` 머리말의 신고 사례).
     * ⚠ 환율이 없으면 **아무것도 하지 않는다.** 화면이 이미 입력을 잠그고 사유를 말하고 있으므로
     *   (`AllocationHoldings.hasUnpricedShares`) 여기까지 오는 것은 정상 경로가 아니다 —
     *   그래도 틀린 값을 쓰는 것보다 안 쓰는 쪽이 낫다.
     */
    const krwUnitPrice = toKrwUnitPrice({
      ticker: targetProfile.ticker,
      price: targetProfile.initialPrice,
      fxRate: displayCurrency.rate
    });
    if (krwUnitPrice === null) return;

    const { totalAmount, percentById } = applyTickerAmount({
      targetId: profileId,
      nextAmount: toAmountFromShares(shares, krwUnitPrice),
      includedIds: includedProfiles.map((profile) => profile.id),
      percentExactById: allocationPercentExactByTickerId,
      totalAmount: values.initialInvestment
    });

    setWeightByTickerId((prev: Record<string, number>) => ({ ...prev, ...percentById }));
    /* 총 투자금은 폼 값이다 — 비중만 고치면 종목 금액이 원하는 값으로 서지 않는다(둘은 한 쌍이다). */
    setYieldFormValues((prev) => ({ ...prev, initialInvestment: totalAmount }));

    trackEvent(ANALYTICS_EVENT.ALLOCATION_CHANGED, {
      action: 'set_shares',
      ticker: targetProfile.ticker,
      ticker_id: profileId,
      weight_percent: Math.round((percentById[profileId] ?? 0) * 10) / 10
    });
  }, [allocationPercentExactByTickerId, displayCurrency.rate, includedProfiles, setWeightByTickerId, setYieldFormValues, values.initialInvestment]);

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
    setTickerShares,
    setTickerWeight,
    toggleTickerFixed,
    clearAllFixed
  };
};
