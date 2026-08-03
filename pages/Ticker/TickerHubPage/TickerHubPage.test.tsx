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

  it('keeps every jump link pointing at a section that actually exists', () => {
    const { container } = renderHub();

    // 해시 앵커 배선은 이 화면의 유일한 목차다 — 링크와 섹션 id 가 어긋나면 조용히 아무 데도 못 간다.
    const nav = screen.getByRole('navigation', { name: '카테고리 바로가기' });
    const anchors = within(nav).getAllByRole('link');
    expect(anchors.length).toBeGreaterThan(1);

    for (const anchor of anchors) {
      const href = anchor.getAttribute('href') ?? '';
      expect(href.startsWith('#')).toBe(true);
      expect(container.querySelector(`section${href}`)).not.toBeNull();
    }
  });

  it('offers the compare entry point outside the category nav', () => {
    renderHub();

    const compare = screen.getByRole('link', { name: /종목 비교하기/ });
    expect(compare).toHaveAttribute('href', '/ticker/compare');

    /*
     * 🔴 "카테고리 바로가기" nav 는 **같은 문서 안 이동만** 담는다는 약속이다. 다른 라우트로
     * 나가는 이 링크가 그 안에 섞이면 스크린리더 사용자가 목록을 훑다 화면 밖으로 튕긴다.
     * 규칙이 스타일 주석에만 있으면 눈으로는 뒤늦게 발견된다 — 구조로 잠근다.
     */
    const nav = screen.getByRole('navigation', { name: '카테고리 바로가기' });
    expect(nav.contains(compare)).toBe(false);
  });

  it('marks each card grid as one tint cluster so the colour caps count as a single face', () => {
    const { container } = renderHub();

    /*
     * 이 화면은 컬러 캡을 쓰는 유일한 라우트다. 표식이 빠지면 tintscan 이 카드 장수만큼 면을 세어
     * 예산(화면당 2면)을 즉시 초과한다 — 표식은 장식이 아니라 측정 계약이다.
     */
    const grids = container.querySelectorAll('[data-tint-cluster]');
    expect(grids.length).toBeGreaterThan(0);
    for (const grid of grids) {
      // 라우트당 **한 값**만 허용된다(값이 갈리면 집계 단계가 막는다).
      expect(grid.getAttribute('data-tint-cluster')).toBe('pick-grid');
    }
  });

  it('labels every card stat so a value never stands alone', () => {
    renderHub();

    const card = screen.getByRole('link', { name: /^SCHD/ }).closest('article');
    expect(card).not.toBeNull();

    // 배당률·지급은 모든 티커가 갖는다(운용보수는 값이 없으면 칸 자체가 빠진다).
    expect(within(card as HTMLElement).getByText('배당률')).toBeInTheDocument();
    expect(within(card as HTMLElement).getByText('지급')).toBeInTheDocument();
  });
});
