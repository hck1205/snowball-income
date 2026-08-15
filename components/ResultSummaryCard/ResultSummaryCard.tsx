import { memo, useCallback } from 'react';
import { Card, StatTile } from '@/components';
import { CompactSummaryHelpButton } from '@/components/common';
import ConditionStrip from '@/components/ConditionStrip';
import { useSetActiveHelpWrite } from '@/jotai';
import { ANALYTICS_EVENT, trackEvent } from '@/shared/lib/analytics';
import { TOUR_TARGET } from '@/shared/constants';
import type { ResultSummaryCardProps } from './ResultSummaryCard.types';
import { findTargetReachYearIndex, useGoalReachCelebration } from './ResultSummaryCard.utils';
import { HeroSlot, SummaryCardShell, SummaryGrid } from './ResultSummaryCard.styled';

/**
 * 결과 요약 카드 — 화면 첫 숫자.
 *
 * 이 화면의 **주역 카드**(`tone="raised"`) — 시뮬레이터에서 유일하다. 나머지 결과 카드는 전부
 * 본문(`default`)이고 "전량 매도한다면"만 부속(`sunken`)이다. 라이트에서는 그림자가, 다크에서는
 * 밝은 면(`surfaceRaised`)이 그 격을 만든다.
 *
 * 카드 **제목이 없다**(`title` 미전달 — `titleRight` 만 있어 헤더는 토글만 그린다). hero 숫자가
 * 카드의 첫 요소가 되어야 하기 때문이고, 구 제목이 말하던 "간편/정밀"은 아래 조건 스트립의
 * 마지막 항목이 대신 말한다. 결과 영역에서 **제목 없는 카드는 이 하나뿐**이라 예외가 아니라
 * 규칙으로 읽힌다 — 주역만 제목을 생략하고, 그 자리를 뜬 면이 대신 말한다.
 *
 * 목표는 여기서 **지표 한 칸**으로만 말한다. 도달 서사·진행률은 내 포트폴리오
 * (`/dividend/portfolio`)의 목표 달성 카드가 맡는다 — 같은 이야기를 두 화면이 하지 않는다.
 */
