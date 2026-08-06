import { useCallback, useEffect, useRef } from 'react';
import type { SimulationOutput } from '@/shared/types';
import { ANALYTICS_EVENT, trackEvent } from '@/shared/lib/analytics';

type ResultViewAnalyticsInput = {
  simulation: SimulationOutput | null;
  includedTickerCount: number;
  durationYears: number;
  showQuickEstimate: boolean;
  showSplitGraphs: boolean;
  isYearlyAreaFillOn: boolean;
  postInvestmentRowCount: number;
};

/**
 * 결과 화면의 조회 계측. **화면을 그리는 코드에서 떼어 둔다** — 계측이 늘어날 때마다 배치 컴포넌트가
 * 두꺼워지면 "무엇이 어디에 그려지는가"가 이벤트 발화 조건에 묻힌다.
 *
 * 결과가 사라지면(포트폴리오 비움) "1회" 플래그를 리셋해, 다시 결과가 나올 때 새 세션 조회로 센다.
 *
 * ## 🔴 `chart_view` 는 한때 사용자당 143회였다 (2026-08-07 GA4 실측으로 발견)
 * 28일간 6,985회 / 49명. 원인은 세 효과가 전부 **`simulation` 객체 참조**를 의존성에 두고 있었던
 * 것이다 — 슬라이더를 한 칸 움직일 때마다 시뮬레이션이 재계산되어 새 객체가 나오고, 차트 옵션은
 * 하나도 안 바뀌었는데 셋이 동시에 다시 발화했다(같은 기간 입력 변경 이벤트가 약 2,800회다).
 *
 * 그 값으로는 아무것도 못 읽는다. "차트별 관심도"를 재려는 이벤트가 실제로는 **입력을 몇 번
 * 만졌는가**를 세고 있었고, 그건 `allocation_changed`·`investment_setting_changed` 가 이미 센다.
 *
 * 처방: **같은 (차트, 옵션) 조합은 결과 한 번당 한 번만 보낸다.** 옵션이 실제로 바뀌면 그때
 * 새 조합으로 한 번 더 보내고, 되돌아오면 이미 보낸 조합이라 조용하다.
 * ⚠ "마지막 값만 기억"이 아니라 **본 조합을 전부 기억**하는 것이 요점이다 — 마지막 값만 기억하면
 *   fill↔line 을 스무 번 왕복할 때 스무 번 발화해 같은 폭주가 작은 규모로 되돌아온다.
 * 결과가 사라지면 기억을 지워 다음 결과를 새 조회로 센다.
 * ⚠ 그래서 의존성 배열에 `simulation` 이 아니라 `hasSimulation`(불리언)이 들어간다 — 이 구분이
 *   이 수정의 전부다. 되돌리면 같은 폭주가 그대로 돌아온다.
 */
export function useResultViewAnalytics({
  simulation,
  includedTickerCount,
  durationYears,
  showQuickEstimate,
  showSplitGraphs,
  isYearlyAreaFillOn,
  postInvestmentRowCount
}: ResultViewAnalyticsInput): void {
  const hasTrackedSimulationRef = useRef(false);
  const hasTrackedPortfolioConfigRef = useRef(false);
  /** 이 결과에서 **이미 보낸 (차트, 옵션) 조합들**. 집합이라 왕복 토글이 다시 세지 않는다. */
  const sentChartViewsRef = useRef<Set<string>>(new Set());

  const hasSimulation = simulation !== null;

  const trackChart = useCallback((chartName: string, params: Record<string, string | boolean>) => {
    const signature = `${chartName}:${JSON.stringify(params)}`;
    if (sentChartViewsRef.current.has(signature)) return;
    sentChartViewsRef.current.add(signature);
    trackEvent(ANALYTICS_EVENT.CHART_VIEW, { chart_name: chartName, ...params });
  }, []);

  useEffect(() => {
    if (!simulation) {
      hasTrackedSimulationRef.current = false;
      hasTrackedPortfolioConfigRef.current = false;
      /* 결과가 사라졌다 = 다음 결과는 새 조회다. 차트 기억도 함께 지운다. */
      sentChartViewsRef.current = new Set();
      return;
    }

    if (!hasTrackedSimulationRef.current) {
      trackEvent(ANALYTICS_EVENT.SIMULATION_RESULT_VIEW, {
        included_ticker_count: includedTickerCount,
        duration_years: durationYears,
        show_quick_estimate: showQuickEstimate
      });
      hasTrackedSimulationRef.current = true;
    }

    if (!hasTrackedPortfolioConfigRef.current) {
      trackEvent(ANALYTICS_EVENT.PORTFOLIO_CONFIG_COMPLETED, {
        included_ticker_count: includedTickerCount,
        has_split_graphs: showSplitGraphs
      });
      hasTrackedPortfolioConfigRef.current = true;
    }
  }, [durationYears, includedTickerCount, showQuickEstimate, showSplitGraphs, simulation]);

  useEffect(() => {
    if (!hasSimulation) return;
    trackChart('yearly_result', { mode: isYearlyAreaFillOn ? 'fill' : 'line' });
  }, [hasSimulation, isYearlyAreaFillOn, trackChart]);

  useEffect(() => {
    if (!hasSimulation || !showSplitGraphs) return;
    trackChart('split_graphs', { visible: true });
  }, [hasSimulation, showSplitGraphs, trackChart]);

  useEffect(() => {
    if (!hasSimulation || postInvestmentRowCount === 0) return;
    trackChart('post_investment_monthly_dividend_projection', { visible: true });
  }, [hasSimulation, postInvestmentRowCount, trackChart]);
}
