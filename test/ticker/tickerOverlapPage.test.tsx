import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import TickerOverlapPage from '@/pages/Ticker/TickerOverlapPage';
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
  CCC: snapshot('CCC', { W: 100 })
};

const UNIVERSE: EtfUniverse = {
  popular: ['AAA', 'BBB', 'CCC'],
  etfs: [
    { ticker: 'AAA', name: 'Alpha Dividend ETF', hasHoldings: true },
    { ticker: 'BBB', name: 'Beta Growth ETF', hasHoldings: true },
    { ticker: 'CCC', name: 'Gamma Bond ETF', hasHoldings: true },
    { ticker: 'GLDX', name: 'Physical Gold ETF', hasHoldings: false }
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

const renderPage = (search = '') =>
  render(
    <MemoryRouter initialEntries={[`/ticker/overlap${search}`]}>
      <TickerOverlapPage />
    </MemoryRouter>
  );

const overlapValue = () => screen.getByText(/^중복률 [\d.]+퍼센트$/);

describe('ETF 겹침 — 담을 때마다 다시 계산된다', () => {
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
