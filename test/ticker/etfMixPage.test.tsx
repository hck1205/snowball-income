import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { SIMULATOR_PATH } from '@/shared/constants/routes';
import EtfMixPage from '@/pages/Ticker/EtfMixPage';
import { resetEtfHoldingsCache } from '@/pages/Ticker/hooks';
import type { EtfHoldingsSnapshot, EtfUniverse } from '@/shared/lib/etfOverlap';

/**
 * `/ticker/overlap` 의 **행동 계약** — 담을 때마다 중복률이 다시 계산되는가.
 * ⚠ className·Emotion 내부 구현을 단정하지 않는다(.cursor/rules). 접근名·역할·보이는 글자만 본다.
 * 데이터는 정적 파일(`/data/etf-holdings/*`)이라 `fetch` 만 갈아 끼운다.
 */

const snapshot = (ticker: string, holdings: Record<string, number>): EtfHoldingsSnapshot => ({
  ticker,
  name: `${ticker} Fund ETF`,
  seriesId: 'S000000000',
  asOfDate: '2026-06-30',
  filingDate: '2026-08-28',
  accessionNumber: `acc-${ticker}`,
  sourceUrl: 'https://www.sec.gov/',
  totalHoldings: Object.keys(holdings).length,
  coveredWeightPercent: 100,
  holdings: Object.entries(holdings).map(([key, weight]) => ({ key, symbol: key, name: `${key} Inc`, weight }))
});

const SNAPSHOTS: Record<string, EtfHoldingsSnapshot> = {
  AAA: snapshot('AAA', { X: 50, Y: 50 }),
  BBB: snapshot('BBB', { X: 50, Z: 50 }),
  CCC: snapshot('CCC', { W: 100 }),
  // 시뮬레이터 프리셋에 있는 실제 티커 — "이 조합으로 배당 시뮬레이션" 경로를 보려고 쓴다(보유는 가짜다).
  SCHD: snapshot('SCHD', { X: 100 }),
  VOO: snapshot('VOO', { X: 50, Z: 50 })
};

const UNIVERSE: EtfUniverse = {
  popular: ['AAA', 'BBB', 'CCC'],
  etfs: [
    { ticker: 'AAA', name: 'Alpha Dividend ETF', hasHoldings: true },
    { ticker: 'BBB', name: 'Beta Growth ETF', hasHoldings: true },
    { ticker: 'CCC', name: 'Gamma Bond ETF', hasHoldings: true },
    { ticker: 'GLDX', name: 'Physical Gold ETF', hasHoldings: false },
    { ticker: 'SCHD', name: 'Schwab US Dividend Equity ETF', hasHoldings: true },
    { ticker: 'VOO', name: 'Vanguard S&P 500 ETF', hasHoldings: true }
  ]
};

const jsonResponse = (body: unknown, status = 200) =>
  Promise.resolve(new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }));

beforeEach(() => {
  resetEtfHoldingsCache();
  vi.stubGlobal(
    'fetch',
    vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/index.json')) return jsonResponse(UNIVERSE);
      const ticker = url.match(/\/([A-Z]+)\.json$/)?.[1] ?? '';
      return SNAPSHOTS[ticker] ? jsonResponse(SNAPSHOTS[ticker]) : jsonResponse({}, 404);
    })
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

/** 시뮬레이터 자리 — 실려 온 프리필(state)을 글자로 보여 준다. */
function SimulatorProbe() {
  const location = useLocation();
  return <pre data-testid="simulator-state">{JSON.stringify(location.state)}</pre>;
}

const renderPage = (search = '') =>
  render(
    <MemoryRouter initialEntries={[`/ticker/overlap${search}`]}>
      <Routes>
        <Route path="/ticker/overlap" element={<EtfMixPage />} />
        <Route path={SIMULATOR_PATH} element={<SimulatorProbe />} />
      </Routes>
    </MemoryRouter>
  );

const overlapValue = () => screen.getByText(/^중복률 [\d.]+퍼센트$/);

describe('ETF 조합 짜기 — 담을 때마다 다시 계산된다', () => {
  it('처음에는 많이 찾는 ETF 가 목록에 서고, 바구니는 비어 있다', async () => {
    renderPage();
    expect(await screen.findByRole('button', { name: 'AAA 바구니에 담기' })).toBeInTheDocument();
    expect(screen.getByText('0 / 5')).toBeInTheDocument();
    expect(overlapValue()).toHaveTextContent('중복률 0.0퍼센트');
  });

  it('두 번째 ETF 를 담으면 중복률과 방금 바뀐 폭이 나온다', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole('button', { name: 'AAA 바구니에 담기' }));
    await screen.findByText('ETF를 하나 담았습니다. 하나 더 담으면 겹침을 비교할 수 있습니다.');

    // 담기 전에 미리보기가 먼저 말한다: BBB 를 담으면 +50.0%p
    expect(await screen.findByLabelText('BBB를 담으면 중복률 +50.0%p')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'BBB 바구니에 담기' }));
    await waitFor(() => expect(overlapValue()).toHaveTextContent('중복률 50.0퍼센트'));
    expect(await screen.findByText('BBB 담음 · +50.0%p')).toBeInTheDocument();
    expect(screen.getByText('절반 이상이 같은 종목에 몰려 있습니다. 비슷한 ETF를 여러 개 담은 셈입니다.')).toBeInTheDocument();
    expect(screen.getByLabelText('AAA와 BBB는 50.0퍼센트 겹칩니다. 겹치는 종목 1개.')).toBeInTheDocument();
  });

  it('URL 로 받은 바구니를 그대로 열고, 빼면 줄어든 폭을 말한다', async () => {
    const user = userEvent.setup();
    renderPage('?t=AAA,BBB,CCC');
    // X=(50+50)/3, 전체 합 100 → 33.3%
    await waitFor(() => expect(overlapValue()).toHaveTextContent('중복률 33.3퍼센트'));

    const basket = screen.getByRole('list', { name: '담은 ETF' });
    await user.click(within(basket).getByRole('button', { name: 'CCC 바구니에서 빼기' }));
    await waitFor(() => expect(overlapValue()).toHaveTextContent('중복률 50.0퍼센트'));
    expect(await screen.findByText('CCC 뺌 · +16.7%p')).toBeInTheDocument();
  });

  it('검색은 이름으로도 찾고, Enter 로 맨 위 결과를 담는다', async () => {
    const user = userEvent.setup();
    renderPage();
    const search = await screen.findByRole('searchbox', { name: 'ETF 검색' });
    await waitFor(() => expect(search).toBeEnabled());
    await user.type(search, 'growth');
    expect(screen.getByText('검색 결과 1개')).toBeInTheDocument();
    await user.keyboard('{Enter}');
    const basket = screen.getByRole('list', { name: '담은 ETF' });
    expect(await within(basket).findByText('BBB')).toBeInTheDocument();
    expect(search).toHaveValue('');
  });

  it('보유 종목이 없는 ETF 는 검색에 나오지만 담기 대신 이유를 말한다', async () => {
    const user = userEvent.setup();
    renderPage();
    const search = await screen.findByRole('searchbox', { name: 'ETF 검색' });
    await waitFor(() => expect(search).toBeEnabled());
    await user.type(search, 'gold');
    expect(screen.getByText('보유 종목 준비 중')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'GLDX 바구니에 담기' })).not.toBeInTheDocument();
  });

  it('맞는 결과가 없으면 왜 비었는지 말한다', async () => {
    const user = userEvent.setup();
    renderPage();
    const search = await screen.findByRole('searchbox', { name: 'ETF 검색' });
    await waitFor(() => expect(search).toBeEnabled());
    await user.type(search, 'zzzz');
    expect(screen.getByText('‘zzzz’에 맞는 ETF가 없습니다. 티커 철자를 확인해 주세요.')).toBeInTheDocument();
  });
});

