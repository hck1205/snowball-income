import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { resolveTickerEngineFacts, TICKER_CONTENT_LIST } from '@/shared/constants/tickers';
import TickerDetailPage from './TickerDetailPage';

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/ticker/all" element={<h1>티커 허브</h1>} />
        <Route path="/ticker/:name" element={<TickerDetailPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('TickerDetailPage', () => {
  it('renders the ticker hero with the engine-resolved dividend yield', () => {
    const facts = resolveTickerEngineFacts('SCHD');
    renderAt('/ticker/schd');

    // 심볼이 헤딩(히어로)으로 노출된다.
    expect(screen.getAllByText('SCHD').length).toBeGreaterThan(0);
    // 배당률은 하드코딩이 아니라 프리셋에서 조인한 값이 나온다.
    expect(screen.getAllByText(facts.dividendYieldDisplay).length).toBeGreaterThan(0);
  });

  it('is case-insensitive on the slug', () => {
    renderAt('/ticker/SCHD');
    expect(screen.getAllByText('SCHD').length).toBeGreaterThan(0);
  });

  it('renders the table of contents and every section heading', () => {
    renderAt('/ticker/schd');

    const toc = screen.getByRole('navigation', { name: '이 페이지 목차' });
    expect(within(toc).getByRole('button', { name: '개요' })).toBeInTheDocument();
    expect(within(toc).getByRole('button', { name: '배당률' })).toBeInTheDocument();

    // 섹션 제목이 실제로 렌더된다(목차와 별개).
    expect(screen.getByRole('heading', { name: 'SCHD, 무엇을 추종하는 ETF인가' })).toBeInTheDocument();
  });

  it('exposes FAQs as accessible disclosure widgets', () => {
    renderAt('/ticker/schd');
    expect(screen.getByText('SCHD 배당률은 얼마인가요?')).toBeInTheDocument();
  });

  it('renders related tickers that gained content as real links (VIG added 2026-07-23)', () => {
    renderAt('/ticker/schd');
    // VIG는 2026-07-23 10종 추가로 콘텐츠를 갖게 됐다 — 서버 렌더러(renderRelatedTickers)와
    // 마찬가지로 클라이언트도 실제 링크로 승격돼야 한다(둘 다 findTickerContentBySlug로 게이팅).
    expect(screen.getByRole('link', { name: /VIG/ })).toHaveAttribute('href', '/ticker/vig');
  });

  /**
   * 🔴 이 검사의 앵커는 "그 시점에 콘텐츠가 없는 관련 티커"라서, 그 티커에 페이지가 생기면 검사가
   * 무의미해진다 — 실제로 두 번 옮겼다(SCHD→HDV→SDY). 2026-08-02 배치가 NOBL 페이지를 만들면서
   * HDV→NOBL 이 링크로 승격돼 빨개졌다. 앵커를 옮길 때는 **레지스트리에 없는 심볼**을 골라야 하고,
   * 아래 첫 단정이 그 전제를 먼저 확인하므로 DVY 페이지가 생기면 원인이 바로 드러난다.
   */
  it('renders related tickers without content as plain text, not dead-end links', () => {
    expect(TICKER_CONTENT_LIST.some((entry) => entry.ticker === 'DVY')).toBe(false);

    renderAt('/ticker/sdy');
    expect(screen.getByText('DVY')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /DVY/ })).toBeNull();
  });

  it('exposes exactly one h1 and it names the ticker', () => {
    renderAt('/ticker/schd');
    const h1s = screen.getAllByRole('heading', { level: 1 });
    expect(h1s).toHaveLength(1);
    expect(h1s[0]).toHaveTextContent('SCHD');
  });

  /*
   * 비유 금지에는 **예외가 없다**(2026-08-03 — 구 "브랜드명은 예외" 조항 폐기. 제품명은 영문
   * Hungry Hippo 하나라 워드마크가 이 규칙에 걸릴 일 자체가 없다). 그래도 범위를 `main` 으로 두는 건
   * 이 테스트의 대상이 **본문 카피**이기 때문이다 — 헤더·푸터는 각자의 가드가 본다.
   */
  it('does not use snowball metaphor copy', () => {
    renderAt('/ticker/schd');
    const main = within(screen.getByRole('main'));
    expect(main.queryByText(/눈덩이/)).toBeNull();
    expect(main.queryByText(/스노우볼/)).toBeNull();
  });

  it('injects the per-ticker accent theme at the page root', () => {
    const { container } = renderAt('/ticker/schd');
    const scope = container.querySelector('[data-accent="true"]');
    expect(scope).not.toBeNull();
    // 액센트 원시 변수가 인라인으로 주입된다(장식 CSS 변수의 원천).
    expect(scope?.getAttribute('style')).toContain('--tk-from');
  });

  it('links to the ticker hub and drops the simulator CTA buttons', () => {
    renderAt('/ticker/schd');
    // '다른 티커 보기' 내부 링크는 유지(SEO 내부 링크).
    expect(screen.getByRole('link', { name: '다른 티커 보기' })).toHaveAttribute('href', '/ticker/all');
    // 시뮬레이터로 보내던 두 CTA(사용자 요청으로 제거)는 더 이상 없다.
    expect(screen.queryByRole('link', { name: '내 조건으로 시뮬레이터에서 계산하기' })).toBeNull();
    expect(screen.queryByRole('link', { name: '시뮬레이터 열기' })).toBeNull();
  });

  it('sets a ticker-specific document title', () => {
    renderAt('/ticker/schd');
    expect(document.title).toContain('SCHD');
  });

  it('redirects unknown slugs to the hub', () => {
    renderAt('/ticker/does-not-exist');
    expect(screen.getByRole('heading', { name: '티커 허브' })).toBeInTheDocument();
  });

  it('moves focus to a section when its TOC entry is clicked', async () => {
    const user = userEvent.setup();
    renderAt('/ticker/schd');

    await user.click(screen.getByRole('button', { name: '배당률' }));

    const section = document.getElementById('dividend-yield');
    expect(section).not.toBeNull();
    expect(section).toHaveFocus();
  });
});
