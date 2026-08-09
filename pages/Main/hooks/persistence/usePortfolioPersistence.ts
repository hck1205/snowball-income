import { useEffect, useMemo, useRef, useState } from 'react';
import {
  normalizePersistedAppState,
  readPersistedAppState,
  serializeMeaningfulPayload,
  useActiveScenarioIdAtomValue,
  useFixedByTickerIdAtomValue,
  useIncludedTickerIdsAtomValue,
  useIsResultCompactAtomValue,
  useIsYearlyAreaFillOnAtomValue,
  useScenarioTabsAtomValue,
  useSelectedTickerIdAtomValue,
  useSetActiveScenarioIdWrite,
  useSetIsResultCompactWrite,
  useSetIsYearlyAreaFillOnWrite,
  useSetFixedByTickerIdWrite,
  useSetIncludedTickerIdsWrite,
  useSetScenarioTabsWrite,
  useSetShowPortfolioDividendCenterWrite,
  useSetSelectedTickerIdWrite,
  useSetShowQuickEstimateWrite,
  useSetShowSplitGraphsWrite,
  useSetTickerProfilesWrite,
  useSetVisibleYearlySeriesWrite,
  useSetWeightByTickerIdWrite,
  useSetYieldFormWrite,
  useScenarioPrefillAtomValue,
  useSetScenarioPrefillWrite,
  useSetShareLinkFailureWrite,
  useShowPortfolioDividendCenterAtomValue,
  useShowQuickEstimateAtomValue,
  useShowSplitGraphsAtomValue,
  useTickerProfilesAtomValue,
  useVisibleYearlySeriesAtomValue,
  useWeightByTickerIdAtomValue,
  useYieldFormAtomValue,
  type PersistedAppStatePayload,
  type PersistedInvestmentSettings,
  type PersistedScenarioState,
  writePersistedAppState
} from '@/jotai';
import type { PortfolioPersistedState } from '@/shared/types/snowball';
import { createSessionLocalAutosaveCache, useCloudSync } from '@/jotai/snowball/cloud';
/*
 * 🔴 `createSharedSnapshot` 은 **일부러 안 가져온다**(2026-08-09). 공유 링크의 DB 쓰기 경로를 닫았다 —
 * 근거는 아래 `createShareLink` 주석. `fetchSharedSnapshot`(읽기)은 이미 나간 `?s=` 링크를 여는 데
 * 계속 쓰이므로 그대로다.
 */
import { fetchSharedSnapshot, getSupabaseClient } from '@/shared/lib/supabase';
import { ANALYTICS_EVENT, setUserProperties, trackEvent } from '@/shared/lib/analytics';
import { DEFAULT_PREFILL_PRESET_ID } from '@/pages/Main/utils';
import { shouldRequestScenarioPrefill } from './scenarioPrefill';
import { buildScenariosSnapshot, isSameScenarioContent, mergeSharedScenarioIntoTabs } from './scenarioSnapshot';
import { decodeSharedScenarioResult, encodeSharedScenario, SHARED_SCENARIO_ID, SHARE_LENGTH_LIMIT } from './shareLink';
import {
  buildShareUrl,
  readDbShareKeyFromHref,
  readShareCodeFromHref,
  stripShareParams
} from './shareUrl';

/**
 * DB 공유 스냅샷의 scenario(다른 클라이언트가 쓴 값 — 신뢰 불가)를 저장 정규화 규칙으로 되돌린다.
 * lz-string 공유 경로(decodeSharedScenario)가 normalizePersistedAppState를 태우는 것과 동일 규율.
 */
const normalizeSharedSnapshotScenario = (rawScenario: PersistedScenarioState): PersistedScenarioState | null => {
  const normalized = normalizePersistedAppState({
    portfolio: rawScenario.portfolio,
    investmentSettings: rawScenario.investmentSettings,
    scenarios: [rawScenario],
    activeScenarioId: rawScenario.id
  });
  return normalized.scenarios[0] ?? null;
};

const SHARED_SCENARIO_NAME = '공유된 탭';

