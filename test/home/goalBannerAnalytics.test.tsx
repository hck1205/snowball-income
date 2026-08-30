// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useGoalBannerAnalytics } from '@/pages/Main/components';
import type { GoalOutcome } from '@/pages/Main/components';
import { findLandingGoal } from '@/shared/constants/landingGoals';
import { trackEvent } from '@/shared/lib/analytics';

/*
 * 🔴 모듈을 목한다. 실제 `trackEvent` 는 dev·localhost 에서 **아무것도 하지 않으므로**
 * (`isAnalyticsEnabled`), window.gtag 를 심어 두고 지켜보면 테스트가 늘 초록이면서 아무것도
 * 검증하지 못한다 — 이 저장소의 다른 계측 테스트가 전부 같은 이유로 모듈 목을 쓴다.
 */
vi.mock('@/shared/lib/analytics', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/lib/analytics')>();
  return { ...actual, trackEvent: vi.fn() };
});

/**
 * 목표 배너의 계측 계약.
 *
 * 🔴 이 이벤트가 재려는 것은 둘이다: ①`goal_selected` 의 **착지 확인**(눌렀는데 배너를 못 본
 * 사람이 있으면 경로가 새고 있다) ②`missed` 비율(높으면 목표값 자체가 비현실적이다).
 * 그래서 **판정이 바뀌면 다시 쏘고, 같은 판정은 다시 쏘지 않는다** — 리렌더는 정보가 아니다.
 */

const outcome = (goalId: string, status: GoalOutcome['status']): GoalOutcome => {
  const goal = findLandingGoal(goalId);
  if (!goal) throw new Error(`목표 데이터가 없다: ${goalId}`);
  return { goal, status, answer: '…', reachedInYears: null, landingEstimate: null };
};

const tracked = vi.mocked(trackEvent);

/** 이 배너가 내보낸 것만 고른다 — 다른 이벤트가 섞여도 단정이 흔들리지 않는다. */
const goalBannerCalls = () => tracked.mock.calls.filter((call) => call[0] === 'goal_banner_view');

beforeEach(() => {
  tracked.mockClear();
});

describe('목표 배너 계측', () => {
  it('판정이 나오면 목표와 상태를 함께 쏜다', () => {
    renderHook(() => useGoalBannerAnalytics(outcome('asset-100m', 'reached')));

    const calls = goalBannerCalls();
    expect(calls).toHaveLength(1);
    expect(calls[0][1]).toMatchObject({
      goal_id: 'asset-100m',
      goal_kind: 'asset',
      status: 'reached'
    });
  });

  it('🔴 같은 판정으로 리렌더돼도 다시 쏘지 않는다 — 리렌더는 정보가 아니다', () => {
    const value = outcome('dividend-100', 'missed');
    const { rerender } = renderHook(({ o }) => useGoalBannerAnalytics(o), {
      initialProps: { o: value }
    });

    rerender({ o: value });
    rerender({ o: { ...value } });

    expect(goalBannerCalls()).toHaveLength(1);
  });

  it('🔴 판정이 뒤집히면 다시 쏜다 — 종목을 담으면 unknown 이 reached 가 된다', () => {
    const { rerender } = renderHook(({ o }) => useGoalBannerAnalytics(o), {
      initialProps: { o: outcome('asset-300m', 'unknown') }
    });

    rerender({ o: outcome('asset-300m', 'reached') });

    const calls = goalBannerCalls();
    expect(calls).toHaveLength(2);
    expect(calls.map((call) => (call[1] as { status: string }).status)).toEqual(['unknown', 'reached']);
  });

  it('목표 없이 들어온 세션에서는 아무것도 쏘지 않는다', () => {
    renderHook(() => useGoalBannerAnalytics(null));

    expect(goalBannerCalls()).toHaveLength(0);
  });
});
