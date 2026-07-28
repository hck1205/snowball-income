import { Provider } from 'jotai/react';
import { createStore } from 'jotai/vanilla';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ResultSummaryCard from '@/components/ResultSummaryCard';
import { buildConditionStripItems } from '@/components/ConditionStrip';
import HelpModal from '@/pages/Main/components/HelpModal';
import { formatPercent, formatResultAmount, targetYearLabel } from '@/pages/Main/utils';
import type { SimulationOutput, SimulationSummary } from '@/shared/types';
import { buildSimulation, buildSummary, buildYearly } from './resultCardFixtures';

/**
 * 결과 요약 카드 — 화면의 **첫 숫자**.
 *
 * 이 카드만 격리해 렌더한다. 예전엔 한 하네스가 요약 카드·종합과세 배너·전량 매도 카드를 손으로
 * 재조립해 셋을 한꺼번에 검증했는데, 그러면 빨개졌을 때 **어느 카드가 깨졌는지 보이지 않는다**.
 */

type RenderOptions = {
  summary?: Partial<SimulationSummary>;
  isResultCompact?: boolean;
  showQuickEstimate?: boolean;
  targetMonthlyDividend?: number;
  yearly?: SimulationOutput['yearly'];
};

const renderCard = ({
  summary = {},
  isResultCompact = false,
  showQuickEstimate = false,
  targetMonthlyDividend = 3_000_000,
  yearly = []
}: RenderOptions = {}) => {
  render(
    <Provider store={createStore()}>
      <ResultSummaryCard
        simulation={buildSimulation(buildSummary(summary), yearly)}
        showQuickEstimate={showQuickEstimate}
        isResultCompact={isResultCompact}
        targetMonthlyDividend={targetMonthlyDividend}
        formatResultAmount={formatResultAmount}
        formatPercent={formatPercent}
        targetYearLabel={targetYearLabel}
        condition={buildConditionStripItems({
          durationYears: 20,
          monthlyContribution: 1_000_000,
          initialInvestment: 0,
          taxRatePercent: 15.4,
          reinvestDividends: true,
          reinvestDividendPercent: 100,
          targetMonthlyDividend,
          includedTickerCount: 1,
          showQuickEstimate,
          formatAmount: (won) => formatResultAmount(won, true)
        })}
        conditionAction={
          <button type="button" aria-controls="config-drawer" aria-expanded={false}>
            조건 수정
          </button>
        }
      />
      {/* 도움말 모달은 앱에서 Main.view 가 렌더한다. 도움말 버튼 → 아톰 → 모달 경로를 실제로 태우려고 함께 렌더한다. */}
      <HelpModal onBackdropClick={() => undefined} onClose={() => undefined} />
    </Provider>
  );

  return userEvent.setup();
};

describe('ResultSummaryCard — 정밀 모드 지표', () => {
  it('요약 항목 구성은 그대로다', () => {
    renderCard();

    expect(screen.getByText('최종 자산 가치')).toBeInTheDocument();
    expect(screen.getByText('월배당(월평균: 연/12)')).toBeInTheDocument();
    expect(screen.getByText('최근 실지급 배당')).toBeInTheDocument();
    expect(screen.getByText('누적 순배당')).toBeInTheDocument();
    expect(screen.getByText('누적 세금')).toBeInTheDocument();
  });

  it('카드 제목을 그리지 않는다 — hero 숫자가 카드의 첫 요소여야 한다', () => {
    renderCard();

    // 구 제목("시뮬레이션 결과 (정밀)")이 되살아나면 여기서 죽는다. 모드는 조건 스트립이 말한다.
    expect(screen.queryByText(/시뮬레이션 결과/)).not.toBeInTheDocument();
    expect(screen.getByText('정밀 계산')).toBeInTheDocument();
  });

  it('간편 추정 모드에서는 추정 지표 넷으로 갈린다', () => {
    renderCard({ showQuickEstimate: true });

    expect(screen.getByText('최종 자산 추정')).toBeInTheDocument();
    expect(screen.getByText('연 배당 추정(세후)')).toBeInTheDocument();
    expect(screen.getByText('월 배당 추정(세후)')).toBeInTheDocument();
    expect(screen.getByText('종료 시점 배당률(가격 기준)')).toBeInTheDocument();
    // 모드 표기도 함께 갈린다(hero 라벨과 2중 신호).
    expect(screen.getByText('간편 추정')).toBeInTheDocument();
    expect(screen.queryByText('최종 자산 가치')).not.toBeInTheDocument();
  });

  it('간략히 모드에서도 요약 지표는 남는다 — 사라지는 것은 부속 카드다', () => {
    renderCard({ isResultCompact: true });

    expect(screen.getByText('최종 자산 가치')).toBeInTheDocument();
  });
});

