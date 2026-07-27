import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PortfolioPageView from '@/pages/Portfolio/PortfolioPage/PortfolioPage.view';
import { buildPortfolioViewModel } from '@/pages/Portfolio/PortfolioPage';
import type { PortfolioViewProps } from '@/pages/Portfolio/PortfolioPage';
import { PORTFOLIO_COPY } from '@/pages/Portfolio/copy';
import type { PortfolioAddResult } from '@/pages/Portfolio/hooks';
import { computePortfolioSummary } from '@/shared/lib/portfolio';
import { localDate } from './portfolioFixtures';

/**
 * **하이드레이션 전(A) 어포던스** — 저장소를 아직 못 읽은 동안 편집을 받지 않는다는 사실이 화면에도 보인다.
 *
 * 정본 방어선은 훅이다(`usePortfolioHoldings` 가 `{ ok: false, reason: 'loading' }` 을 돌려준다 —
 * 받아주면 "빈 초기 상태 + 방금 추가한 1행"이 디스크의 기존 목록을 덮는다). 여기서 지키는 것은
 * **화면이 그 거절을 어떻게 말하는가**다: 버튼은 비활성이고, 그래도 들어온 제출은 "이미 보유 중"이
 * 아니라 로딩 사유로 거절한다(있지도 않은 행을 알리지 않는다).
 *
 * 뷰를 직접 렌더하는 이유: 버튼을 비활성으로 만든 뒤에는 포인터로 그 거절 경로에 도달할 수 없어
 * 페이지 테스트로는 사유 매핑을 검증할 수 없다(도달 불가 = 검증 불가가 되면 매핑이 조용히 썩는다).
 */

const copy = PORTFOLIO_COPY;

const loadingViewModel = buildPortfolioViewModel({
  status: 'loading',
  items: [],
  summary: computePortfolioSummary([], { today: localDate(2026, 7, 27), taxRatePercent: 15.4 }),
  fx: { status: 'loading', rate: null, asOf: null },
  writeError: null,
  formatAmount: (usd: number) => `USD:${usd.toFixed(2)}`,
  canSimulate: false,
  simulationExcludedCount: 0,
  calendarTickerCount: 0,
  calendarExcludedCount: 0,
  pendingUndo: null
});

const renderLoadingView = (onAdd: PortfolioViewProps['onAdd']) => {
  const props: PortfolioViewProps = {
    viewModel: loadingViewModel,
    // 보유를 아직 읽는 중이면 목표 카드는 렌더 자체가 없다(카드가 떴다 사라지는 깜빡임 방지).
    goal: null,
    liveMessage: copy.live.loading,
    // 드로어는 열어 둔 채로 그린다 — 로딩 중 열림은 UI 로는 못 만들지만 사유 매핑은 여기서만 보인다.
    picker: { isOpen: true, keyword: '', options: [], heldTickers: [] },
    taxInput: '15.4',
    onTaxInputChange: vi.fn(),
    onTaxInputBlur: vi.fn(),
    onOpenPicker: vi.fn(),
    onClosePicker: vi.fn(),
    onKeywordChange: vi.fn(),
    onAdd,
    onQuantityChange: vi.fn(),
    onQuantityBlur: vi.fn(),
    onRemove: vi.fn(),
    onUndo: vi.fn(() => null),
    onSimulate: vi.fn(),
    onOpenCalendar: vi.fn(),
    onOpenTargetSetup: vi.fn(),
    onCommitTarget: vi.fn(),
    onOpenSimulator: vi.fn(),
    onAddHoldingFromGoal: vi.fn()
  };

  render(<PortfolioPageView {...props} />);
};

const submitManual = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(screen.getByRole('textbox', { name: copy.manual.fieldTicker }), 'TIGER200');
  await user.type(screen.getByRole('textbox', { name: copy.manual.fieldPrice }), '20');
  await user.type(screen.getByRole('textbox', { name: copy.manual.fieldYield }), '3');
  await user.click(screen.getByRole('button', { name: copy.manual.submit }));
};

describe('하이드레이션 전 어포던스 (A)', () => {
  it('보유 목록을 읽는 동안에는 추가·세율 입력을 받지 않는다', () => {
    renderLoadingView(vi.fn(() => ({ ok: false, ticker: '', reason: 'loading' }) as PortfolioAddResult));

    // 눌러도 훅이 거절하는 버튼을 눌리게 두면 "눌렀는데 아무 일도 안 났다"가 된다.
    expect(screen.getByRole('button', { name: /종목 추가 열기/ })).toBeDisabled();
    expect(screen.getByRole('textbox', { name: copy.assumptions.taxLabel })).toBeDisabled();
  });

  it('로딩 중 수동 추가는 "이미 보유 중"이 아니라 로딩 사유로 거절한다', async () => {
    const user = userEvent.setup();
    renderLoadingView(vi.fn(() => ({ ok: false, ticker: 'TIGER200', reason: 'loading' }) as PortfolioAddResult));

    await submitManual(user);

    expect(await screen.findByText(copy.manual.notReady)).toBeInTheDocument();
    // 목록을 아직 읽지도 못했는데 "이미 보유 목록에 있습니다"라고 말하면 거짓 안내다.
    expect(screen.queryByText(copy.manual.duplicateInHoldings('TIGER200'))).not.toBeInTheDocument();
  });

  it('진짜 중복은 그대로 중복이라고 말한다 (사유를 하나로 접지 않는다)', async () => {
    const user = userEvent.setup();
    renderLoadingView(vi.fn(() => ({ ok: false, ticker: 'TIGER200', reason: 'duplicate' }) as PortfolioAddResult));

    await submitManual(user);

    expect(await screen.findByText(copy.manual.duplicateInHoldings('TIGER200'))).toBeInTheDocument();
    expect(screen.queryByText(copy.manual.notReady)).not.toBeInTheDocument();
  });
});
