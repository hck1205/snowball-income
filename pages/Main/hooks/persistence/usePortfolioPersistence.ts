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
import {
  buildSharedSnapshotEnvelope,
  createSharedSnapshot,
  fetchSharedSnapshot,
  getSupabaseClient
} from '@/shared/lib/supabase';
import { ANALYTICS_EVENT, setUserProperties, trackEvent } from '@/shared/lib/analytics';
import { buildScenariosSnapshot, isSameScenarioContent, mergeSharedScenarioIntoTabs } from './scenarioSnapshot';
import { decodeSharedScenario, encodeSharedScenario, SHARED_SCENARIO_ID, SHARE_LENGTH_LIMIT } from './shareLink';
import {
  buildDbShareUrl,
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

  const buildPayload = (): PersistedAppStatePayload => {
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

  /** 구 lz-string `?share=` 폴백 — client 미설정/미배포 또는 DB 저장 실패 시에도 공유는 성립한다. */
  const createLegacyShareLink = async (activeScenario: PersistedScenarioState) => {
    const encoded = encodeSharedScenario(activeScenario);
    if (encoded.length > SHARE_LENGTH_LIMIT) {
      return {
        ok: false as const,
        message: `공유 데이터가 너무 큽니다. (현재 ${encoded.length}자, 최대 ${SHARE_LENGTH_LIMIT}자)`
      };
    }
    return copyShareUrl(buildShareUrl(window.location.href, encoded));
  };

  const createShareLink = async () => {
    const { scenarios, activeScenarioId: currentActiveScenarioId } = buildCurrentScenariosSnapshot();
    const activeScenario = scenarios.find((scenario) => scenario.id === currentActiveScenarioId) ?? null;
    if (!activeScenario) {
      return {
        ok: false as const,
        message: '공유할 탭을 찾을 수 없습니다.'
      };
    }

    // 1) DB key 경로: 활성 시나리오를 shared_snapshots에 저장 → 짧은 `?s=<key>` URL.
    //    client가 있으면(설정+배포) 우선 시도한다. 실패는 아래 lz-string 폴백이 흡수한다.
    try {
      const client = await getSupabaseClient();
      if (client) {
        const key = await createSharedSnapshot(client, buildSharedSnapshotEnvelope(activeScenario));
        return await copyShareUrl(buildDbShareUrl(window.location.href, key));
      }
    } catch {
      // 무음 실패 금지 — 계측 후 구 lz-string으로 폴백해 공유를 성립시킨다.
      trackEvent(ANALYTICS_EVENT.OPERATION_ERROR, {
        operation: 'create_share_link',
        reason: 'db_snapshot_failed'
      });
    }

    // 2) 폴백(client null=미설정/테스트, 또는 DB 저장 throw): 구 lz-string `?share=`.
    return createLegacyShareLink(activeScenario);
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
          cleanupQuery();
        }
      };

      void applyDbShare();
      return () => {
        cancelled = true;
      };
    }

    // 2) 구 lz-string 경로(?share=) — 동기 디코드. 신규 포맷이 없을 때만 탄다.
    if (shareCode) {
      const sharedScenario = decodeSharedScenario(shareCode);
      if (!sharedScenario) {
        trackEvent(ANALYTICS_EVENT.OPERATION_ERROR, {
          operation: 'apply_share_link',
          reason: 'decode_failed'
        });
        cleanupQuery();
        return;
      }
      applySharedScenario(sharedScenario);
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
