import { describe, expect, it } from 'vitest';
import { Provider } from 'jotai/react';
import { createStore } from 'jotai/vanilla';
import { render, screen } from '@testing-library/react';
import SimulationResult from '@/components/SimulationResult';
import { formatPercent, formatResultAmount, targetYearLabel } from '@/pages/Main/utils';
import type { SimulationOutput, SimulationSummary } from '@/shared/types';

/**
 * **부재 계약**: 시뮬레이터 결과 카드는 목표를 서사로 말하지 않는다.
 *
 * 목표 달성 표면(서사·진행률·빠른 설정 CTA)은 내 포트폴리오(`/dividend/portfolio`)의 목표 달성
 * 카드로 이관됐다 — 두 화면이 같은 이야기를 하면 사용자는 어느 쪽이 정본인지 모른다.
 * 카드에 남는 것은 **지표 한 칸**(목표 월배당 타일)뿐이다.
 *
 * 부재는 "안 보인다"로만 증명된다. 상태 셋(미설정/미도달/도달) 각각에서 되살아남을 막는다 —
 * 서사 문장·진행률(role=progressbar)·게이지 토글·게이지(role=img)·빠른 설정 칩 행 전부.
 */

const buildSummary = (overrides: Partial<SimulationSummary> = {}): SimulationSummary => ({
  finalAssetValue: 1_137_786_866,
  finalAnnualDividend: 30_769_261,
  finalMonthlyAverageDividend: 2_564_105,
  finalPayoutMonthDividend: 8_000_000,
  totalContribution: 190_000_000,
  totalNetDividend: 290_712_891,
  totalTaxPaid: 52_919_368,
  targetMonthDividendReachedYear: undefined,
  totalCostBasis: 480_712_891,
  unrealizedGain: 657_073_975,
  estimatedCapitalGainsTax: 144_006_274,
  afterCapitalGainsTaxValue: 993_780_591,
  ...overrides
});

const buildYearly = (years: number[]): SimulationOutput['yearly'] =>
  years.map((year) => ({ year }) as SimulationOutput['yearly'][number]);

type RenderOptions = {
  targetMonthlyDividend?: number;
  summary?: Partial<SimulationSummary>;
};

const renderResult = ({ targetMonthlyDividend = 3_000_000, summary = {} }: RenderOptions = {}) => {
  render(
    <Provider store={createStore()}>
      <SimulationResult
        simulation={{
          monthly: [],
          yearly: buildYearly([2026, 2027, 2028]),
          summary: buildSummary(summary),
          quickEstimate: {
            endValue: 1_100_000_000,
            monthlyDividendApprox: 2_500_000,
            annualDividendApprox: 30_000_000,
            yieldOnPriceAtEnd: 0.0334
          }
        }}
        showQuickEstimate={false}
        isResultCompact={false}
        targetMonthlyDividend={targetMonthlyDividend}
        onToggleCompact={() => undefined}
        formatResultAmount={formatResultAmount}
        formatPercent={formatPercent}
        targetYearLabel={targetYearLabel}
      />
    </Provider>
  );
};

/** 상태와 무관하게 이 카드에 없어야 하는 것들. */
const expectNoGoalNarrativeSurface = () => {
  // 서사 문장 셋(미설정 안내 / 미도달 / 도달).
  expect(screen.queryByText(/도달 시점과 진행률을 함께 보여줘요/)).not.toBeInTheDocument();
  expect(screen.queryByText(/닿지 못해요/)).not.toBeInTheDocument();
  expect(screen.queryByText(/달성해요/)).not.toBeInTheDocument();
  // 진행률 표시(수평 바·원형 게이지)와 그 토글.
  expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  expect(screen.queryByRole('checkbox', { name: '진행률 게이지로 보기' })).not.toBeInTheDocument();
  expect(screen.queryByRole('img', { name: /목표/ })).not.toBeInTheDocument();
  // 목표 미설정 CTA(빠른 설정 칩 + 직접 입력).
  expect(screen.queryByRole('group', { name: '목표 월배당 빠른 설정' })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: '직접 입력' })).not.toBeInTheDocument();
};

describe('시뮬레이터 결과 카드 — 목표 서사/진행률 표면 부재', () => {
  it('목표 미설정(target=0)에서 서사도 CTA도 없다 — 타일만 "미설정"으로 말한다', () => {
    renderResult({ targetMonthlyDividend: 0, summary: { targetMonthDividendReachedYear: 2028 } });

    expectNoGoalNarrativeSurface();
    expect(screen.getByText('목표 월배당')).toBeInTheDocument();
    expect(screen.getByText('미설정')).toBeInTheDocument();
  });

  it('목표 미도달(target>0, 도달 연도 없음)에서 서사도 진행률도 없다', () => {
    renderResult({ targetMonthlyDividend: 3_000_000, summary: { targetMonthDividendReachedYear: undefined } });

    expectNoGoalNarrativeSurface();
    expect(screen.getByText('미도달')).toBeInTheDocument();
  });

  it('목표 도달(도달 연도 있음)에서도 축하 서사 없이 연도만 말한다', () => {
    renderResult({ targetMonthlyDividend: 3_000_000, summary: { targetMonthDividendReachedYear: 2028 } });

    expectNoGoalNarrativeSurface();
    expect(screen.getByText('2028년')).toBeInTheDocument();
  });

  it('결과 상세도 토글("간략히")은 목표와 무관하게 남는다 — 카드 자체가 사라진 게 아니다', () => {
    renderResult();

    expect(screen.getByRole('checkbox', { name: '결과 간략히 보기' })).toBeInTheDocument();
    expect(screen.getByText('최종 자산 가치')).toBeInTheDocument();
  });
});
