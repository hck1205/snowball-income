import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { TickerPageShell } from '@/pages/Ticker/components';
import { useDocumentMeta } from '@/pages/Ticker/hooks';
import { createResultAmountFormatter } from '@/pages/Main/utils';
import { useDisplayCurrencyViewAtomValue, useFxRateSync } from '@/jotai';
import { ANALYTICS_EVENT, track, trackEvent } from '@/shared/lib/analytics';
import { FOCUS_TARGET_MONTHLY_DIVIDEND_STATE, buildFocusTargetMonthlyDividendState } from '@/shared/constants';
import { GOAL_COPY } from '../copy';
import { useGoalScenario } from '../hooks';
import GoalPageView from './GoalPage.view';
import type { GoalPageProps } from './GoalPage.types';
import { buildGoalLiveMessage, buildGoalViewModel, toProgressBucket } from './GoalPage.utils';

const copy = GOAL_COPY;

/**
 * `/dividend/goal` 컨테이너 — 읽기 전용 훅 + 표시 통화를 조립해 순수 뷰에 넘긴다.
 *
 * ## 이 화면은 아무것도 저장하지 않는다
 * 시뮬레이터 밖에는 자동저장·클라우드 동기화 루프가 마운트돼 있지 않다. 그래서 목표 편집은
 * "값 쓰기"가 아니라 **시뮬레이터로 이동 + 목표 입력 포커스**로 처리한다(location state 1개,
 * 해시·쿼리 미사용 — 경로 기반 라우팅 유지). 수신 배선은 `MainRightPanel`이 갖고 있다.
 */
export default function GoalPage({ now }: GoalPageProps = {}) {
  const navigate = useNavigate();
  const goal = useGoalScenario(now ? { now } : {});

  /*
   * 환율 조회 드라이버. 시뮬레이터(pages/Main)와 **같은 atom**을 채우지만, 라우트가 배타적이라
   * 두 곳이 동시에 마운트되지는 않는다. 이 페이지로 직접 들어온 사용자도 표시 통화 선호(달러)를
   * 그대로 볼 수 있게 하려면 여기서도 한 번 받아와야 한다(조회 실패 시 원화로 떨어질 뿐 깨지지 않는다).
   */
  useFxRateSync();
  const display = useDisplayCurrencyViewAtomValue();

  /*
   * 표시 통화는 **읽기만** 한다(이 화면에 통화 토글은 없다 — 확정 결정). 계산은 언제나 원화이고
   * 포맷터가 표시 직전에 한 번 환산한다. `compact=false`(정확 표기) 고정: 월배당은 억 단위가 아니라
   * 만~백만원 대라 축약하면 오히려 목표와의 차이가 안 보인다.
   */
  const formatAmount = useMemo(() => {
    const format = createResultAmountFormatter(display.currency, display.rate);
    return (value: number) => format(value, false);
  }, [display.currency, display.rate]);

  useDocumentMeta({
    title: copy.meta.title,
    description: copy.meta.description,
    pathname: copy.meta.pathname
  });

  const viewModel = useMemo(() => buildGoalViewModel({ goal, formatAmount }), [goal, formatAmount]);
  const liveMessage = useMemo(() => buildGoalLiveMessage(goal), [goal]);

  /*
   * 위젯 노출 계측 — **하이드레이션이 끝난 뒤 1회만**. 로딩 상태에서 쏘면 has_target이 항상 false로
   * 기록돼 목표 설정률이 0으로 왜곡된다. ref 가드로 재계산·리렌더에서 중복 발화하지 않는다.
   */
  const hasTrackedViewRef = useRef(false);
  useEffect(() => {
    if (goal.isLoading || hasTrackedViewRef.current) return;
    hasTrackedViewRef.current = true;

    track(ANALYTICS_EVENT.GOAL_WIDGET_VIEW, {
      has_target: goal.hasTarget,
      // 목표가 없으면 달성률·도달 여부는 "0"이 아니라 **해당 없음**이다 — 아예 보내지 않는다.
      ...(goal.hasTarget
        ? {
            /*
             * 버킷은 **지금 화면에 보이는 달성률**을 따른다 — `isAlreadyReached`(현재 달성)만 넘긴다.
             * 여기에 `reachedMonth !== null`(미래 언젠가 도달)을 섞으면 달성률 5%짜리 시나리오도
             * 'reached'로 기록돼 진행 분포가 무의미해지고 `reached_in_range`와 값이 겹친다(qa 발견).
             */
            progress_bucket: toProgressBucket(goal.progressPercent ?? 0, goal.isAlreadyReached),
            reached_in_range: goal.reachedMonth !== null || goal.isAlreadyReached
          }
        : {})
    });
  }, [goal.hasTarget, goal.isAlreadyReached, goal.isLoading, goal.progressPercent, goal.reachedMonth]);

  /** B·D·G의 CTA — 목표 포커스 없이 시뮬레이터로. */
  const handleOpenSimulator = useCallback(() => {
    trackEvent(ANALYTICS_EVENT.CTA_CLICK, { cta_name: 'goal_open_simulator', placement: 'goal_page' });
    navigate('/');
  }, [navigate]);

  /** C의 CTA와 [목표 수정] — 시뮬레이터로 이동한 뒤 목표 입력에 포커스를 요청한다(값 없음). */
  const handleOpenTargetSetup = useCallback(() => {
    trackEvent(ANALYTICS_EVENT.CTA_CLICK, { cta_name: 'goal_set_target', placement: 'goal_page' });
    navigate('/', { state: FOCUS_TARGET_MONTHLY_DIVIDEND_STATE });
  }, [navigate]);

  /**
   * 칩·직접 입력으로 고른 목표를 **시뮬레이터에 실어 보낸다**(여기서 저장하지 않는다).
   *
   * 값은 라우터 state로만 넘어가고, 실제 커밋(`setField`)은 하이드레이션이 끝난 뒤의 시뮬레이터
   * 결과 패널에서 한 번 일어난다 — 그래야 자동저장·클라우드 동기화가 정상 경로로 따라온다.
   * 값 자체의 검증은 보내는 쪽(`buildFocusTargetMonthlyDividendState`)과 받는 쪽이 같은 함수를 쓴다.
   */
  const handleCommitTarget = useCallback(
    (won: number) => {
      trackEvent(ANALYTICS_EVENT.CTA_CLICK, { cta_name: 'goal_set_target', placement: 'goal_page' });
      navigate('/', { state: buildFocusTargetMonthlyDividendState(won) });
    },
    [navigate]
  );

  return (
    <TickerPageShell>
      <GoalPageView
        viewModel={viewModel}
        liveMessage={liveMessage}
        onOpenSimulator={handleOpenSimulator}
        onOpenTargetSetup={handleOpenTargetSetup}
        onCommitTarget={handleCommitTarget}
      />
    </TickerPageShell>
  );
}
