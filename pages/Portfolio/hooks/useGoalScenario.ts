import { useEffect, useMemo, useRef, useState } from 'react';
import { readPersistedAppState, type PersistedAppStatePayload, type PersistedScenarioState } from '@/jotai';
import { currentMonthlyDividend, findTargetMonth, findTargetYear, runScenarioPayload } from '@/shared/lib/snowball';
import { ANALYTICS_EVENT, trackEvent } from '@/shared/lib/analytics';
import type { CurrentMonthlyDividendMode, TargetMonthReached, YearMonth } from '@/shared/types';

/**
 * 내 포트폴리오(`/dividend/portfolio`) **목표 달성 카드**의 읽기 전용 데이터 훅.
 *
 * ## 왜 전역 폼 atom을 안 쓰나 (확정 결정)
 * 시뮬레이터 상태 atom은 전역이지만 **하이드레이션이 Main에 묶여 있다**
 * (`pages/Main/hooks/persistence/usePortfolioPersistence.ts` — MainLeftPanel이 마운트될 때만 돈다).
 * 이 화면으로 직행하거나 새로고침하면 Main이 한 번도 마운트되지 않아 atom은 **기본값**이다.
 * 그래서 이 훅은 저장 payload(`readPersistedAppState`)를 직접 읽고 `runScenarioPayload`로 **순수 재계산**한다.
 * 영속/공유 스키마는 건드리지 않는다(읽기만).
 *
 * ## 쓰기는 하지 않는다
 * 이 훅에는 목표를 쓰는 함수가 **의도적으로 없다**. Main 밖에서는 로컬 autosave(120ms)도
 * 클라우드 sync(4초 디바운스·3-way base 해시)도 마운트돼 있지 않아, 여기서 쓰면
 * ①atom에 쓰면 Main 재진입 시 하이드레이션이 저장값으로 덮어써 조용히 사라지고
 * ②저장 payload에 직접 쓰면 클라우드 base 해시와 어긋나 다음 세션 충돌 판정을 바꾼다.
 * 목표 편집은 시뮬레이터(목표 입력 필드)로 보낸다. 보유 저장소(`snowball-portfolio`)도 읽지 않는다 —
 * 실측 현재값은 **페이지가 이미 갖고 있어** 인자(`measuredCurrentKrw`)로 내려온다.
 *
 * ## 상태 7종
 * `loading` / `empty`(포트폴리오 없음) / `error`(읽기 실패·검증 실패) / `no-target`(target ≤ 0) /
 * `not-reached` / `reached` / `already-reached`(현재값이 이미 목표 이상).
 */

export type GoalScenarioStatus =
  | 'loading'
  | 'empty'
  | 'error'
  | 'no-target'
  | 'not-reached'
  | 'reached'
  | 'already-reached';

/**
 * `status === 'error'`의 사유.
 * - `read-failed`: 저장소를 읽지 못했다(IndexedDB 없음·다른 탭이 잠금·프라이빗 모드). 저장 데이터는 그대로다.
 * - `invalid-data`: 저장 payload는 읽었지만 계산할 수 없다(폼 검증 실패·티커 입력 계약 위반).
 */
export type GoalErrorReason = 'read-failed' | 'invalid-data';

/** 조건 요약이 그대로 쓰는 값. 계산에 실제로 사용된 값(검증 통과본)이다. */
export type GoalConditions = {
  initialInvestment: number;
  monthlyContribution: number;
  durationYears: number;
  /** `YYYY-MM-DD` */
  investmentStartDate: string;
  reinvestDividends: boolean;
  reinvestDividendPercent: number;
  /** 정규화가 기본값(15.4)을 채우지만, 구버전 데이터를 위해 optional을 유지한다. */
  taxRate: number | undefined;
  /** 계산에 참여한(=포함된) 티커 수. */
  tickerCount: number;
};

