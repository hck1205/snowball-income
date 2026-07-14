import { Provider } from 'jotai/react';
import { createStore } from 'jotai/vanilla';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SimulationResult from '@/components/SimulationResult';
import HelpModal from '@/pages/Main/components/HelpModal';
import { formatPercent, formatResultAmount, targetYearLabel } from '@/pages/Main/utils/formatters';
import type { SimulationOutput, SimulationSummary } from '@/shared/types';

const buildSummary = (overrides: Partial<SimulationSummary> = {}): SimulationSummary => ({
  finalAssetValue: 1_137_786_866,
  finalAnnualDividend: 30_769_261,
  finalMonthlyAverageDividend: 2_564_105,
  finalPayoutMonthDividend: 8_000_000,
  totalContribution: 190_000_000,
  totalNetDividend: 290_712_891,
  totalTaxPaid: 52_919_368,
  targetMonthDividendReachedYear: 2050,
  totalCostBasis: 480_712_891,
  unrealizedGain: 657_073_975,
  estimatedCapitalGainsTax: 144_006_274,
  afterCapitalGainsTaxValue: 993_780_591,
  ...overrides
});

const buildSimulation = (summary: SimulationSummary): SimulationOutput => ({
  monthly: [],
  yearly: [],
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
  isResultCompact?: boolean;
  showQuickEstimate?: boolean;
};

const renderResult = ({ summary = {}, isResultCompact = false, showQuickEstimate = false }: RenderOptions = {}) => {
  const store = createStore();
  render(
    <Provider store={store}>
      <SimulationResult
        simulation={buildSimulation(buildSummary(summary))}
        showQuickEstimate={showQuickEstimate}
        isResultCompact={isResultCompact}
        targetMonthlyDividend={3_000_000}
        onToggleCompact={() => undefined}
        formatResultAmount={formatResultAmount}
        formatPercent={formatPercent}
        targetYearLabel={targetYearLabel}
      />
      {/* 도움말 모달은 앱에서 Main.view 가 렌더한다. 도움말 버튼 → 아톰 → 모달 경로를 실제로 태우기 위해 함께 렌더한다. */}
      <HelpModal onBackdropClick={() => undefined} onClose={() => undefined} />
    </Provider>
  );

  return userEvent.setup();
};

describe('SimulationResult capital gains section', () => {
  it('shows cost basis, unrealized gain, capital gains tax and after-tax value in detail mode', () => {
    renderResult();

    expect(screen.getByText('취득원가')).toBeInTheDocument();
    expect(screen.getByText('평가이익')).toBeInTheDocument();
    expect(screen.getByText('전량 매도 시 예상 양도세')).toBeInTheDocument();
    expect(screen.getByText('세후 실현 가능 자산')).toBeInTheDocument();
  });

  it('states the assumptions behind the capital gains estimate', () => {
    renderResult();

    const note = screen.getByText(/해외주식 양도세 22%/);
    expect(note).toHaveTextContent('기본공제 연 250만원');
    expect(note).toHaveTextContent('전량 매도 가정');
    // 이 세금이 위쪽 숫자에 반영되지 않았다는 점을 반드시 밝힌다.
    expect(note).toHaveTextContent(/반영되지 않았습니다/);
  });

  it('keeps the existing summary items untouched', () => {
    renderResult();

    expect(screen.getByText('최종 자산 가치')).toBeInTheDocument();
    expect(screen.getByText('누적 세금')).toBeInTheDocument();
    expect(screen.getByText('누적 순배당')).toBeInTheDocument();
  });

  it('hides the capital gains section in compact mode', () => {
    renderResult({ isResultCompact: true });

    expect(screen.queryByText('취득원가')).not.toBeInTheDocument();
    expect(screen.queryByText('전량 매도 시 예상 양도세')).not.toBeInTheDocument();
    // 기존 요약 항목은 그대로 남는다.
    expect(screen.getByText('최종 자산 가치')).toBeInTheDocument();
  });

  it('hides the capital gains section in quick-estimate mode', () => {
    renderResult({ showQuickEstimate: true });

    expect(screen.queryByText('취득원가')).not.toBeInTheDocument();
    expect(screen.getByText('최종 자산 추정')).toBeInTheDocument();
  });

  it('opens the capital gains help when the help button is clicked', async () => {
    const user = renderResult();

    await user.click(screen.getByRole('button', { name: '전량 매도 시 예상 양도세 설명' }));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(/양도소득세 20% \+ 지방소득세 2%/)).toBeInTheDocument();
    // 세율·공제·전량매도 가정이 도움말에 모두 적혀 있어야 한다.
    expect(within(dialog).getByText(/기본공제 250만원/)).toBeInTheDocument();
    expect(within(dialog).getByText(/계속 보유하면 내지 않는 세금/)).toBeInTheDocument();
  });

  it('opens the cost basis help when the help button is clicked', async () => {
    const user = renderResult();

    await user.click(screen.getByRole('button', { name: '취득원가 설명' }));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(/배당으로 다시 사들인 금액/)).toBeInTheDocument();
  });

  it('renders a loss without charging capital gains tax', () => {
    renderResult({
      summary: {
        finalAssetValue: 7_000_000,
        totalCostBasis: 10_000_000,
        unrealizedGain: -3_000_000,
        estimatedCapitalGainsTax: 0,
        afterCapitalGainsTaxValue: 7_000_000
      }
    });

    expect(screen.getByText('평가이익')).toBeInTheDocument();
    // 손실은 음수로 표시되고, 양도세는 0원이다.
    expect(screen.getByText(/-.*3,000,000/)).toBeInTheDocument();
  });
});

describe('SimulationResult financial income tax warning', () => {
  it('warns when a year crosses the financial income threshold', () => {
    renderResult({ summary: { financialIncomeThresholdYear: 25 } });

    const warning = screen.getByRole('note', { name: '금융소득종합과세 안내' });
    expect(warning).toHaveTextContent('25년차');
    expect(warning).toHaveTextContent('2,000만원');
    expect(warning).toHaveTextContent(/실제 세율이 입력한 값보다 높아질 수 있습니다/);
  });

  it('does not warn when no year crosses the threshold', () => {
    renderResult({ summary: { financialIncomeThresholdYear: undefined } });

    expect(screen.queryByRole('note', { name: '금융소득종합과세 안내' })).not.toBeInTheDocument();
  });

  it('keeps warning in compact mode (the threshold is a property of the scenario, not the view)', () => {
    renderResult({ summary: { financialIncomeThresholdYear: 25 }, isResultCompact: true });

    expect(screen.getByRole('note', { name: '금융소득종합과세 안내' })).toBeInTheDocument();
  });

  it('opens the financial income tax help when the help button is clicked', async () => {
    const user = renderResult({ summary: { financialIncomeThresholdYear: 25 } });

    await user.click(screen.getByRole('button', { name: '금융소득종합과세 설명' }));

    const dialog = await screen.findByRole('dialog');
    // 앱이 세율을 임의로 바꾸지 않는다는 점을 도움말이 분명히 밝혀야 한다.
    expect(within(dialog).getByText(/세율을 자동으로 바꾸지 않습니다/)).toBeInTheDocument();
  });
});
