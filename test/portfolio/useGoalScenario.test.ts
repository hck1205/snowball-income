import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import {
  buildDefaultPayload,
  writePersistedAppState,
  type PersistedAppStatePayload,
  type PersistedInvestmentSettings
} from '@/jotai';
import type { TickerProfile } from '@/shared/types/snowball';
import { useGoalScenario } from '@/pages/Portfolio/hooks';

/**
 * `useGoalScenario` — 저장 payload → 순수 재계산 → 상태 7종.
 *
 * 성공 경로는 **실제 왕복**으로 검증한다(fake-indexeddb 에 `writePersistedAppState` 로 쓰고,
 * 훅이 `readPersistedAppState` 로 다시 읽어 계산). 리더 주입은 실 저장소로는 만들 수 없는
 * 실패 경로(읽기 실패 / 정규화를 통과할 수 없는 값)에만 쓴다.
 */

/**
 * 이 훅이 읽는 것은 **시뮬레이터 저장 payload** 저장소다(보유 목록 `snowball-portfolio` 가 아니다).
 * 이름과 값이 어긋나면 다음 사람이 이름만 믿고 엉뚱한 DB 를 지운다 — 명명은
 * `test/portfolio/portfolioGoalHarness.tsx` 의 구분(`PORTFOLIO_DB_NAME` / `APP_STATE_DB_NAME`)을 따른다.
 */
const APP_STATE_DB_NAME = 'snowball-income-db';

/** 계산 기준 시점 — 투자 시작(2024-01) 후 29개월. 롤링 12개월 창이 꽉 찬다(폴백 아님). */
const NOW = new Date('2026-06-15T00:00:00+09:00');

const buildProfile = (): TickerProfile => ({
  id: 'ticker-1',
  ticker: 'SCHD',
  name: '',
  initialPrice: 27,
  // 정합 모델의 고정점: dividendGrowth === expectedTotalReturn - dividendYield.
  dividendGrowth: 6.4,
  dividendYield: 3.6,
  expectedTotalReturn: 10,
  frequency: 'quarterly'
});

const buildPayload = (settings: Partial<PersistedInvestmentSettings> = {}): PersistedAppStatePayload => {
  const base = buildDefaultPayload();
  const profile = buildProfile();
  const portfolio = {
    tickerProfiles: [profile],
    includedTickerIds: [profile.id],
    weightByTickerId: { [profile.id]: 100 },
    fixedByTickerId: { [profile.id]: false },
    selectedTickerId: profile.id
  };
  const investmentSettings: PersistedInvestmentSettings = {
    ...base.investmentSettings,
    initialInvestment: 100_000_000,
    monthlyContribution: 1_000_000,
    targetMonthlyDividend: 1_000_000,
    investmentStartDate: '2024-01-01',
    durationYears: 20,
    ...settings
  };

  return {
    ...base,
    portfolio,
    investmentSettings,
    scenarios: base.scenarios.map((scenario) => ({
      ...scenario,
      name: '내 포트폴리오',
      portfolio,
      investmentSettings
    }))
  };
};

const deleteAppStateDb = () =>
  new Promise<void>((resolve) => {
    const request = indexedDB.deleteDatabase(APP_STATE_DB_NAME);
    request.onsuccess = () => resolve();
    request.onerror = () => resolve();
    request.onblocked = () => resolve();
  });

const renderGoal = (options: Parameters<typeof useGoalScenario>[0] = {}) =>
  renderHook(() => useGoalScenario({ now: NOW, ...options }));

beforeEach(async () => {
  await deleteAppStateDb();
});

