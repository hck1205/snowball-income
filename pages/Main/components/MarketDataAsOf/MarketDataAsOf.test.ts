import { createElement } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import MarketDataAsOf from './MarketDataAsOf';

describe('MarketDataAsOf', () => {
  afterEach(cleanup);

  /*
   * 🔴 2026-08-04: 이 각주는 **landmark 가 아니다.**
   * 종전에는 `<footer>` 라 `role=contentinfo` 로 집었는데, 그게 문제였다 — 이 요소는
   * `FeatureLayout` 직계라 main/section/article 밖이고, 그러면 `<footer>` 는 contentinfo
   * 랜드마크가 된다. 같은 층에 공용 `PageFooter` 가 있어 **시뮬레이터에만 contentinfo 가 둘**
   * 이었다(실측: 21개 라우트 중 /simulator 만 2개). 랜드마크가 둘이면 스크린리더의
   * "페이지 정보로 가기"가 어디로 갈지 사용자가 알 수 없다.
   * 이건 페이지의 마무리가 아니라 **숫자 하나에 붙은 각주**라 문단(`<p>`)이 맞다.
   * ⚠ 그래서 이제 역할이 아니라 **글자**로 찾는다.
   */
  it('shows the snapshot reference date when one exists', () => {
    render(createElement(MarketDataAsOf, { asOf: '2026-07-13' }));

    const footnote = screen.getByText(/티커 데이터 기준일/);
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
    // ⚠ 랜드마크를 만들지 않는다는 계약도 함께 잠근다 — `<footer>` 로 되돌리면 여기서 빨개진다.
    expect(screen.queryByRole('contentinfo')).not.toBeInTheDocument();
  });

  it('renders nothing for an empty reference date', () => {
    const { container } = render(createElement(MarketDataAsOf, { asOf: '' }));

    expect(container).toBeEmptyDOMElement();
  });
});
