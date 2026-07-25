import { describe, expect, it, vi } from 'vitest';
import { Provider } from 'jotai/react';
import { createStore } from 'jotai/vanilla';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SimulationResult from '@/components/SimulationResult';
import { createResultAmountFormatter, formatPercent, formatResultAmount, targetYearLabel } from '@/pages/Main/utils';
import type { SimulationOutput, SimulationSummary } from '@/shared/types';

/**
 * 목표 **미설정** 상태의 빠른 설정 CTA + 도달 년차 hint + 통화 정합.
 *
 * 이 카드의 서사는 목표가 없으면 "정하면 보여줘요"로 끝나 막다른 길이었다 — 그 자리에 칩/직접입력을
 * 붙였으므로, 여기서 보는 것은 **행동의 결과**다: 어떤 값이 위로 올라가는가(원 단위), 칩이 사라진 뒤
 * 포커스가 어디로 가는가, 콜백이 없는 격리 렌더에서 액션 행이 조용히 빠지는가.
 * 금액 문자열은 하드코딩하지 않고 **주입한 포맷터**로 만들어 비교한다(통화 모드에 묶이지 않게).
 */

const UNSET_NARRATIVE = '목표 월배당을 정하면 도달 시점과 진행률을 함께 보여줘요.';
const QUICK_SET_GROUP = '목표 월배당 빠른 설정';

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

const buildSimulation = (summary: SimulationSummary, yearly: SimulationOutput['yearly']): SimulationOutput => ({
  monthly: [],
  yearly,
  summary,
  quickEstimate: {
    endValue: 1_100_000_000,
    monthlyDividendApprox: 2_500_000,
    annualDividendApprox: 30_000_000,
    yieldOnPriceAtEnd: 0.0334
  }
});

type RenderOptions = {
  summary?: Partial<SimulationSummary>;
  yearly?: SimulationOutput['yearly'];
  targetMonthlyDividend?: number;
  /** `null`이면 프롭 자체를 넘기지 않는다(= 미배선 격리 렌더). */
  onQuickSetTarget?: ((won: number) => void) | null;
  onOpenTargetField?: (() => void) | null;
  formatAmount?: (value: number, compact: boolean) => string;
};

const renderResult = ({
  summary = {},
  yearly = [],
  targetMonthlyDividend = 0,
  onQuickSetTarget = vi.fn(),
  onOpenTargetField = vi.fn(),
  formatAmount = formatResultAmount
}: RenderOptions = {}) => {
  render(
    <Provider store={createStore()}>
      <SimulationResult
        simulation={buildSimulation(buildSummary(summary), yearly)}
        showQuickEstimate={false}
        isResultCompact={false}
        targetMonthlyDividend={targetMonthlyDividend}
        onToggleCompact={() => undefined}
        formatResultAmount={formatAmount}
        formatPercent={formatPercent}
        targetYearLabel={targetYearLabel}
        {...(onQuickSetTarget ? { onQuickSetTarget } : null)}
        {...(onOpenTargetField ? { onOpenTargetField } : null)}
      />
    </Provider>
  );

  return { user: userEvent.setup(), onQuickSetTarget, onOpenTargetField };
};

const quickSetGroup = () => screen.getByRole('group', { name: QUICK_SET_GROUP });

