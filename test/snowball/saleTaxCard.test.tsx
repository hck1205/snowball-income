import { Provider } from 'jotai/react';
import { createStore } from 'jotai/vanilla';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SaleTaxCard from '@/components/SaleTaxCard';
import HelpModal from '@/pages/Main/components/HelpModal';
import { formatResultAmount } from '@/pages/Main/utils';
import type { SimulationSummary } from '@/shared/types';
import { buildSummary } from './resultCardFixtures';

/**
 * "전량 매도한다면" 부속 카드.
 *
 * 이 카드는 **가정이 다른 별도의 세계**다(계속 보유하면 내지 않는 세금). 그래서 위쪽 결과 숫자에
 * 반영되지 않았다는 사실을 각주가 반드시 말해야 하고, 그 문장이 사라지면 사용자는 최종 자산에서
 * 양도세가 이미 빠진 줄로 읽는다.
 *
 * ⚠ 렌더 **여부**(`!showQuickEstimate && !isResultCompact`)는 이 카드가 아니라 호출부(MainRightPanel)의
 *   결정이다 — 여기서는 "렌더되면 무엇을 말하는가"만 본다.
 */

const renderCard = (summary: Partial<SimulationSummary> = {}, isResultCompact = false) => {
  render(
    <Provider store={createStore()}>
      <SaleTaxCard
        summary={buildSummary(summary)}
        isResultCompact={isResultCompact}
        formatResultAmount={formatResultAmount}
      />
      <HelpModal onBackdropClick={() => undefined} onClose={() => undefined} />
    </Provider>
  );

  return userEvent.setup();
};

describe('SaleTaxCard — 지표', () => {
  it('취득원가·평가이익·양도세·세후 자산 넷을 보여준다', () => {
    renderCard();

    expect(screen.getByText('취득원가')).toBeInTheDocument();
    expect(screen.getByText('평가이익')).toBeInTheDocument();
    expect(screen.getByText('전량 매도 시 예상 양도세')).toBeInTheDocument();
    expect(screen.getByText('세후 실현 가능 자산')).toBeInTheDocument();
  });

  it('카드 제목이 가정을 그대로 말한다', () => {
    renderCard();

    expect(screen.getByRole('heading', { name: '전량 매도한다면' })).toBeInTheDocument();
  });

  it('손실이면 음수로 표시하고 양도세는 0원이다', () => {
    renderCard({
      finalAssetValue: 7_000_000,
      totalCostBasis: 10_000_000,
      unrealizedGain: -3_000_000,
      estimatedCapitalGainsTax: 0,
      afterCapitalGainsTaxValue: 7_000_000
    });

    expect(screen.getByText(/-.*3,000,000/)).toBeInTheDocument();
  });
});

describe('SaleTaxCard — 각주(가정 명시)', () => {
  it('세율·공제·전량 매도 가정과 "위쪽 숫자에 미반영"을 전부 밝힌다', () => {
    renderCard();

    const note = screen.getByText(/해외주식 양도세 22%/);
    expect(note).toHaveTextContent('기본공제 연 250만원');
    expect(note).toHaveTextContent('전량 매도 가정');
    // 이 세금이 위쪽 숫자에 반영되지 않았다는 점을 반드시 밝힌다.
    expect(note).toHaveTextContent(/반영되지 않았습니다/);
  });
});

describe('SaleTaxCard — 도움말', () => {
  it('양도세 도움말이 세율·공제·보유 시 미과세를 모두 적는다', async () => {
    const user = renderCard();

    await user.click(screen.getByRole('button', { name: '전량 매도 시 예상 양도세 설명' }));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(/양도소득세 20% \+ 지방소득세 2%/)).toBeInTheDocument();
    expect(within(dialog).getByText(/기본공제 250만원/)).toBeInTheDocument();
    expect(within(dialog).getByText(/계속 보유하면 내지 않는 세금/)).toBeInTheDocument();
  });

  it('취득원가 도움말을 연다', async () => {
    const user = renderCard();

    await user.click(screen.getByRole('button', { name: '취득원가 설명' }));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(/배당으로 다시 사들인 금액/)).toBeInTheDocument();
  });
});