describe('useGoalScenario — 저장 데이터 왕복', () => {
  it('저장된 시나리오를 읽어 목표·현재값·도달월을 계산한다', async () => {
    await writePersistedAppState(buildPayload({ targetMonthlyDividend: 3_000_000 }));

    const { result } = renderGoal();
    expect(result.current.status).toBe('loading');

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.scenarioName).toBe('내 포트폴리오');
    expect(result.current.tickers).toEqual(['SCHD']);
    expect(result.current.tickerCount).toBe(1);
    expect(result.current.hasTarget).toBe(true);
    expect(result.current.targetMonthlyDividend).toBe(3_000_000);
    expect(result.current.currentAmount).toBeGreaterThan(0);
    expect(result.current.evaluatedAt).toEqual({ year: 2026, month: 6 });

    // 조건 요약은 "계산에 실제로 쓰인 값"이어야 한다.
    expect(result.current.conditions).toMatchObject({
      initialInvestment: 100_000_000,
      monthlyContribution: 1_000_000,
      durationYears: 20,
      investmentStartDate: '2024-01-01',
      taxRate: 15.4,
      tickerCount: 1
    });

    // 현재값·달성률은 같은 정의 계열이라 서로 어긋날 수 없다.
    const { currentAmount, progressRatio, progressPercent } = result.current;
    expect(progressRatio).toBeCloseTo((currentAmount ?? 0) / 3_000_000, 12);
    expect(progressPercent).toBe(Math.max(0, Math.min(100, Math.round((progressRatio ?? 0) * 100))));
  });

  it('오늘이 투자 시작 후 12개월을 넘으면 최근 12개월 평균(trailing12m)을 쓴다', async () => {
    await writePersistedAppState(buildPayload());

    const { result } = renderGoal();
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.currentMode).toBe('trailing12m');
    expect(result.current.isCurrentFallback).toBe(false);
    expect(result.current.currentAsOf).toEqual({ year: 2026, month: 6 });
  });

  it('오늘이 투자 시작 전이면 1년차 평균으로 폴백한다', async () => {
    await writePersistedAppState(buildPayload({ investmentStartDate: '2030-01-01' }));

    const { result } = renderGoal();
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.currentMode).toBe('firstYearAverage');
    expect(result.current.isCurrentFallback).toBe(true);
  });
});

describe('useGoalScenario — 상태 분기', () => {
  it('저장된 포트폴리오가 없으면 empty', async () => {
    const { result } = renderGoal();

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.status).toBe('empty');
    expect(result.current.hasTarget).toBe(false);
    expect(result.current.currentAmount).toBeNull();
  });

  it('목표가 0이면 no-target — 달성률·도달월을 아예 노출하지 않는다', async () => {
    await writePersistedAppState(buildPayload({ targetMonthlyDividend: 0 }));

    const { result } = renderGoal();
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.status).toBe('no-target');
    expect(result.current.hasTarget).toBe(false);
    expect(result.current.targetMonthlyDividend).toBe(0);
    expect(result.current.progressRatio).toBeNull();
    expect(result.current.progressPercent).toBeNull();
    expect(result.current.reachedMonth).toBeNull();
    expect(result.current.isAlreadyReached).toBe(false);
    // 목표 잡기의 근거가 되는 현재값은 계속 보여준다.
    expect(result.current.currentAmount).toBeGreaterThan(0);
  });

  it('기간 안에 목표에 못 닿으면 not-reached (값 없음이 아니라 상태로 표현)', async () => {
    await writePersistedAppState(buildPayload({ targetMonthlyDividend: 1_000_000_000 }));

    const { result } = renderGoal();
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.status).toBe('not-reached');
    expect(result.current.reachedMonth).toBeNull();
    expect(result.current.reachedYearIndex).toBeNull();
    expect(result.current.progressPercent).toBeLessThan(100);
  });

  it('목표에 닿으면 reached — 도달 달력 연·월과 N년차를 준다', async () => {
    // 현재값(2026-06 기준 ~30만원)보다는 크고, 20년 뒤 최종 월배당보다는 작은 목표.
    await writePersistedAppState(buildPayload({ targetMonthlyDividend: 600_000 }));

    const { result } = renderGoal();
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.status).toBe('reached');
    expect(result.current.reachedMonth).not.toBeNull();
    expect(result.current.reachedMonth?.year).toBeGreaterThanOrEqual(2024);
    expect(result.current.reachedMonth?.month).toBeGreaterThanOrEqual(1);
    expect(result.current.reachedMonth?.month).toBeLessThanOrEqual(12);
    expect(result.current.reachedYearIndex).toBeGreaterThan(0);
    expect(result.current.isAlreadyReached).toBe(false);
  });

  it('현재값이 이미 목표 이상이면 already-reached (미터 100%)', async () => {
    await writePersistedAppState(buildPayload({ targetMonthlyDividend: 100_000 }));

    const { result } = renderGoal();
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.status).toBe('already-reached');
    expect(result.current.isAlreadyReached).toBe(true);
    expect(result.current.progressPercent).toBe(100);
    // 이미 달성이면 도달월도 반드시 존재한다(같은 식이라 모순 불가).
    expect(result.current.reachedMonth).not.toBeNull();
  });
});

