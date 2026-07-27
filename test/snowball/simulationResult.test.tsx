import { vi } from 'vitest';
import { Provider } from 'jotai/react';
import { createStore } from 'jotai/vanilla';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SimulationResult from '@/components/SimulationResult';
import HelpModal from '@/pages/Main/components/HelpModal';
import { formatApproxKRW } from '@/shared/utils';
import { formatPercent, formatResultAmount, targetYearLabel } from '@/pages/Main/utils/formatters';
import type { SimulationOutput, SimulationSummary } from '@/shared/types';

/**
 * 게이지 뷰는 ECharts 캔버스(lazy 청크)라 jsdom에서 비결정적이다 —
 * ResponsiveEChart를 스텁으로 갈아 끼워 게이지 래퍼의 role/aria 계약만 검증한다.
 * 기본(바) 뷰는 이 컴포넌트를 렌더하지 않으므로 기존 테스트에는 영향이 없다.
 */
vi.mock('@/components/common/ResponsiveEChart', () => ({
  ResponsiveEChart: () => <div data-testid="gauge-canvas" />
}));

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

/** 서사 블록의 durationYears·yearsToReach는 `simulation.yearly`를 읽는다 — year만 있으면 충분. */
const buildYearly = (years: number[]): SimulationOutput['yearly'] =>
  years.map((year) => ({ year }) as SimulationOutput['yearly'][number]);