export type GoalScenarioViewModel = {
  status: GoalScenarioStatus;
  /** `status === 'loading'` 과 동치 — 뷰 분기 편의. */
  isLoading: boolean;
  errorReason: GoalErrorReason | null;
  /** 활성 시나리오 이름(탭 이름). 읽기 실패/시나리오 부재면 null. */
  scenarioName: string | null;
  /** 계산에 참여한 티커 심볼(payload 순서 보존). */
  tickers: string[];
  tickerCount: number;
  /** 계산이 성립했을 때만 존재한다. */
  conditions: GoalConditions | null;
  /** target > 0 (목표 설정됨). false면 아래 달성률·도달 필드는 전부 null이다. */
  hasTarget: boolean;
  /** 저장된 목표 월배당(원). 미설정이면 0 — **hasTarget이 false면 화면에 쓰지 말 것**. */
  targetMonthlyDividend: number;
  /**
   * 달성률·남은 금액의 분자가 되는 **현재 월배당(세후, 원)**.
   *
   * `measuredCurrentKrw`가 주입되면 그 값(= 지금 보유한 종목의 실측)이고, 없으면 시뮬 파생값
   * D1(오늘 기준 직전 12개월 합 ÷ 12, 12개월 미경과면 1년차 평균)이다. 어느 쪽인지는 `currentBasis`가 말한다.
   */
  currentAmount: number | null;
  /** 시뮬 파생값일 때만 의미가 있다(실측이면 null). */
  currentMode: CurrentMonthlyDividendMode | null;
  /** `currentMode === 'firstYearAverage'` — 힌트 카피 분기용. 실측이면 false. */
  isCurrentFallback: boolean;
  /** 시뮬 파생값 평균 창의 마지막 달. 실측이면 null. */
  currentAsOf: YearMonth | null;
  /** 현재값의 출처. 화면의 기준 안내(BasisNote)·GA `current_basis`가 이 값을 쓴다. */
  currentBasis: 'measured' | 'simulated';
  /** 현재값 ÷ 목표. 목표 미설정이면 null(0원 목표 "달성" 방지). 1을 넘을 수 있다. */
  progressRatio: number | null;
  /** 미터 표시용 0..100 정수(클램프). */
  progressPercent: number | null;
  /** 목표에 처음 도달하는 달. 기간 내 미도달이면 null. **언제나 시뮬 궤적 파생값이다.** */
  reachedMonth: TargetMonthReached | null;
  /** 도달이 투자 몇 년차인지(1-based). 연 해상도에서 못 찾으면 null. */
  reachedYearIndex: number | null;
  /** 현재값이 이미 목표 이상(= 미터 100%). 이때 `status === 'already-reached'`. */
  isAlreadyReached: boolean;
  /** 계산 기준 시점(오늘). */
  evaluatedAt: YearMonth;
};

export type UseGoalScenarioOptions = {
  /** "오늘". 미지정이면 훅 수명 동안 고정된 `new Date()`. 테스트는 반드시 주입한다. */
  now?: Date;
  /** 저장 payload 리더 주입(테스트용). 기본은 실제 IndexedDB 리더. */
  readPersistedState?: typeof readPersistedAppState;
  /** 실측 현재 월배당(원). `null`이면 시뮬 파생값(D1)을 그대로 쓴다. */
  measuredCurrentKrw?: number | null;
  /** 실측 판정이 진행 중 — 화면을 로딩으로 유지한다(숫자 바꿔치기 금지). */
  isMeasurePending?: boolean;
};

type LoadPhase =
  | { phase: 'loading' }
  | { phase: 'ready'; payload: PersistedAppStatePayload }
  | { phase: 'failed' };

/** 활성 시나리오 선택 규칙은 `applyPersistedPayload`(usePortfolioPersistence)와 **같다** — 화면 간 불일치 금지. */
const selectActiveScenario = (payload: PersistedAppStatePayload): PersistedScenarioState | null =>
  payload.scenarios.find((scenario) => scenario.id === payload.activeScenarioId) ?? payload.scenarios[0] ?? null;

/** 포함된 티커가 하나라도 있는가. `runScenarioPayload`의 "포함 0개 → null"과 같은 판정이라 empty ↔ error를 가른다. */
const hasIncludedTicker = (scenario: PersistedScenarioState): boolean => {
  const included = new Set(scenario.portfolio.includedTickerIds);
  return scenario.portfolio.tickerProfiles.some((profile) => included.has(profile.id));
};

