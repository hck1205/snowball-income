import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { resolveTickerEngineFacts } from '@/shared/constants/tickers';
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

  it('renders related tickers without content as plain text, not dead-end links', () => {
    renderAt('/ticker/hdv');
    // NOBL(배당귀족 ETF)은 이 레지스트리에 콘텐츠가 없으므로 링크가 아니라 텍스트로만 나온다
    // (서버 렌더러와 일치 — SCHD의 관련 티커가 전부 콘텐츠를 갖게 되며 이 커버리지는 HDV로 옮겼다).
    expect(screen.getByText('NOBL')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /NOBL/ })).toBeNull();
  });

  it('exposes exactly one h1 and it names the ticker', () => {
    renderAt('/ticker/schd');
    const h1s = screen.getAllByRole('heading', { level: 1 });
    expect(h1s).toHaveLength(1);
    expect(h1s[0]).toHaveTextContent('SCHD');
  });

  it('does not use snowball metaphor copy', () => {
    renderAt('/ticker/schd');
    expect(screen.queryByText(/눈덩이/)).toBeNull();
    expect(screen.queryByText(/스노우볼/)).toBeNull();
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