describe('목표 미설정 CTA — 빠른 설정 칩', () => {
  it('세 가지 빠른 목표와 직접 입력이 한 행에 함께 놓인다', () => {
    renderResult();

    const group = quickSetGroup();
    expect(within(group).getByRole('button', { name: '월 100만원' })).toBeInTheDocument();
    expect(within(group).getByRole('button', { name: '월 300만원' })).toBeInTheDocument();
    expect(within(group).getByRole('button', { name: '월 500만원' })).toBeInTheDocument();
    expect(within(group).getByRole('button', { name: '직접 입력' })).toBeInTheDocument();
  });

  it.each([
    ['월 100만원', 1_000_000],
    ['월 300만원', 3_000_000],
    ['월 500만원', 5_000_000]
  ])('"%s" 칩은 원 단위 %d 을(를) 그대로 올려보낸다', async (label, won) => {
    const { user, onQuickSetTarget } = renderResult();

    await user.click(within(quickSetGroup()).getByRole('button', { name: label }));

    // 만원 단위/문자열이 아니라 폼이 그대로 쓰는 원 단위 숫자여야 한다.
    expect(onQuickSetTarget).toHaveBeenCalledTimes(1);
    expect(onQuickSetTarget).toHaveBeenCalledWith(won);
  });

  it('칩을 누르면 (칩이 사라질 자리 대신) 바뀐 서사 문장으로 포커스가 옮겨간다', async () => {
    const { user } = renderResult();

    await user.click(within(quickSetGroup()).getByRole('button', { name: '월 100만원' }));

    // 포커스가 body로 떨어지면 키보드 사용자가 맥락을 잃는다.
    // 포커스는 문장이 갱신된 다음 프레임에 온다(동기로 주면 스크린리더가 옛 문장을 읽는다).
    await waitFor(() => expect(screen.getByText(UNSET_NARRATIVE)).toHaveFocus());
  });

  it('"직접 입력"은 값을 정하지 않고 입력 필드로 안내만 한다', async () => {
    const { user, onOpenTargetField, onQuickSetTarget } = renderResult();

    await user.click(within(quickSetGroup()).getByRole('button', { name: '직접 입력' }));

    expect(onOpenTargetField).toHaveBeenCalledTimes(1);
    // 임의의 목표를 대신 정해주지 않는다.
    expect(onQuickSetTarget).not.toHaveBeenCalled();
  });
});

describe('목표 미설정 CTA — 배선/상태에 따른 노출', () => {
  it('두 콜백이 모두 미배선이면 액션 행 자체를 그리지 않는다(격리 렌더에서 죽은 버튼 금지)', () => {
    renderResult({ onQuickSetTarget: null, onOpenTargetField: null });

    expect(screen.queryByRole('group', { name: QUICK_SET_GROUP })).not.toBeInTheDocument();
    // 서사 문장은 그대로 남는다 — 카드가 통째로 사라지는 게 아니다.
    expect(screen.getByText(UNSET_NARRATIVE)).toBeInTheDocument();
  });

  it('빠른 설정만 배선되면 칩만 보인다', () => {
    renderResult({ onOpenTargetField: null });

    expect(within(quickSetGroup()).getByRole('button', { name: '월 100만원' })).toBeInTheDocument();
    expect(within(quickSetGroup()).queryByRole('button', { name: '직접 입력' })).not.toBeInTheDocument();
  });

  it('직접 입력만 배선되면 버튼만 보인다', () => {
    renderResult({ onQuickSetTarget: null });

    expect(within(quickSetGroup()).getByRole('button', { name: '직접 입력' })).toBeInTheDocument();
    expect(within(quickSetGroup()).queryByRole('button', { name: '월 100만원' })).not.toBeInTheDocument();
  });

  it('목표가 이미 있으면(>0) 액션 행을 그리지 않는다 — 대신 진행률 토글이 자리를 차지한다', () => {
    renderResult({ targetMonthlyDividend: 3_000_000 });

    expect(screen.queryByRole('group', { name: QUICK_SET_GROUP })).not.toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: '진행률 표시 방식' })).toBeInTheDocument();
  });

  it('목표 0원은 "설정된 목표"가 아니다 — 달성/도달 표기 없이 미설정으로만 말한다', () => {
    renderResult({ summary: { targetMonthDividendReachedYear: 2028 }, yearly: buildYearly([2026, 2027, 2028]) });

    expect(screen.getByText('목표 월배당')).toBeInTheDocument();
    expect(screen.getByText('미설정')).toBeInTheDocument();
    expect(screen.queryByText(/달성해요/)).not.toBeInTheDocument();
    expect(screen.queryByText(/닿지 못해요/)).not.toBeInTheDocument();
    expect(screen.queryByText(/투자 \d+년차/)).not.toBeInTheDocument();
    expect(screen.queryByRole('progressbar', { name: '목표 월배당 달성률' })).not.toBeInTheDocument();
  });
});

