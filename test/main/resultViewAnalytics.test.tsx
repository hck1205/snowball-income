import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useResultViewAnalytics } from '@/pages/Main/components/MainRightPanel/hooks';
import { ANALYTICS_EVENT, trackEvent } from '@/shared/lib/analytics';
import type { SimulationOutput } from '@/shared/types';

vi.mock('@/shared/lib/analytics', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/shared/lib/analytics')>();
  return { ...actual, trackEvent: vi.fn() };
});

/**
 * 결과 화면 계측의 **발화 횟수** 계약.
 *
 * 🔴 이 파일이 있는 이유는 실측 사고다. `chart_view` 가 28일간 6,985회 / 49명 = **사용자당 143회**
 * 였다(2026-08-07 GA4). 세 효과가 `simulation` **객체 참조**를 의존성에 두어, 슬라이더를 한 칸
 * 움직일 때마다 새 객체가 나오고 차트 옵션은 그대로인데 셋이 다시 발화했다.
 *
 * 🔴 **유닛테스트도 화면도 이 결함을 못 봤다.** 이벤트는 눈에 보이지 않고 렌더 결과도 같다 —
 * GA4 를 열어 보기 전까지 아무도 몰랐다. 그래서 여기서 횟수를 센다.
 */
const simulationOf = (marker: number) => ({ marker }) as unknown as SimulationOutput;

type Props = {
  simulation: SimulationOutput | null;
  includedTickerCount: number;
  durationYears: number;
  showQuickEstimate: boolean;
  showSplitGraphs: boolean;
  isYearlyAreaFillOn: boolean;
  postInvestmentRowCount: number;
};

const baseProps = {
  includedTickerCount: 3,
  durationYears: 10,
  showQuickEstimate: false,
  showSplitGraphs: false,
  isYearlyAreaFillOn: false,
  postInvestmentRowCount: 0
};

const chartCalls = () =>
  vi.mocked(trackEvent).mock.calls.filter(([event]) => event === ANALYTICS_EVENT.CHART_VIEW);

beforeEach(() => {
  vi.mocked(trackEvent).mockClear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('chart_view 발화 횟수', () => {
  /**
   * 🔴 이 단정이 사고를 직접 재현한다. `simulation` 을 의존성으로 되돌리면 5회가 되어 빨개진다.
   */
  it('시뮬레이션이 재계산돼도 차트 옵션이 그대로면 다시 보내지 않는다', () => {
    const { rerender } = renderHook<void, Props>((props) => useResultViewAnalytics(props), {
      initialProps: { ...baseProps, simulation: simulationOf(1) }
    });

    expect(chartCalls()).toHaveLength(1);

    // 입력을 만질 때마다 엔진이 새 결과 객체를 준다 — 차트 옵션은 하나도 안 바뀌었다.
    rerender({ ...baseProps, simulation: simulationOf(2) });
    rerender({ ...baseProps, simulation: simulationOf(3) });
    rerender({ ...baseProps, simulation: simulationOf(4) });

    expect(chartCalls()).toHaveLength(1);
  });

  it('차트 옵션이 실제로 바뀌면 그때는 다시 보낸다', () => {
    const { rerender } = renderHook<void, Props>((props) => useResultViewAnalytics(props), {
      initialProps: { ...baseProps, simulation: simulationOf(1) }
    });

    expect(chartCalls()).toHaveLength(1);

    rerender({ ...baseProps, simulation: simulationOf(1), isYearlyAreaFillOn: true });
    expect(chartCalls()).toHaveLength(2);
    expect(chartCalls()[1]?.[1]).toMatchObject({ chart_name: 'yearly_result', mode: 'fill' });

    // 같은 옵션으로 되돌아가도 "그 조합은 이미 보냈다" — 왕복할 때마다 세지 않는다.
    rerender({ ...baseProps, simulation: simulationOf(1), isYearlyAreaFillOn: false });
    expect(chartCalls()).toHaveLength(2);
  });

  it('차트가 늘어나면 그 차트만 한 번 더 보낸다', () => {
    const { rerender } = renderHook<void, Props>((props) => useResultViewAnalytics(props), {
      initialProps: { ...baseProps, simulation: simulationOf(1) }
    });

    rerender({ ...baseProps, simulation: simulationOf(1), showSplitGraphs: true, postInvestmentRowCount: 12 });

    const names = chartCalls().map(([, params]) => (params as { chart_name: string }).chart_name);
    expect(names).toEqual(['yearly_result', 'split_graphs', 'post_investment_monthly_dividend_projection']);
  });

  it('결과가 사라졌다 다시 나오면 새 조회로 센다', () => {
    const { rerender } = renderHook<void, Props>((props) => useResultViewAnalytics(props), {
      initialProps: { ...baseProps, simulation: simulationOf(1) }
    });

    expect(chartCalls()).toHaveLength(1);

    rerender({ ...baseProps, simulation: null });
    rerender({ ...baseProps, simulation: simulationOf(2) });

    expect(chartCalls()).toHaveLength(2);
  });
});

describe('핵심 퍼널 이벤트는 결과당 한 번이다', () => {
  it('simulation_result_view · portfolio_config_completed 가 재계산마다 늘지 않는다', () => {
    const { rerender } = renderHook<void, Props>((props) => useResultViewAnalytics(props), {
      initialProps: { ...baseProps, simulation: simulationOf(1) }
    });

    rerender({ ...baseProps, simulation: simulationOf(2) });
    rerender({ ...baseProps, simulation: simulationOf(3) });

    const count = (name: string) => vi.mocked(trackEvent).mock.calls.filter(([event]) => event === name).length;
    expect(count(ANALYTICS_EVENT.SIMULATION_RESULT_VIEW)).toBe(1);
    expect(count(ANALYTICS_EVENT.PORTFOLIO_CONFIG_COMPLETED)).toBe(1);
  });
});
