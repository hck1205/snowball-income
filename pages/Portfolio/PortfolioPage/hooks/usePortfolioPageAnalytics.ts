import { useEffect, useRef } from 'react';
import { ANALYTICS_EVENT, bucketValue, track } from '@/shared/lib/analytics';
import type { PortfolioSummary } from '@/shared/lib/portfolio';
import { toProgressBucket } from '../../components';
import type { PortfolioGoalCardModel } from '../../components';
import type { PortfolioHoldingsStatus } from '../../hooks';

type UsePortfolioPageAnalyticsInput = {
  status: PortfolioHoldingsStatus;
  holdingsCount: number;
  summary: PortfolioSummary;
  goalModel: PortfolioGoalCardModel | null;
  /**
   * GA `portfolio_summary_view`의 평가금액 버킷 경계(USD). 정의는 `PortfolioPage.utils`(뷰모델
   * 계층)에 그대로 두고 컨테이너가 주입한다 — 이 훅(nested `hooks/`)은 형제 폴더 최상위 파일을
   * 직접 열어보지 않는다(`MainRightPanel/hooks` 와 같은 캡슐화 규칙).
   */
  valueBucketEdgesUsd: readonly number[];
};

/**
 * `/dividend/portfolio` 진입·요약·목표 카드 노출 계측 — **화면을 그리는 코드에서 떼어 둔다**
 * (`MainRightPanel`의 `useResultViewAnalytics`와 같은 이유). 컨테이너는 무엇을 넘길지만 고르고,
 * "언제 1회만 쏘는가" 판정은 여기 ref 3개가 갖는다.
 *
 * 세 계측의 발화 조건이 서로 다르다 — 로딩 상태를 공통으로 걸러내되:
 * - 진입: 하이드레이션이 끝나면 즉시(보유 0종이어도).
 * - 요약: 보유가 1종 이상 있을 때만(빈 화면은 요약이 없다).
 * - 목표: 카드가 값과 함께 실제로 떴을 때만(로딩 골격·미노출 상태에서는 쏘지 않는다).
 */
export function usePortfolioPageAnalytics({
  status,
  holdingsCount,
  summary,
  goalModel,
  valueBucketEdgesUsd
}: UsePortfolioPageAnalyticsInput): void {
  const hasTrackedViewRef = useRef(false);
  useEffect(() => {
    if (status === 'loading' || hasTrackedViewRef.current) return;
    hasTrackedViewRef.current = true;

    track(ANALYTICS_EVENT.PORTFOLIO_VIEW, { holdings_count: holdingsCount, has_holdings: holdingsCount > 0 });
  }, [holdingsCount, status]);

  const hasTrackedSummaryRef = useRef(false);
  useEffect(() => {
    if (status === 'loading' || hasTrackedSummaryRef.current || holdingsCount === 0) return;
    hasTrackedSummaryRef.current = true;

    track(ANALYTICS_EVENT.PORTFOLIO_SUMMARY_VIEW, {
      holdings_count: holdingsCount,
      covered_count: summary.counts.included,
      // 금액 원값은 싣지 않는다 — 환율과 무관하게 비교되도록 **달러 기준** 버킷만 보낸다.
      value_bucket: bucketValue(summary.totalValueUsd, valueBucketEdgesUsd)
    });
  }, [holdingsCount, status, summary, valueBucketEdgesUsd]);

  /*
   * 목표 카드 노출 계측 — **카드가 실제로 값과 함께 떴을 때 1회만**. 로딩 골격에서 쏘면 has_target 이
   * 항상 false 로 기록돼 목표 설정률이 0 으로 왜곡되고, 카드가 아예 안 뜨는 상태(보유 0 + 목표 없음,
   * 시뮬 읽기 실패)에서는 발화하지 않는다. `holdings_count`·`value_bucket` 은 **다시 싣지 않는다** —
   * 같은 세션의 `portfolio_summary_view` 로 조인한다(중복 파라미터 회피).
   */
  const hasTrackedGoalRef = useRef(false);
  useEffect(() => {
    if (goalModel === null || goalModel.isLoading || hasTrackedGoalRef.current) return;
    hasTrackedGoalRef.current = true;

    track(ANALYTICS_EVENT.GOAL_WIDGET_VIEW, {
      has_target: goalModel.hasTarget,
      current_basis: goalModel.currentBasis,
      // 목표가 없으면 달성률·도달 여부는 "0"이 아니라 **해당 없음**이다 — 아예 보내지 않는다.
      ...(goalModel.hasTarget
        ? {
            /*
             * 버킷은 **지금 화면에 보이는 달성률**을 따른다 — 도달 판정으로 `reachedInRange`(미래 언젠가
             * 도달)를 섞으면 달성률 5%짜리도 'reached'로 기록돼 진행 분포가 무의미해진다.
             */
            progress_bucket: toProgressBucket(goalModel.progressPercent ?? 0, goalModel.isAlreadyReached),
            reached_in_range: goalModel.reachedInRange
          }
        : {})
    });
  }, [goalModel]);
}
