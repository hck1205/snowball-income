import { createElement } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import MarketDataAsOf from './MarketDataAsOf';

describe('MarketDataAsOf', () => {
  afterEach(cleanup);

  it('shows the snapshot reference date when one exists', () => {
    render(createElement(MarketDataAsOf, { asOf: '2026-07-13' }));

    const footnote = screen.getByRole('contentinfo');
    expect(footnote).toHaveTextContent('티커 데이터 기준일: 2026-07-13');
    expect(footnote).toHaveTextContent('실시간 시세가 아니라 저장된 스냅샷입니다');
  });

  it('exposes the date as a machine-readable <time>', () => {
    render(createElement(MarketDataAsOf, { asOf: '2026-07-13' }));

    expect(screen.getByText('2026-07-13')).toHaveAttribute('datetime', '2026-07-13');
  });

  it('renders nothing when the build has no market data snapshot', () => {
    const { container } = render(createElement(MarketDataAsOf, { asOf: null }));

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByRole('contentinfo')).not.toBeInTheDocument();
  });

  it('renders nothing for an empty reference date', () => {
    const { container } = render(createElement(MarketDataAsOf, { asOf: '' }));

    expect(container).toBeEmptyDOMElement();
  });
});