export const usePortfolioPersistence = () => {
  const tickerProfiles = useTickerProfilesAtomValue();
  const includedTickerIds = useIncludedTickerIdsAtomValue();
  const weightByTickerId = useWeightByTickerIdAtomValue();
  const fixedByTickerId = useFixedByTickerIdAtomValue();
  const selectedTickerId = useSelectedTickerIdAtomValue();
  const values = useYieldFormAtomValue();
  const showQuickEstimate = useShowQuickEstimateAtomValue();
  const showSplitGraphs = useShowSplitGraphsAtomValue();
  const isResultCompact = useIsResultCompactAtomValue();
  const isYearlyAreaFillOn = useIsYearlyAreaFillOnAtomValue();
  const showPortfolioDividendCenter = useShowPortfolioDividendCenterAtomValue();
  const visibleYearlySeries = useVisibleYearlySeriesAtomValue();
  const scenarioTabs = useScenarioTabsAtomValue();
  const activeScenarioId = useActiveScenarioIdAtomValue();
  /**
   * 첫 방문 기본 시나리오(프리필) 상태. non-null 이면 **아무것도 저장하지 않는다** —
   * 프리필은 앱이 대신 채운 화면이지 사용자가 만든 데이터가 아니다(아래 autosave effect·buildPayload).
   */
  const scenarioPrefill = useScenarioPrefillAtomValue();
  const setScenarioPrefill = useSetScenarioPrefillWrite();
  /**
   * 공유 링크가 열리지 못한 이유를 화면에 넘기는 통로(우패널 `ShareLinkFailureNotice`).
   * 무음 실패 금지 — 빈 시뮬레이터만 보여주면 "내 시나리오가 사라졌다"로 읽힌다.
   */
  const setShareLinkFailure = useSetShareLinkFailureWrite();

  const setTickerProfiles = useSetTickerProfilesWrite();
  const setIncludedTickerIds = useSetIncludedTickerIdsWrite();
  const setWeightByTickerId = useSetWeightByTickerIdWrite();
  const setFixedByTickerId = useSetFixedByTickerIdWrite();
  const setSelectedTickerId = useSetSelectedTickerIdWrite();
  const setShowQuickEstimate = useSetShowQuickEstimateWrite();
  const setShowSplitGraphs = useSetShowSplitGraphsWrite();
  const setIsResultCompact = useSetIsResultCompactWrite();
  const setIsYearlyAreaFillOn = useSetIsYearlyAreaFillOnWrite();
  const setShowPortfolioDividendCenter = useSetShowPortfolioDividendCenterWrite();
  const setVisibleYearlySeries = useSetVisibleYearlySeriesWrite();
  const setYieldFormValues = useSetYieldFormWrite();
  const setScenarioTabs = useSetScenarioTabsWrite();
  const setActiveScenarioId = useSetActiveScenarioIdWrite();

  // 클라우드 자동 저장 스케줄러(§D5, 4초 디바운스). 비로그인/오프라인 게이팅은 스케줄러가 처리하고,
  // 로컬 저장은 이 경로와 무관하게 항상 돈다 — 클라우드 skip/실패해도 로컬 데이터는 안전하다.
  const { scheduleCloudSave, flushCloudSave } = useCloudSync();

  const [isPortfolioHydrated, setIsPortfolioHydrated] = useState(false);
  /**
   * 저장된 상태를 읽지 못한 채로 자동 저장을 돌리면, 화면에 떠 있는 **기본값**이 디스크의 진짜
   * 데이터를 덮어써 버린다 (읽기 실패 → 기본값 표시 → 120ms 뒤 자동 저장 → 원본 소실).
   * 그래서 읽기에 실패하면 자동 저장을 막는다. 사용자가 직접 누르는 '저장'은 계속 허용한다.
   */
  const [hasHydrationFailed, setHasHydrationFailed] = useState(false);
  const hasAppliedShareLinkRef = useRef(false);
  /**
   * 직전에 **클라우드로 예약한** payload의 "의미있는 부분집합" 직렬화. 새 payload의 의미있는 부분이
   * 이것과 같으면(탭 전환·뷰 토글·티커 선택 등) 클라우드 스케줄을 스킵한다(무료 티어·쓰기 증폭 보호).
   * 로컬 write는 이 게이트와 무관하게 매번 전체 payload를 저장한다(뷰 상태 복원 유지).
   */
  const lastCloudMeaningfulRef = useRef<string | null>(null);
  /**
   * **대기 중인** 로컬 autosave를 즉시 실행하는 함수(없으면 null). 120ms 디바운스 타이머를 걸 때마다
   * 그 시점의 최신 클로저로 갱신되고, 저장이 실제로 실행되면 다시 null이 된다(= 대기 중인 저장 없음).
   * 언마운트 정리에서 이걸 호출해 "취소" 대신 **flush**한다(아래 언마운트 전용 effect).
   */
  const pendingAutosaveFlushRef = useRef<(() => void) | null>(null);
  /**
   * 하이드레이션이 실제로 읽어 온 워크스페이스. **프리필이 떠 있는 동안 `buildPayload()` 가 돌려주는 값**이라
   * 클라우드 세션 동기화·재시도가 "아직 아무 일도 없었다"를 보게 된다(프리필이 클라우드로 새지 않는다).
   * 프리필이 아닌 평상시에는 쓰이지 않는다.
   */
  const hydratedPayloadRef = useRef<PersistedAppStatePayload | null>(null);
  /**
   * 프리필 상태의 "의미있는" 직렬화. autosave effect 가 프리필 직후 **1회** 채우고, 이후 매 실행에서
   * 현재 워크스페이스와 비교한다 — 같으면 저장 없음, 달라지면 그 순간이 **승격**이다
   * (사용자가 무엇이든 바꿨다는 뜻). 어떤 위젯이 바꿨는지 알 필요가 없어 배선이 흩어지지 않는다.
   */
  const prefillSignatureRef = useRef<string | null>(null);
  /** effect·`buildPayload` 가 최신 프리필 단계를 읽기 위한 거울(렌더 클로저가 아니라 ref 로 본다). */
  const prefillStatusRef = useRef<'requested' | 'applied' | null>(null);
  prefillStatusRef.current = scenarioPrefill?.status ?? null;

  /**
   * 세션 시작 로컬 autosave를 **1회만** 읽어 하이드레이션과 세션시작 클라우드 sync가 공유하는 캐시.
   * 두 소비처가 각각 독립 read하던 구조는, 두 read가 불일치할 때(하이드레이션 성공+sync read 실패) 엔진이
   * 더 오래된 클라우드를 apply → app autosave가 로컬 최신본을 덮어쓰는 **유실 경로**가 있었다(캐시로 제거).
   */
  const localAutosaveCache = useMemo(() => createSessionLocalAutosaveCache(readPersistedAppState), []);

  const buildPortfolioState = (): PortfolioPersistedState => ({
    tickerProfiles,
    includedTickerIds,
    weightByTickerId,
    fixedByTickerId,
    selectedTickerId
  });

  const buildInvestmentSettings = (): PersistedInvestmentSettings => ({
    initialInvestment: values.initialInvestment,
    monthlyContribution: values.monthlyContribution,
    targetMonthlyDividend: values.targetMonthlyDividend,
    investmentStartDate: values.investmentStartDate,
    durationYears: values.durationYears,
    reinvestDividends: values.reinvestDividends,
    reinvestDividendPercent: values.reinvestDividendPercent,
    taxRate: values.taxRate,
    reinvestTiming: values.reinvestTiming,
    dpsGrowthMode: values.dpsGrowthMode,
    showQuickEstimate,
    showSplitGraphs,
    isResultCompact,
    isYearlyAreaFillOn,
    showPortfolioDividendCenter,
    visibleYearlySeries
  });

  const buildCurrentScenariosSnapshot = () =>
    buildScenariosSnapshot(scenarioTabs, activeScenarioId, {
      portfolio: buildPortfolioState(),
      investmentSettings: buildInvestmentSettings()
    });

  const buildLivePayload = (): PersistedAppStatePayload => {
    const currentPortfolio = buildPortfolioState();
    const currentInvestmentSettings = buildInvestmentSettings();
    const { scenarios, activeScenarioId: persistedActiveScenarioId } = buildCurrentScenariosSnapshot();

    return {
      portfolio: currentPortfolio,
      investmentSettings: currentInvestmentSettings,
      scenarios,
      activeScenarioId: persistedActiveScenarioId
    };
  };

  /**
   * 저장·동기화 계층이 보는 워크스페이스.
   *
   * 🔴 **프리필이 떠 있는 동안에는 하이드레이션 당시의 워크스페이스를 그대로 돌려준다** — 화면에는
   * 추천 구성이 계산돼 있지만 저장소·클라우드 입장에서는 아직 아무 일도 없었다. 이 한 지점을
   * 프리필 인지형으로 만들어 두면 클라우드 세션 동기화(`getCurrentPayload`)·저장 재시도가
   * 각자 프리필을 따로 걸러 낼 필요가 없다(빠뜨릴 자리를 만들지 않는다).
   */
  const buildPayload = (): PersistedAppStatePayload =>
    (prefillStatusRef.current !== null ? hydratedPayloadRef.current : null) ?? buildLivePayload();

  useEffect(() => {
    if (import.meta.env.MODE === 'test') {
      setIsPortfolioHydrated(true);
      return;
    }

    let cancelled = false;

    const hydrate = async () => {
      try {
        // 세션시작 클라우드 sync가 재사용할 수 있도록 캐시를 경유해 읽는다(로컬 read 1회 공유).
        const result = await localAutosaveCache.read();
        if (cancelled) return;

        if (!result.ok) {
          // 읽기 실패. 저장소는 그대로 두고(삭제 금지) 자동 저장만 잠근다.
          setHasHydrationFailed(true);
          trackEvent(ANALYTICS_EVENT.OPERATION_ERROR, {
            operation: 'hydrate_persisted_state'
          });
          return;
        }

        // 프리필이 켜져 있는 동안 저장·동기화 계층이 보게 될 "저장된 워크스페이스"를 고정한다.
        hydratedPayloadRef.current = result.payload;
        applyPersistedPayload(result.payload);
        const hasPortfolio = result.payload.scenarios.some((scenario) => scenario.portfolio.tickerProfiles.length > 0);
        if (hasPortfolio) {
          trackEvent(ANALYTICS_EVENT.RETURN_VISIT, {
            has_saved_portfolio: true,
            scenario_count: result.payload.scenarios.length
          });
          // 재방문 코호트(User Property). 저장된 포트폴리오가 있는 재방문자를 리텐션 분석용으로 태깅(멱등).
          setUserProperties({ is_returning: true, has_saved: true });
        }

        /*
         * **첫 방문 기본 시나리오 요청.** 저장된 워크스페이스가 하나도 없을 때만 켠다 —
         * 복원이 언제나 우선이고, 공유 링크(`?s=`/`?share=`)로 들어온 방문은 곧 그 시나리오가
         * 적용되므로 프리필이 끼어들면 화면이 두 번 바뀐다.
         * 여기서는 **어떤 구성을 열지(id)만** 발행하고, 실제 적용은 우패널이 한다(`usePortfolioPrefill`).
         * 이 순서가 중요하다: 표식이 먼저 켜져 있어야 프리필이 만든 상태 변화가 저장 경로에 닿지 않는다.
         */
        if (shouldRequestScenarioPrefill(result.payload, window.location.href)) {
          setScenarioPrefill({ presetId: DEFAULT_PREFILL_PRESET_ID, status: 'requested' });
        }
      } catch {
        // Keep current defaults/state when hydration fails.
        if (!cancelled) setHasHydrationFailed(true);
        trackEvent(ANALYTICS_EVENT.OPERATION_ERROR, {
          operation: 'hydrate_persisted_state'
        });
      } finally {
        if (!cancelled) setIsPortfolioHydrated(true);
      }
    };

    void hydrate();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isPortfolioHydrated) return;

    setScenarioTabs((prev) => {
      const activeIndex = prev.findIndex((tab) => tab.id === activeScenarioId);
      if (activeIndex < 0) return prev;

      const activeTab = prev[activeIndex];
      const nextContent = {
        portfolio: buildPortfolioState(),
        investmentSettings: buildInvestmentSettings()
      };

      if (isSameScenarioContent(activeTab, nextContent)) return prev;

      const next = [...prev];
      next[activeIndex] = {
        ...activeTab,
        portfolio: nextContent.portfolio,
        investmentSettings: nextContent.investmentSettings
      };
      return next;
    });
  }, [
    activeScenarioId,
    fixedByTickerId,
    includedTickerIds,
    isPortfolioHydrated,
    isResultCompact,
    isYearlyAreaFillOn,
    selectedTickerId,
    setScenarioTabs,
    showPortfolioDividendCenter,
    showQuickEstimate,
    showSplitGraphs,
    tickerProfiles,
    values.dpsGrowthMode,
    values.durationYears,
    values.initialInvestment,
    values.investmentStartDate,
    values.monthlyContribution,
    values.reinvestDividends,
    values.reinvestDividendPercent,
    values.reinvestTiming,
    values.targetMonthlyDividend,
    values.taxRate,
    visibleYearlySeries,
    weightByTickerId
  ]);

  useEffect(() => {
    // 하이드레이션 전이거나 읽기에 실패했다면 저장 자체를 걸지 않는다(화면 기본값이 디스크 원본을 덮어쓰는
    // 경로 차단). 대기 중이던 flush도 함께 비운다 — 언마운트 flush가 이 가드를 우회하면 안 된다.
    if (!isPortfolioHydrated || hasHydrationFailed) {
      pendingAutosaveFlushRef.current = null;
      return;
    }

    /*
     * 🔴 **프리필은 저장하지 않는다.** 화면에는 추천 구성이 계산돼 있지만 사용자는 아무것도 하지 않았다 —
     * 여기서 한 번이라도 write 를 걸면 다음 방문에 "내가 만든 적 없는 포트폴리오"가 복원되고,
     * 로그인 사용자라면 그것이 클라우드로 올라가 다른 기기까지 덮는다.
     *
     * 승격 판정은 **어떤 위젯이 바꿨는지가 아니라 워크스페이스가 달라졌는지**로 한다 — 프리필 직후의
     * 의미있는 직렬화를 1회 기억해 두고, 그것과 달라지는 순간 프리필 표식을 내리고 평소 경로로 돌아간다.
     * (뷰 토글만 만진 경우는 의미있는 값이 그대로라 여전히 저장하지 않는다 — 저장할 데이터가 없다.)
     */
    if (prefillStatusRef.current === 'requested') {
      // 아직 프리필이 화면에 붙기 전이다. 저장도 하지 않고 **기준도 잡지 않는다** —
      // 여기서 기준을 잡으면 비어 있던 상태가 기준이 되어, 프리필이 붙는 순간을 사용자 편집으로 오인한다.
      pendingAutosaveFlushRef.current = null;
      return;
    }

    if (prefillStatusRef.current === 'applied') {
      const liveSignature = serializeMeaningfulPayload(buildLivePayload());
      if (prefillSignatureRef.current === null) prefillSignatureRef.current = liveSignature;

      if (prefillSignatureRef.current === liveSignature) {
        // 대기 중이던 flush 도 비운다 — 언마운트 flush 가 이 가드를 우회하면 안 된다.
        pendingAutosaveFlushRef.current = null;
        return;
      }

      // 사용자가 무언가를 바꿨다 → 이제부터 평범한 워크스페이스다(배너도 함께 사라진다).
      // ref 를 **먼저** 내린다: 아래 `save` 는 120ms 뒤에 돌면서 `buildPayload()` 로 ref 를 다시 읽는데,
      // atom 쓰기가 반영되기 전이면 얼어붙은(비어 있던) payload 를 저장해 방금의 편집을 날린다.
      prefillStatusRef.current = null;
      prefillSignatureRef.current = null;
      setScenarioPrefill(null);
    }

    const save = ({ isUnmountFlush }: { isUnmountFlush: boolean }) => {
      pendingAutosaveFlushRef.current = null;

      const payload = buildPayload();
      void writePersistedAppState(payload).catch(() => {
        trackEvent(ANALYTICS_EVENT.OPERATION_ERROR, {
          operation: 'autosave_persisted_state'
        });
      });
      // 클라우드는 "의미있는" 변화가 있을 때만 예약(디바운스 4초, 로그인 상태에서만 실제 업로드).
      // 탭 전환·뷰 토글·티커 선택처럼 의미없는 변화는 직전 예약과 동일해 스킵된다(no-op 게이트).
      const meaningful = serializeMeaningfulPayload(payload);
      if (lastCloudMeaningfulRef.current !== meaningful) {
        lastCloudMeaningfulRef.current = meaningful;
        scheduleCloudSave(payload);
      }
      // 언마운트 경로에서는 4초 디바운스를 기다려 줄 주체가 없다 — useCloudSync의 정리가 스케줄러를
      // dispose해 대기 중인 예약을 버린다. 그래서 여기서 즉시 flush한다(예약이 없으면 스케줄러가 no-op).
      // 이미 push 중이거나 대기가 비어 있으면 아무 일도 안 하므로 pagehide/visibilitychange flush와
      // 겹쳐도 이중 push는 없다. 예약→flush 순서라 base 갱신 계약(onSaved에 push된 payload)도 그대로다.
      if (isUnmountFlush) void flushCloudSave();
    };

    pendingAutosaveFlushRef.current = () => save({ isUnmountFlush: true });
    const timer = window.setTimeout(() => save({ isUnmountFlush: false }), 120);

    // 의존성이 바뀐 재실행이면 타이머만 버린다(= 기존 디바운스 그대로). 대기 중인 저장은 바로 위에서
    // 최신 클로저로 다시 걸리므로 유실되지 않는다. **언마운트는 이 cleanup으로 구분할 수 없어**
    // (deps 변경과 같은 cleanup) 아래 전용 effect가 flush를 맡는다.
    return () => window.clearTimeout(timer);
  }, [
    flushCloudSave,
    scheduleCloudSave,
    fixedByTickerId,
    hasHydrationFailed,
    includedTickerIds,
    isPortfolioHydrated,
    selectedTickerId,
    showQuickEstimate,
    showSplitGraphs,
    isResultCompact,
    isYearlyAreaFillOn,
    showPortfolioDividendCenter,
    visibleYearlySeries,
    tickerProfiles,
    values.dpsGrowthMode,
    values.durationYears,
    values.initialInvestment,
    values.investmentStartDate,
    values.monthlyContribution,
    values.reinvestDividends,
    values.reinvestDividendPercent,
    values.reinvestTiming,
    values.targetMonthlyDividend,
    values.taxRate,
    scenarioTabs,
    activeScenarioId,
    // 프리필 단계 전이(requested→applied→null)도 이 effect 를 다시 돌려야 한다 — 프리필이
    // 중단된 경우(적용 대상 없음)엔 다른 의존성이 하나도 안 바뀌어 저장이 영영 잠긴 채로 남는다.
    scenarioPrefill,
    setScenarioPrefill,
    weightByTickerId
  ]);

  /**
   * **언마운트 시 대기 중인 로컬 autosave를 취소하지 않고 flush한다.**
   *
   * 위 autosave effect의 cleanup은 "의존성 변경(정상 디바운스)"과 "언마운트"를 구분하지 못한다. 언마운트에서
   * 타이머만 지우면 마지막 편집 후 120ms 안에 트리가 사라질 때(라우트 이동 등) IndexedDB 쓰기가 **아예 일어나지
   * 않는다** — 편집 유실. 마운트 시 1회만 도는 이 effect의 cleanup은 언마운트에서만 실행되므로, 여기서만 flush한다.
   * (autosave cleanup과의 실행 순서는 무관하다 — 타이머 해제는 ref에 담긴 flush 함수를 건드리지 않고,
   *  flush는 실행 즉시 ref를 비워 이중 저장이 없다.)
   *
   * ⚠ **best-effort**: `writePersistedAppState`는 비동기(IndexedDB 트랜잭션)라 "쓰기를 시작한다"까지만 보장한다.
   *   라우트 이동 같은 앱 내부 언마운트는 페이지가 살아 있어 트랜잭션이 정상 완료되지만, 페이지 종료와 겹치면
   *   완료 전에 잘릴 수 있다. 실패하면 조용히 넘기지 않고 `operation_error`로 계측된다(save 내부 catch).
   * ⚠ 현재 설계상 시뮬레이터 설정 드로어는 **항상 마운트**(닫힘=visibility:hidden)라 "드로어 닫기 = 언마운트"는
   *   일어나지 않는다. 이 flush의 실효 대상은 라우트 이동이다. 다만 나중에 조건부 마운트로 바뀌어도
   *   같은 이유로 안전하다 — 언마운트 경로가 이미 막혀 있다.
   */
  useEffect(() => () => pendingAutosaveFlushRef.current?.(), []);

  function applyScenario(scenario: PersistedScenarioState) {
    setTickerProfiles(scenario.portfolio.tickerProfiles);
    setIncludedTickerIds(scenario.portfolio.includedTickerIds);
    setWeightByTickerId(scenario.portfolio.weightByTickerId);
    setFixedByTickerId(scenario.portfolio.fixedByTickerId);
    setSelectedTickerId(scenario.portfolio.selectedTickerId);
    setYieldFormValues((prev) => ({
      ...prev,
      initialInvestment: scenario.investmentSettings.initialInvestment,
      monthlyContribution: scenario.investmentSettings.monthlyContribution,
      targetMonthlyDividend: scenario.investmentSettings.targetMonthlyDividend,
      investmentStartDate: scenario.investmentSettings.investmentStartDate,
      durationYears: scenario.investmentSettings.durationYears,
      reinvestDividends: scenario.investmentSettings.reinvestDividends,
      reinvestDividendPercent: scenario.investmentSettings.reinvestDividendPercent,
      taxRate: scenario.investmentSettings.taxRate,
      reinvestTiming: scenario.investmentSettings.reinvestTiming,
      dpsGrowthMode: scenario.investmentSettings.dpsGrowthMode
    }));
    setShowQuickEstimate(scenario.investmentSettings.showQuickEstimate);
    setShowSplitGraphs(scenario.investmentSettings.showSplitGraphs);
    setIsResultCompact(scenario.investmentSettings.isResultCompact);
    setIsYearlyAreaFillOn(scenario.investmentSettings.isYearlyAreaFillOn);
    setShowPortfolioDividendCenter(scenario.investmentSettings.showPortfolioDividendCenter);
    setVisibleYearlySeries(scenario.investmentSettings.visibleYearlySeries);
  }

  function applyPersistedPayload(payload: PersistedAppStatePayload) {
    const activeScenario =
      payload.scenarios.find((scenario) => scenario.id === payload.activeScenarioId) ?? payload.scenarios[0] ?? null;
    if (!activeScenario) return;

    setScenarioTabs(payload.scenarios);
    setActiveScenarioId(activeScenario.id);
    applyScenario(activeScenario);
  }

  const copyShareUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      return { ok: true as const, url, copied: true as const };
    } catch {
      return { ok: true as const, url, copied: false as const };
    }
  };

  /**
   * 공유 링크를 만든다 — **URL 에 담는 lz-string `?share=` 한 길뿐이다.**
   *
   * ## 🔴 DB 저장 경로를 왜 없앴나 (2026-08-09)
   *
   * 예전에는 활성 시나리오를 `shared_snapshots` 테이블에 넣고 짧은 `?s=<key>` URL 을 주는 길이
   * **먼저** 있었고, 그게 실패하면 이 lz-string 경로로 떨어졌다. 그 길을 판단 근거째로 걷어냈다.
   *
   * 붙였던 이유가 둘이었는데 실측해 보니 둘 다 서 있지 않았다:
   *
   * 1. **"URL 이 길어져 터진다"** — 아니다. `test/share/shareLengthCensus.test.ts` 로 실제 인코더에
   *    실제 프리셋을 넣어 재 보니 4000자 상한을 넘기려면 **73종목**이 필요하다. 30종목이 1823자
   *    (상한의 46%), 50종목이 2790자다. 배당 포트폴리오에서 73종목은 사실상 안 나온다.
   *    ⚠ v3 압축 인코딩(2026-02-18)이 DB 경로(2026-07-18)보다 **다섯 달 먼저** 들어와 있었다 —
   *      "옛날엔 인코딩이 뚱뚱했다"는 설명도 성립하지 않는다.
   * 2. **"OG 카드를 그리려면 서버가 payload 를 읽어야 한다"** — 아니다. `?share=` 링크도 카드가
   *    정상으로 그려진다. 서버리스 함수가 lz-string 을 직접 푼다(server/handlers/Og 의 `resolveCardModel`).
   *
   * 반면 대가는 실재했다. 생성 RPC 는 **로그인 없이 누구나** 부를 수 있고(공개 anon 키), 저장분에
   * 만료도 정리도 없었다. 한 건 64KB 이므로 반복 호출로 무료 용량을 채울 수 있는 상태였다.
   * 얻는 것이 "URL 이 짧아 보기 좋다" 하나뿐인데 치르는 값이 그것이라 길을 닫았다.
   *
   * ## ⚠ 기존 `?s=` 링크는 계속 열린다
   *
   * 닫은 것은 **쓰기뿐**이다. 이미 나간 링크를 읽는 세 경로(앱의 `applySharedScenario`,
   * 미들웨어의 메타 치환, OG 카드)는 그대로다 — 공유 URL 은 사용자 자산이라 끊지 않는다.
   * DB 쪽도 `create_shared_snapshot` 만 EXECUTE 를 회수했고 `get_shared_snapshot` 은 살아 있다
   * (supabase/migrations/20260811000000_close_shared_snapshot_writes.sql).
   */
  const createShareLink = async () => {
    const { scenarios, activeScenarioId: currentActiveScenarioId } = buildCurrentScenariosSnapshot();
    const activeScenario = scenarios.find((scenario) => scenario.id === currentActiveScenarioId) ?? null;
    if (!activeScenario) {
      return {
        ok: false as const,
        message: '공유할 탭을 찾을 수 없습니다.'
      };
    }

    const encoded = encodeSharedScenario(activeScenario);
    if (encoded.length > SHARE_LENGTH_LIMIT) {
      /*
       * 실측상 73종목 이상이라야 여기 닿는다. 폴백이 사라졌으므로 이 자리가 곧 **공유 실패**다 —
       * 그래서 조용히 넘어가지 않고 계측한다. 이 이벤트가 실제로 찍히기 시작하면 상한을 올릴지
       * (브라우저는 4000자보다 훨씬 긴 URL 을 받는다) 판단할 근거가 된다.
       */
      trackEvent(ANALYTICS_EVENT.OPERATION_ERROR, {
        operation: 'create_share_link',
        reason: 'payload_too_large'
      });
      return {
        ok: false as const,
        message: `공유 데이터가 너무 큽니다. (현재 ${encoded.length}자, 최대 ${SHARE_LENGTH_LIMIT}자)`
      };
    }
    return copyShareUrl(buildShareUrl(window.location.href, encoded));
  };

  /** 공유로 들어온 시나리오를 "공유된 탭"으로 병합·활성화·적용한다(DB key/구 lz-string 공통 경로). */
  function applySharedScenario(sharedScenario: PersistedScenarioState) {
    const { scenarios } = buildCurrentScenariosSnapshot();
    const nextSharedScenario: PersistedScenarioState = {
      ...sharedScenario,
      id: SHARED_SCENARIO_ID,
      name: SHARED_SCENARIO_NAME
    };
    const nextTabs = mergeSharedScenarioIntoTabs(scenarios, nextSharedScenario);
    setScenarioTabs(nextTabs);
    setActiveScenarioId(nextSharedScenario.id);
    applyScenario(nextSharedScenario);
  }

  useEffect(() => {
    if (!isPortfolioHydrated) return;
    if (hasAppliedShareLinkRef.current) return;
    hasAppliedShareLinkRef.current = true;

    let cancelled = false;
    const cleanupQuery = () => {
      if (cancelled) return;
      window.history.replaceState({}, '', stripShareParams(window.location.href));
    };

    // 포맷 감지는 파라미터 이름으로: `?s=`(신규 DB key) vs `?share=`(구 lz-string). 신규가 우선.
    const dbShareKey = readDbShareKeyFromHref(window.location.href);
    const shareCode = readShareCodeFromHref(window.location.href);

    // 1) DB key 경로(?s=) — 네트워크 조회라 비동기. cancelled 가드로 언마운트 후 상태쓰기를 막는다.
    if (dbShareKey) {
      const applyDbShare = async () => {
        try {
          const client = await getSupabaseClient();
          if (!client) throw new Error('supabase client unavailable');
          // fetchSharedSnapshot이 envelope 형태(v===1, scenario 객체)를 검증한다 → non-null이면 scenario 존재.
          // null = 부재/만료/**결손·비-envelope payload**(anon이 임의 객체 저장 가능) — 정규화 시도 없이 폴백.
          const envelope = await fetchSharedSnapshot(client, dbShareKey);
          if (cancelled) return;

          const scenario = envelope ? normalizeSharedSnapshotScenario(envelope.scenario) : null;
          if (!scenario) {
            // 유효한 스냅샷 부재(못 찾음/만료/형태 불일치) — 전송 실패(db_fetch_failed)와 구분되는 라벨.
            trackEvent(ANALYTICS_EVENT.OPERATION_ERROR, {
              operation: 'apply_share_link',
              reason: 'db_snapshot_missing'
            });
            setShareLinkFailure('unavailable');
            cleanupQuery();
            return;
          }

          applySharedScenario(scenario);
          cleanupQuery();
        } catch {
          if (cancelled) return;
          trackEvent(ANALYTICS_EVENT.OPERATION_ERROR, {
            operation: 'apply_share_link',
            reason: 'db_fetch_failed'
          });
          setShareLinkFailure('unavailable');
          cleanupQuery();
        }
      };

      void applyDbShare();
      return () => {
        cancelled = true;
      };
    }

    // 2) 구 lz-string 경로(?share=) — 동기 디코드. 신규 포맷이 없을 때만 탄다.
    //    디코더는 던지지 않는다(잘린 링크 하나가 앱 전체를 라우터 에러 화면으로 바꾸던 자리다).
    //    실패는 값으로 오고, 계측 라벨만 원인별로 갈린다: 문자열이 깨짐(decode_failed, 기존 라벨 유지)
    //    vs 풀리긴 했으나 우리 스키마가 아님(schema_mismatch).
    if (shareCode) {
      const decoded = decodeSharedScenarioResult(shareCode);
      if (!decoded.ok) {
        trackEvent(ANALYTICS_EVENT.OPERATION_ERROR, {
          operation: 'apply_share_link',
          reason: decoded.reason === 'malformed' ? 'decode_failed' : 'schema_mismatch'
        });
        setShareLinkFailure('invalid');
        cleanupQuery();
        return;
      }
      applySharedScenario(decoded.scenario);
      cleanupQuery();
    }

    return () => {
      cancelled = true;
    };
  }, [isPortfolioHydrated]);

  /**
   * 페이지 이탈(새로고침·탭 닫기·백그라운드 전환) 직전, 대기 중인 클라우드 저장을 **즉시 flush**한다.
   *
   * 로컬 autosave(IndexedDB)는 120ms라 이탈 시점에 **대부분** 최신이지만, 클라우드 push는 4초 디바운스라
   * 이탈이 디바운스를 앞지르면 마지막 편집(예: 탭 삭제)이 클라우드에 도달하지 못한다 → 다음 세션 시작에
   * 로컬{a,b} vs 클라우드{a,b,c}로 거짓 충돌 모달이 뜬다(레이스 창). 이탈 시 flush로 그 창을 닫는다.
   *
   * ⚠ 이탈 시점의 비동기 네트워크 완료는 보장되지 않는다(best-effort). 진짜 안전망은 세션시작 엔진의
   *   타임스탬프 판정(로컬 ⊂ 클라우드 + 로컬이 더 최근 → 삭제가 이김)이다. 여기선 레이스 창을 좁힐 뿐이다.
   * ⚠ 여기서 flush하는 건 **클라우드뿐**이다. 페이지 종료(pagehide)에서는 React 언마운트가 일어나지 않아
   *   위 언마운트 flush도 안 탄다 — 즉 마지막 120ms 안의 편집은 로컬에도 안 써질 수 있다(≤120ms 유실 창).
   *   여기서 로컬까지 동기로 쓰려 해도 IndexedDB는 비동기라 종료와 경합해 보장이 생기지 않는다.
   *   앱 내부 언마운트(라우트 이동)는 위 전용 effect가 확실히 막는다 — 이 창은 페이지 종료에만 남는다.
   * ⚠ 리스너는 가볍게(동기 무거운 작업·alert 금지) 유지하고, cleanup에서 반드시 제거한다.
   * pagehide(새로고침·닫기·bfcache 진입) + visibilitychange→hidden(모바일 백그라운드·앱 전환 보강) 둘 다 건다.
   */
  useEffect(() => {
    const flushPending = () => {
      void flushCloudSave();
    };
    const handleVisibilityChange = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') flushPending();
    };
    window.addEventListener('pagehide', flushPending);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('pagehide', flushPending);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [flushCloudSave]);

  /** 저장 실패 인디케이터의 "다시 시도" — 현재 payload를 같은 스케줄러로 재예약 후 즉시 flush. */
  const retryCloudSave = async (): Promise<void> => {
    scheduleCloudSave(buildPayload());
    await flushCloudSave();
  };

  return {
    isPortfolioHydrated,
    createShareLink,
    // 클라우드/충돌 계층이 소비 — 현재 워크스페이스 payload 조립 / 전체 payload 적용 / 재시도.
    buildPayload,
    applyPersistedPayload,
    retryCloudSave,
    // 세션시작 sync가 하이드레이션과 **같은** 로컬 read를 재사용하게 하는 리더(로컬 read 1회 공유).
    readLocalAutosaveForSync: localAutosaveCache.readForSync
  };
};