const buildSimulation = (summary: SimulationSummary, yearly: SimulationOutput['yearly'] = []): SimulationOutput => ({
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
  isResultCompact?: boolean;
  showQuickEstimate?: boolean;
  targetMonthlyDividend?: number;
  yearly?: SimulationOutput['yearly'];
};

const renderResult = ({
  summary = {},
  isResultCompact = false,
  showQuickEstimate = false,
  targetMonthlyDividend = 3_000_000,
  yearly = []
}: RenderOptions = {}) => {
  const store = createStore();
  render(
    <Provider store={store}>
      <SimulationResult
        simulation={buildSimulation(buildSummary(summary), yearly)}
        showQuickEstimate={showQuickEstimate}
        isResultCompact={isResultCompact}
        targetMonthlyDividend={targetMonthlyDividend}
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

/* ≤960px에서는 좌패널이 드로어라 "왼쪽 투자 설정" 위치 안내가 거짓이 된다 — 위치 대신 결과를 말한다. */
const UNSET_NARRATIVE = '목표 월배당을 정하면 도달 시점과 진행률을 함께 보여줘요.';

describe('SimulationResult target narrative block — 미설정(target<=0)', () => {
  it('목표 미설정 안내 문구를 그대로 노출한다', () => {
    renderResult({ targetMonthlyDividend: 0 });

    expect(screen.getByText(UNSET_NARRATIVE)).toBeInTheDocument();
  });

  it('목표 StatTile 라벨은 "목표 월배당", 값은 "미설정"이다(0원·첫해 노출 금지)', () => {
    renderResult({ targetMonthlyDividend: 0, summary: { targetMonthDividendReachedYear: 2050 } });

    // 라벨은 도달 표기가 아니라 순수 "목표 월배당".
    expect(screen.getByText('목표 월배당')).toBeInTheDocument();
    expect(screen.queryByText(/목표 월배당 도달/)).not.toBeInTheDocument();
    expect(screen.getByText('미설정')).toBeInTheDocument();
    // reachedYear가 있어도 미설정이면 연도(2050년)를 목표 값으로 보이지 않는다.
    expect(screen.queryByText('2050년')).not.toBeInTheDocument();
  });

  it('진행률 뷰 토글도, 진행률 바(progressbar)도 그리지 않는다', () => {
    renderResult({ targetMonthlyDividend: 0 });

    expect(screen.queryByRole('checkbox', { name: '진행률 게이지로 보기' })).not.toBeInTheDocument();
    expect(screen.queryByRole('progressbar', { name: '목표 월배당 달성률' })).not.toBeInTheDocument();
  });
});

describe('SimulationResult target narrative block — 미도달(target>0, reachedYear 없음)', () => {
  it('기간 안에 못 닿는다는 서사와 마지막 해 월배당을 함께 말한다', () => {
    renderResult({
      targetMonthlyDividend: 3_000_000,
      yearly: buildYearly([2026, 2027, 2028]),
      summary: { targetMonthDividendReachedYear: undefined, finalMonthlyAverageDividend: 2_564_105 }
    });

    const expected = `지금 조건으로는 3년 안에 목표 월배당 ${formatApproxKRW(3_000_000)}에 닿지 못해요. 마지막 해 월배당은 ${formatApproxKRW(2_564_105)}입니다. 월 적립이나 투자 기간을 늘리면 도달 시점이 앞당겨져요.`;
    expect(screen.getByText(expected)).toBeInTheDocument();
  });

  it('미도달 목표 StatTile 값은 "미도달"이다', () => {
    renderResult({
      targetMonthlyDividend: 3_000_000,
      summary: { targetMonthDividendReachedYear: undefined }
    });

    expect(screen.getByText(/목표 월배당 도달/)).toBeInTheDocument();
    expect(screen.getByText('미도달')).toBeInTheDocument();
  });
});

describe('SimulationResult target narrative block — 도달(reachedYear 존재)', () => {
  it('도달 연도와 투자 N년차를 함께 말한다', () => {
    // reachedYear=2028이 yearly의 3번째 → 투자 3년차.
    renderResult({
      targetMonthlyDividend: 3_000_000,
      yearly: buildYearly([2026, 2027, 2028, 2029]),
      summary: { targetMonthDividendReachedYear: 2028 }
    });

    const expected = `목표 월배당 ${formatApproxKRW(3_000_000)}을 2028년에 달성해요. (투자 3년차)`;
    expect(screen.getByText(expected)).toBeInTheDocument();
  });

  it('yearly에 도달 연도가 없으면 "N년차" 괄호를 생략한다', () => {
    renderResult({
      targetMonthlyDividend: 3_000_000,
      yearly: [],
      summary: { targetMonthDividendReachedYear: 2050 }
    });

    const expected = `목표 월배당 ${formatApproxKRW(3_000_000)}을 2050년에 달성해요.`;
    expect(screen.getByText(expected)).toBeInTheDocument();
    expect(screen.queryByText(/년차\)/)).not.toBeInTheDocument();
  });
});

describe('SimulationResult 진행률 2뷰 토글(바 ↔ 게이지)', () => {
  it('기본은 바 뷰 — 목표 StatTile progressbar가 있고 게이지는 없다', () => {
    renderResult({ targetMonthlyDividend: 3_000_000, summary: { targetMonthDividendReachedYear: undefined } });

    expect(screen.getByRole('progressbar', { name: '목표 월배당 달성률' })).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: /목표/ })).not.toBeInTheDocument();
  });

  it('게이지로 토글하면 게이지(role=img)가 뜨고 progressbar는 사라진다', async () => {
    const user = renderResult({
      targetMonthlyDividend: 3_000_000,
      summary: { targetMonthDividendReachedYear: undefined }
    });

    await user.click(screen.getByRole('checkbox', { name: '진행률 게이지로 보기' }));

    expect(screen.queryByRole('progressbar', { name: '목표 월배당 달성률' })).not.toBeInTheDocument();
    expect(screen.getByRole('img', { name: /목표/ })).toBeInTheDocument();
  });

  it('도달이면 progress=1 강제 — 게이지 aria-label이 "목표 달성"이다(비율 모순 금지)', async () => {
    // finalMonthlyAverageDividend가 목표에 못 미쳐도(97%) 도달 연도가 있으면 100% 달성으로 본다.
    const user = renderResult({
      targetMonthlyDividend: 3_000_000,
      summary: { targetMonthDividendReachedYear: 2028, finalMonthlyAverageDividend: 2_900_000 }
    });

    await user.click(screen.getByRole('checkbox', { name: '진행률 게이지로 보기' }));

    expect(screen.getByRole('img', { name: '목표 달성' })).toBeInTheDocument();
  });

  it('미도달 게이지 aria-label은 "목표의 N% 도달" — 바 aria-valuenow와 같은 값(단일 출처)', async () => {
    // finalMonthlyAverageDividend/target = 1.5M/3M = 0.5 → 50%.
    const user = renderResult({
      targetMonthlyDividend: 3_000_000,
      summary: { targetMonthDividendReachedYear: undefined, finalMonthlyAverageDividend: 1_500_000 }
    });

    // 바 뷰: aria-valuenow=50.
    const bar = screen.getByRole('progressbar', { name: '목표 월배당 달성률' });
    expect(bar).toHaveAttribute('aria-valuenow', '50');

    await user.click(screen.getByRole('checkbox', { name: '진행률 게이지로 보기' }));

    // 게이지 뷰: 같은 50%.
    expect(screen.getByRole('img', { name: '목표의 50% 도달' })).toBeInTheDocument();
  });
});