function ResultSummaryCardComponent({
  simulation,
  showQuickEstimate,
  isResultCompact,
  densityToggle,
  targetMonthlyDividend,
  formatResultAmount,
  formatPercent,
  targetYearLabel,
  condition,
  conditionAction,
  footnote
}: ResultSummaryCardProps) {
  const setActiveHelp = useSetActiveHelpWrite();
  const openMonthlyAverageDividendHelp = useCallback(() => {
    trackEvent(ANALYTICS_EVENT.CTA_CLICK, {
      cta_name: 'open_help_simulation_monthly_average_dividend',
      placement: 'simulation_result'
    });
    setActiveHelp('simulationMonthlyAverageDividend');
  }, [setActiveHelp]);
  const openRecentPayoutMonthDividendHelp = useCallback(() => {
    trackEvent(ANALYTICS_EVENT.CTA_CLICK, {
      cta_name: 'open_help_simulation_recent_payout_month_dividend',
      placement: 'simulation_result'
    });
    setActiveHelp('simulationRecentPayoutMonthDividend');
  }, [setActiveHelp]);

  const { summary } = simulation;
  const hasTarget = targetMonthlyDividend > 0;
  /* 도달 연도가 투자 몇 년차인지 — 목표 타일 hint용 표시 파생값(엔진 재계산 없음). */
  const yearsToReach = findTargetReachYearIndex(simulation.yearly, summary.targetMonthDividendReachedYear);
  /*
   * 목표 달성 = 목표를 세웠고(hasTarget) 도달 연도가 나왔을 때. 엔진 결과를 읽기만 한다.
   * `isCelebrating` 은 **세션 중 미달성 → 달성으로 넘어간 그 한 번**만 참이다(리렌더로 재생 안 됨).
   */
  const isTargetReached = hasTarget && summary.targetMonthDividendReachedYear !== undefined;
  const isCelebrating = useGoalReachCelebration(isTargetReached);

  return (
    /* 껍데기는 좌측 6px 얼굴색 레일만 소유한다 — 카드의 위계 선언(면·그림자)에는 손대지 않는다.
       카드에는 제목이 없고 우측 상단 토글만 있다 — `Card` 는 `titleRight` 만으로도 헤더를 그린다.
       hero 숫자가 곧 제목 역할을 하므로 글자 제목을 더하지 않는다(기존 결정 유지). */
    <SummaryCardShell>
      <Card tone="raised" dataTour={TOUR_TARGET.simulationResult} titleRight={densityToggle}>
        {showQuickEstimate ? (
          <SummaryGrid>
            <HeroSlot>
              <StatTile
                emphasis="hero"
                label="최종 자산 추정"
                value={formatResultAmount(simulation.quickEstimate.endValue, isResultCompact)}
              />
            </HeroSlot>
            <StatTile
              label="연 배당 추정(세후)"
              value={formatResultAmount(simulation.quickEstimate.annualDividendApprox, isResultCompact)}
            />
            <StatTile
              label="월 배당 추정(세후)"
              value={formatResultAmount(simulation.quickEstimate.monthlyDividendApprox, isResultCompact)}
            />
            <StatTile
              label="종료 시점 배당률(가격 기준)"
              value={formatPercent(simulation.quickEstimate.yieldOnPriceAtEnd)}
            />
          </SummaryGrid>
        ) : (
          <SummaryGrid>
            {/* 사용자가 이 앱을 켠 이유. 유일한 hero 지표다. */}
            <HeroSlot>
              <StatTile
                emphasis="hero"
                label="최종 자산 가치"
                value={formatResultAmount(summary.finalAssetValue, isResultCompact)}
              />
            </HeroSlot>
            <StatTile
              label="월배당(월평균: 연/12)"
              value={formatResultAmount(summary.finalMonthlyAverageDividend, isResultCompact)}
              action={
                <CompactSummaryHelpButton type="button" aria-label="월배당 설명" onClick={openMonthlyAverageDividendHelp}>
                  ?
                </CompactSummaryHelpButton>
              }
            />
            <StatTile
              label="최근 실지급 배당"
              value={formatResultAmount(summary.finalPayoutMonthDividend, isResultCompact)}
              action={
                <CompactSummaryHelpButton
                  type="button"
                  aria-label="최근 실지급 배당 설명"
                  onClick={openRecentPayoutMonthDividendHelp}
                >
                  ?
                </CompactSummaryHelpButton>
              }
            />
            <StatTile label="누적 순배당" value={formatResultAmount(summary.totalNetDividend, isResultCompact)} />
            <StatTile label="누적 세금" value={formatResultAmount(summary.totalTaxPaid, isResultCompact)} />
            {/*
              🔴 **ISA 시나리오에서만 뜬다 — 그리고 반드시 떠야 한다.** ISA 는 지급 때 세금을 떼지
                 않아 위 '누적 세금'이 0 으로 나오는데, 그것만 보면 세금이 없는 것처럼 읽힌다.
                 실제로는 사라진 게 아니라 종료 시점으로 **옮겨 온** 것이고, 그 값이 이 타일이다.
              ⚠ 과세계좌만 담은 시나리오에서는 0 이라 렌더하지 않는다 — 늘 0 인 타일은 잡음이다.
            */}
            {summary.isaSettlementTax > 0 ? (
              <StatTile
                label="ISA 종료 정산세"
                value={formatResultAmount(summary.isaSettlementTax, isResultCompact)}
                /*
                 * 🔴 한계를 **화면이 말한다.** 비과세 한도 200만원은 실제로는 **계좌당**인데 이
                 *    시뮬레이터는 종목마다 적용한다("어느 종목이 같은 계좌인가"라는 입력이 없다).
                 *    ISA 에 여러 종목을 담으면 한도가 종목 수만큼 늘어난 셈이라 **세금을 실제보다
                 *    적게** 잡는다 — 과소추정이라 반드시 밝혀야 하는 방향이다.
                 */
                hint="비과세 한도 200만원을 종목마다 적용한 추정입니다. 실제로는 계좌당 한도라 여러 종목을 담으면 세금이 이보다 클 수 있습니다."
              />
            ) : null}
            <StatTile
              label={
                hasTarget
                  ? `목표 월배당 도달 (${formatResultAmount(targetMonthlyDividend, isResultCompact)})`
                  : '목표 월배당'
              }
              value={hasTarget ? targetYearLabel(summary.targetMonthDividendReachedYear) : '미설정'}
              /*
               * 달성 순간의 유일한 연출. 색은 **타일 면과 체크 글리프만** 바뀌고 도달 연도 숫자는
               * 계속 중립이다(숫자에 상태색 금지). 접근명이 붙어 색·모션 없이도 읽힌다.
               */
              status={isTargetReached ? 'success' : undefined}
              /*
               * 접근명이 **"달성"**(앞에 "목표"를 붙이지 않음)인 이유: 이 카드에는 "목표"라는 이름을
               * 가진 그래픽이 존재하면 안 된다는 부재 계약이 있다(구 원형 게이지가 여기로 되살아나는
               * 것을 막는 가드 — test/snowball/simulationResultTargetNarrativeRemoved.test.tsx).
               * 낭독 순서상 바로 뒤에 "목표 월배당 도달 (…)" 라벨이 오므로 문맥은 온전하다.
               */
              statusLabel="달성"
              statusEnter={isCelebrating}
              /*
               * "몇 년 뒤"는 값이 아니라 hint로 붙인다 — 값(TileValue)은 nowrap+ellipsis라
               * "2028년 (투자 3년차)"를 넣으면 잘린다.
               */
              hint={hasTarget && yearsToReach !== undefined ? `투자 ${yearsToReach}년차` : undefined}
            />
          </SummaryGrid>
        )}

        <ConditionStrip items={condition} action={conditionAction} />
        {footnote}
      </Card>
    </SummaryCardShell>
  );
}

const ResultSummaryCard = memo(ResultSummaryCardComponent);

export default ResultSummaryCard;