describe('ETF 조합 짜기 — 비중과 시뮬레이터', () => {
  it('URL 의 비중을 읽고 몫으로 보여 주며, 중복률에 반영한다', async () => {
    // 60/40: X = 0.6×50 + 0.4×50 = 50, 전체 100 → 50%. 몫 표기는 60.0% / 40.0%
    renderPage('?t=AAA,BBB&w=60,40');
    await waitFor(() => expect(overlapValue()).toHaveTextContent('중복률 50.0퍼센트'));
    expect(screen.getByRole('slider', { name: 'AAA 비중' })).toHaveAttribute('aria-valuetext', '60.0%');
    expect(screen.getByRole('slider', { name: 'BBB 비중' })).toHaveAttribute('aria-valuetext', '40.0%');
  });

  it('겹치지 않는 쪽으로 비중을 옮기면 중복률이 바뀌고, 균등하게로 되돌린다', async () => {
    const user = userEvent.setup();
    // SCHD 는 X 만, VOO 는 X·Z 반반 → 균등이면 X = 75
    renderPage('?t=SCHD,VOO');
    await waitFor(() => expect(overlapValue()).toHaveTextContent('중복률 75.0퍼센트'));
    const equalize = screen.getByRole('button', { name: '균등하게' });
    expect(equalize).toBeDisabled();

    const vooSlider = screen.getByRole('slider', { name: 'VOO 비중' });
    fireEvent.change(vooSlider, { target: { value: '100' } });
    // 50:100 → pSCHD = 1/3 → X = 1/3×100 + 2/3×50 = 66.7
    await waitFor(() => expect(overlapValue()).toHaveTextContent('중복률 66.7퍼센트'));
    expect(equalize).toBeEnabled();

    await user.click(equalize);
    await waitFor(() => expect(overlapValue()).toHaveTextContent('중복률 75.0퍼센트'));
  });

  it('이 조합을 비중 그대로 시뮬레이터로 보낸다 — 시뮬레이터가 모르는 ETF 는 먼저 알리고 뺀다', async () => {
    const user = userEvent.setup();
    renderPage('?t=SCHD,VOO,AAA&w=60,20,20');
    expect(
      await screen.findByText('AAA는 시뮬레이터에 배당 정보가 없어 빼고 넘깁니다. 남은 ETF의 비중을 다시 100%로 맞춥니다.')
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '배당 시뮬레이션 해보기' }));
    const state = JSON.parse((await screen.findByTestId('simulator-state')).textContent ?? 'null');
    expect(state.scenarioName).toBe('ETF 조합');
    expect(state.portfolioSimulationPrefill.initialInvestmentKrw).toBe(0);
    expect(state.portfolioSimulationPrefill.holdings).toEqual([
      { ticker: 'SCHD', weightPercent: 75 },
      { ticker: 'VOO', weightPercent: 25 }
    ]);
  });

  it('담은 ETF 가 모두 시뮬레이터에 없으면 버튼을 잠그고 이유를 말한다', async () => {
    renderPage('?t=AAA,BBB');
    expect(await screen.findByText('담은 ETF가 모두 시뮬레이터에 배당 정보가 없어 넘길 수 없습니다.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '배당 시뮬레이션 해보기' })).toBeDisabled();
  });
});
