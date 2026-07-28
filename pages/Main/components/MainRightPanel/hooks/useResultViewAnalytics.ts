import { useEffect, useRef } from 'react';
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

  useEffect(() => {
    if (!simulation) {
      hasTrackedSimulationRef.current = false;
      hasTrackedPortfolioConfigRef.current = false;
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
    if (!simulation) return;
    trackEvent(ANALYTICS_EVENT.CHART_VIEW, {
      chart_name: 'yearly_result',
      mode: isYearlyAreaFillOn ? 'fill' : 'line'
    });
  }, [isYearlyAreaFillOn, simulation]);

  useEffect(() => {
    if (!simulation || !showSplitGraphs) return;
    trackEvent(ANALYTICS_EVENT.CHART_VIEW, {
      chart_name: 'split_graphs',
      visible: true
    });
  }, [showSplitGraphs, simulation]);

  useEffect(() => {
    if (!simulation || postInvestmentRowCount === 0) return;
    trackEvent(ANALYTICS_EVENT.CHART_VIEW, {
      chart_name: 'post_investment_monthly_dividend_projection',
      visible: true
    });
  }, [postInvestmentRowCount, simulation]);
}