describe('useGoalScenario — 실측 현재값 주입', () => {
  it('measuredCurrentKrw 를 주면 달성률·남은 금액이 시뮬 파생값이 아니라 그 값을 따른다', async () => {
    await writePersistedAppState(buildPayload({ targetMonthlyDividend: 3_000_000 }));

    const { result: simulated } = renderGoal();
    await waitFor(() => expect(simulated.current.isLoading).toBe(false));
    const derivedAmount = simulated.current.currentAmount ?? 0;

    const { result } = renderGoal({ measuredCurrentKrw: 1_500_000 });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.currentBasis).toBe('measured');
    expect(result.current.currentAmount).toBe(1_500_000);
    expect(result.current.currentAmount).not.toBe(derivedAmount);
    expect(result.current.progressRatio).toBeCloseTo(0.5, 12);
    expect(result.current.progressPercent).toBe(50);
    // 시뮬 평균 창의 메타는 실측에서 사실이 아니다 — 계약을 거짓으로 두지 않는다.
    expect(result.current.currentMode).toBeNull();
    expect(result.current.isCurrentFallback).toBe(false);
    expect(result.current.currentAsOf).toBeNull();
  });

  it('실측이 목표를 넘으면 already-reached — 도달 판정은 주입된 현재값 단독으로 한다', async () => {
    await writePersistedAppState(buildPayload({ targetMonthlyDividend: 3_000_000 }));

    const { result } = renderGoal({ measuredCurrentKrw: 4_000_000 });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.status).toBe('already-reached');
    expect(result.current.isAlreadyReached).toBe(true);
    expect(result.current.progressPercent).toBe(100);
    // 예상 달성 시점은 여전히 **시뮬 궤적 파생**이라 실측 도달과 별개로 존재할 수 있다.
    expect(result.current.currentBasis).toBe('measured');
  });

  it('실측 판정이 진행 중이면 저장 데이터를 다 읽어도 로딩을 유지한다 (숫자 바꿔치기 금지)', async () => {
    await writePersistedAppState(buildPayload({ targetMonthlyDividend: 3_000_000 }));

    const { result } = renderGoal({ isMeasurePending: true });

    // 저장소 읽기가 끝날 시간을 준 뒤에도 로딩이어야 한다(시뮬 숫자를 먼저 내보내지 않는다).
    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.status).toBe('loading');
    expect(result.current.currentAmount).toBeNull();
    expect(result.current.hasTarget).toBe(false);
  });

  it('measuredCurrentKrw 가 null 이면 시뮬 파생값(D1)을 그대로 쓴다', async () => {
    await writePersistedAppState(buildPayload({ targetMonthlyDividend: 3_000_000 }));

    const { result } = renderGoal({ measuredCurrentKrw: null });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.currentBasis).toBe('simulated');
    expect(result.current.currentMode).toBe('trailing12m');
  });
});

describe('useGoalScenario — 실패 경로', () => {
  it('저장소 읽기에 실패하면 error/read-failed (저장 데이터는 건드리지 않는다)', async () => {
    const { result } = renderGoal({
      readPersistedState: async () => ({ ok: false, payload: buildDefaultPayload(), error: new Error('blocked') })
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.status).toBe('error');
    expect(result.current.errorReason).toBe('read-failed');
  });

  it('저장 데이터가 폼 검증을 통과하지 못하면 error/invalid-data', async () => {
    // 세율 500%는 zod 스키마(max 100)를 통과하지 못한다 → runScenarioPayload 가 null.
    // 실제 저장 경로는 정규화가 이런 값을 미리 잡아내므로, 이 분기는 방어선이다(리더 주입으로만 재현 가능).
    const { result } = renderGoal({
      readPersistedState: async () => ({ ok: true, payload: buildPayload({ taxRate: 500 }) })
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.status).toBe('error');
    expect(result.current.errorReason).toBe('invalid-data');
    expect(result.current.scenarioName).toBe('내 포트폴리오');
  });
});