describe('ResultSummaryCard — 도움말', () => {
  it('월배당 도움말을 연다', async () => {
    const user = renderCard();

    await user.click(screen.getByRole('button', { name: '월배당 설명' }));

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
  });

  it('최근 실지급 배당 도움말을 연다', async () => {
    const user = renderCard();

    await user.click(screen.getByRole('button', { name: '최근 실지급 배당 설명' }));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('heading', { name: '최근 실지급 배당' })).toBeInTheDocument();
  });
});

describe('ResultSummaryCard — 조건 스트립', () => {
  it('결과 숫자의 전제를 같은 카드 안에서 말한다', () => {
    renderCard();

    expect(screen.getByText('이 결과의 계산 조건:')).toBeInTheDocument();
    expect(screen.getByText('20년')).toBeInTheDocument();
    expect(screen.getByText('세율 15.4%')).toBeInTheDocument();
  });

  it('액션 슬롯의 "조건 수정"이 드로어를 가리킨다', () => {
    renderCard();

    expect(screen.getByRole('button', { name: '조건 수정' })).toHaveAttribute('aria-controls', 'config-drawer');
  });
});

/**
 * 목표는 이 카드에서 **지표 한 칸**으로만 말한다(도달 서사·진행률은 내 포트폴리오의 목표 달성 카드로 이관).
 * 남은 계약은 라벨/값/hint 셋이다.
 */
describe('ResultSummaryCard — 목표 월배당 타일', () => {
  /** hint 는 값과 별개의 짧은 문장 노드다 — 정확일치로 값(연도)과 구분한다. */
  const yearCountHint = () => screen.queryByText(/^투자 \d+년차$/);

  it('목표 미설정이면 라벨은 "목표 월배당", 값은 "미설정"이다(0원·첫해 노출 금지)', () => {
    renderCard({ targetMonthlyDividend: 0, summary: { targetMonthDividendReachedYear: 2050 } });

    expect(screen.getByText('목표 월배당')).toBeInTheDocument();
    expect(screen.queryByText(/목표 월배당 도달/)).not.toBeInTheDocument();
    expect(screen.getByText('미설정')).toBeInTheDocument();
    // reachedYear 가 있어도 미설정이면 연도(2050년)를 목표 값으로 보이지 않는다.
    expect(screen.queryByText('2050년')).not.toBeInTheDocument();
    expect(yearCountHint()).not.toBeInTheDocument();
  });

  it('미도달이면 값은 "미도달"이고 년차 hint 가 없다', () => {
    renderCard({
      targetMonthlyDividend: 3_000_000,
      yearly: buildYearly([2026, 2027, 2028]),
      summary: { targetMonthDividendReachedYear: undefined }
    });

    expect(screen.getByText(/목표 월배당 도달/)).toBeInTheDocument();
    expect(screen.getByText('미도달')).toBeInTheDocument();
    expect(yearCountHint()).not.toBeInTheDocument();
  });

  it('도달하면 연도가 값으로, "투자 N년차"가 hint 로 붙는다', () => {
    renderCard({
      targetMonthlyDividend: 3_000_000,
      yearly: buildYearly([2026, 2027, 2028, 2029]),
      summary: { targetMonthDividendReachedYear: 2028 }
    });

    // 값(연도)은 nowrap+ellipsis 라 년차를 값에 넣으면 잘린다 — 값과 별도의 hint 로 나온다.
    expect(screen.getByText('2028년')).toBeInTheDocument();
    expect(yearCountHint()).toHaveTextContent('투자 3년차');
  });

  it('도달 연도가 yearly 에 없으면 hint 를 지어내지 않는다', () => {
    renderCard({
      targetMonthlyDividend: 3_000_000,
      yearly: buildYearly([2026, 2027]),
      summary: { targetMonthDividendReachedYear: 2050 }
    });

    expect(screen.getByText('2050년')).toBeInTheDocument();
    expect(yearCountHint()).not.toBeInTheDocument();
  });
});