describe('목표 StatTile hint — 투자 N년차', () => {
  /** hint는 값과 별개의 짧은 문장 노드다 — 서사 문장(긴 문장)과 exact 매칭으로 구분된다. */
  const yearCountHint = () => screen.queryByText(/^투자 \d+년차$/);

  it('달성했으면 도달 연도가 투자 몇 년차인지 hint로 붙는다', () => {
    renderResult({
      targetMonthlyDividend: 3_000_000,
      yearly: buildYearly([2026, 2027, 2028, 2029]),
      summary: { targetMonthDividendReachedYear: 2028 }
    });

    // 값(연도)은 nowrap+ellipsis라 년차를 값에 넣으면 잘린다 — 값과 별도의 hint로 나온다.
    expect(screen.getByText('2028년')).toBeInTheDocument();
    expect(yearCountHint()).toHaveTextContent('투자 3년차');
  });

  it('미도달이면 년차 hint가 없다', () => {
    renderResult({
      targetMonthlyDividend: 3_000_000,
      yearly: buildYearly([2026, 2027, 2028]),
      summary: { targetMonthDividendReachedYear: undefined }
    });

    expect(screen.getByText('미도달')).toBeInTheDocument();
    expect(yearCountHint()).not.toBeInTheDocument();
  });

  it('도달 연도가 yearly에 없으면 hint를 지어내지 않는다', () => {
    renderResult({
      targetMonthlyDividend: 3_000_000,
      yearly: buildYearly([2026, 2027]),
      summary: { targetMonthDividendReachedYear: 2050 }
    });

    expect(screen.getByText('2050년')).toBeInTheDocument();
    expect(yearCountHint()).not.toBeInTheDocument();
  });

  it('서사 문장과 hint가 같은 년차를 말한다(단일 출처)', () => {
    renderResult({
      targetMonthlyDividend: 3_000_000,
      yearly: buildYearly([2026, 2027, 2028, 2029, 2030]),
      summary: { targetMonthDividendReachedYear: 2030 }
    });

    expect(screen.getByText(/달성해요/)).toHaveTextContent('(투자 5년차)');
    expect(yearCountHint()).toHaveTextContent('투자 5년차');
  });
});

describe('서사 금액은 주입된 표시 통화 포맷터를 그대로 쓴다', () => {
  /** 1 USD = 1,000 KRW 로 두면 목표 300만원은 $3,000 자리다. */
  const usdFormatter = createResultAmountFormatter('USD', 1_000);

  it('달러 모드에서 미도달 서사의 금액이 달러로 나온다', () => {
    renderResult({
      targetMonthlyDividend: 3_000_000,
      yearly: buildYearly([2026, 2027, 2028]),
      summary: { targetMonthDividendReachedYear: undefined, finalMonthlyAverageDividend: 2_000_000 },
      formatAmount: usdFormatter
    });

    const narrative = screen.getByText(/닿지 못해요/);
    expect(narrative).toHaveTextContent(usdFormatter(3_000_000, true));
    expect(narrative).toHaveTextContent(usdFormatter(2_000_000, true));
    expect(narrative.textContent ?? '').toContain('$');
    expect(narrative.textContent ?? '').not.toContain('₩');
    expect(narrative.textContent ?? '').not.toContain('만원');
  });

  it('달러 모드에서 달성 서사의 목표 금액도 달러다', () => {
    renderResult({
      targetMonthlyDividend: 3_000_000,
      yearly: buildYearly([2026, 2027, 2028]),
      summary: { targetMonthDividendReachedYear: 2028 },
      formatAmount: usdFormatter
    });

    const narrative = screen.getByText(/달성해요/);
    expect(narrative).toHaveTextContent(usdFormatter(3_000_000, true));
    expect(narrative.textContent ?? '').not.toContain('₩');
  });

  it('원화 모드에서는 서사에 달러 기호가 섞이지 않는다(주입 경로 대조군)', () => {
    renderResult({
      targetMonthlyDividend: 3_000_000,
      yearly: buildYearly([2026, 2027, 2028]),
      summary: { targetMonthDividendReachedYear: 2028 }
    });

    expect(screen.getByText(/달성해요/).textContent ?? '').not.toContain('$');
  });
});