const EMPTY_TICKERS: string[] = [];

const buildBaseViewModel = (evaluatedAt: YearMonth): GoalScenarioViewModel => ({
  status: 'loading',
  isLoading: true,
  errorReason: null,
  scenarioName: null,
  tickers: EMPTY_TICKERS,
  tickerCount: 0,
  conditions: null,
  hasTarget: false,
  targetMonthlyDividend: 0,
  currentAmount: null,
  currentMode: null,
  isCurrentFallback: false,
  currentAsOf: null,
  currentBasis: 'simulated',
  progressRatio: null,
  progressPercent: null,
  reachedMonth: null,
  reachedYearIndex: null,
  isAlreadyReached: false,
  evaluatedAt
});

export const useGoalScenario = (options: UseGoalScenarioOptions = {}): GoalScenarioViewModel => {
  const { now: injectedNow, readPersistedState, measuredCurrentKrw = null, isMeasurePending = false } = options;

  /*
   * "오늘"은 훅 수명 동안 고정한다 — 렌더마다 새 Date를 만들면 240개 월 시계열 파생이 매 렌더 다시 돈다.
   * 주입값이 있으면 그것을 그대로 쓴다(테스트 결정성).
   */
  const fallbackNowRef = useRef<Date | null>(null);
  if (fallbackNowRef.current === null) fallbackNowRef.current = new Date();
  const now = injectedNow ?? fallbackNowRef.current;
  const nowYear = now.getFullYear();
  const nowMonth = now.getMonth() + 1;

  // 리더도 마운트 시점에 고정한다(인라인 람다를 넘겨도 read가 반복되지 않게).
  const readerRef = useRef(readPersistedState ?? readPersistedAppState);
  const [load, setLoad] = useState<LoadPhase>({ phase: 'loading' });

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const result = await readerRef.current();
        if (cancelled) return;

        if (!result.ok) {
          // 무음 실패 금지 — 화면은 error 상태로 알리고, 저장소는 건드리지 않는다(삭제·덮어쓰기 없음).
          trackEvent(ANALYTICS_EVENT.OPERATION_ERROR, { operation: 'goal_read_persisted_state' });
          setLoad({ phase: 'failed' });
          return;
        }

        setLoad({ phase: 'ready', payload: result.payload });
      } catch {
        if (cancelled) return;
        trackEvent(ANALYTICS_EVENT.OPERATION_ERROR, { operation: 'goal_read_persisted_state' });
        setLoad({ phase: 'failed' });
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, []);

  const activeScenario = useMemo(
    () => (load.phase === 'ready' ? selectActiveScenario(load.payload) : null),
    [load]
  );

  /*
   * 시나리오 payload를 순수 재계산한다. 240개 월 포인트(`ScenarioRun.monthly`)를 만드는 지점이라
   * 반드시 memo로 1회만 돈다. null = 계산 불가(포함 티커 0 / 티커 입력 계약 위반 / 폼 검증 실패 —
   * runScenarioPayload가 내부에서 validateFormValues를 태운다. 검증을 여기서 다시 조립하면 규칙이 이원화된다).
   */
  const run = useMemo(() => (activeScenario ? runScenarioPayload(activeScenario) : null), [activeScenario]);

  return useMemo<GoalScenarioViewModel>(() => {
    const evaluatedAt: YearMonth = { year: nowYear, month: nowMonth };
    const base = buildBaseViewModel(evaluatedAt);

    /*
     * 실측 판정이 아직 끝나지 않았다(보유 하이드레이션 중·환율 조회 중). 저장 payload를 다 읽었더라도
     * 여기서 시뮬 숫자를 먼저 내보내면 잠시 뒤 실측으로 **눈앞에서 값이 바뀐다** — 빈 값보다 나쁘다.
     * 그래서 load 판정보다 **먼저** 로딩으로 잘라 낸다.
     */
    if (isMeasurePending) return base;

    if (load.phase === 'loading') return base;
    if (load.phase === 'failed') return { ...base, status: 'error', isLoading: false, errorReason: 'read-failed' };

    if (!activeScenario || !hasIncludedTicker(activeScenario)) {
      return {
        ...base,
        status: 'empty',
        isLoading: false,
        scenarioName: activeScenario?.name ?? null
      };
    }

    if (!run) {
      return {
        ...base,
        status: 'error',
        isLoading: false,
        errorReason: 'invalid-data',
        scenarioName: activeScenario.name
      };
    }

    const tickers = run.profiles.map((profile) => profile.ticker);
    const conditions: GoalConditions = {
      initialInvestment: run.values.initialInvestment,
      monthlyContribution: run.values.monthlyContribution,
      durationYears: run.values.durationYears,
      investmentStartDate: run.values.investmentStartDate,
      reinvestDividends: run.values.reinvestDividends,
      reinvestDividendPercent: run.values.reinvestDividendPercent,
      taxRate: run.values.taxRate,
      tickerCount: run.profiles.length
    };

    const derived = currentMonthlyDividend({ monthly: run.monthly, now: evaluatedAt });
    const isMeasured = measuredCurrentKrw !== null;
    /** 달성률·남은 금액·도달 판정이 전부 이 한 값을 쓴다(계열이 갈리지 않게 여기서 한 번만 고른다). */
    const currentAmount = isMeasured ? measuredCurrentKrw : derived.amount;

    const computed: GoalScenarioViewModel = {
      ...base,
      isLoading: false,
      scenarioName: activeScenario.name,
      tickers,
      tickerCount: run.profiles.length,
      conditions,
      currentAmount,
      // 실측이면 시뮬 평균 창의 메타(모드·기준 달)는 사실이 아니다 — 계약을 거짓으로 두지 않는다.
      currentMode: isMeasured ? null : derived.mode,
      isCurrentFallback: isMeasured ? false : derived.isFallback,
      currentAsOf: isMeasured ? null : (derived.asOf ?? null),
      currentBasis: isMeasured ? 'measured' : 'simulated'
    };

    const target = run.values.targetMonthlyDividend;
    /*
     * 목표 미설정(0 이하)이면 달성률·도달 관련 값을 **아예 만들지 않는다**.
     * findTargetMonth(monthly, 0)은 첫 달에 성립하므로, 그대로 노출하면 "0원 목표를 달성했습니다"가 된다(AC6).
     */
    if (!(target > 0)) return { ...computed, status: 'no-target', hasTarget: false, targetMonthlyDividend: 0 };

    /*
     * 예상 달성 시점은 **언제나 시뮬 궤적 파생**이다(실측과 다른 계열이라 도달 판정에 참여시키지 않는다 —
     * 겹쳐 비교하면 부동소수 결합순서 차이로 판정이 뒤집힌다).
     * 도달(=이미 달성) 판정은 화면에 보이는 현재값 단독 비교로만 한다.
     */
    const reachedMonth = findTargetMonth(run.monthly, target);
    const isAlreadyReached = currentAmount >= target;

    // 연 해상도 "N년차" (표시 파생값). findTargetReachYearIndex(components/ResultSummaryCard)가
    // 폴더 배럴에 노출돼 있지 않아 같은 규칙을 여기서 계산한다 — 규칙이 바뀌면 두 곳을 함께 고칠 것.
    const reachedYear = findTargetYear(run.yearly, target);
    const yearIndex = reachedYear === undefined ? -1 : run.yearly.findIndex((row) => row.year === reachedYear);

    const progressRatio = currentAmount / target;

    return {
      ...computed,
      status: isAlreadyReached ? 'already-reached' : reachedMonth ? 'reached' : 'not-reached',
      hasTarget: true,
      targetMonthlyDividend: target,
      progressRatio,
      progressPercent: Math.max(0, Math.min(100, Math.round(progressRatio * 100))),
      reachedMonth,
      reachedYearIndex: yearIndex < 0 ? null : yearIndex + 1,
      isAlreadyReached
    };
  }, [activeScenario, isMeasurePending, load.phase, measuredCurrentKrw, nowMonth, nowYear, run]);
};
