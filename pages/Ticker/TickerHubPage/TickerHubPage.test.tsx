import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import TickerHubPage from './TickerHubPage';

function renderHub() {
  return render(
    <MemoryRouter initialEntries={['/ticker/all']}>
      <TickerHubPage />
    </MemoryRouter>
  );
}

describe('TickerHubPage', () => {
  it('groups tickers under their category with a jump link', () => {
    renderHub();

    // 카테고리 헤딩과 바로가기 내비가 함께 렌더된다.
    const nav = screen.getByRole('navigation', { name: '카테고리 바로가기' });
    expect(within(nav).getByRole('link', { name: '배당성장 ETF' })).toHaveAttribute('href', '#dividend-growth');
    expect(screen.getByRole('heading', { name: /배당성장 ETF/ })).toBeInTheDocument();
  });

  it('renders each ticker as a card linking to its detail page', () => {
    renderHub();

    // 카드의 접근 가능한 이름은 티커 심볼(CardTicker)로 시작한다 — `/^SCHD/`로 앵커링해야
    // SCHY 카드(태그라인에 비교 대상으로 "SCHD"를 언급)와 혼동되지 않는다(2026-07-23 10종 추가 후 확인).
    const card = screen.getByRole('link', { name: /^SCHD/ });
    expect(card).toHaveAttribute('href', '/ticker/schd');
  });

  it('sets a hub-specific document title matching the server renderer', () => {
    renderHub();
    expect(document.title).toContain('배당 ETF·종목 SEO 소개 모음');
  });
});
