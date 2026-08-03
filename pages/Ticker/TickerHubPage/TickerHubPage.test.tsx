import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import TickerHubPage from './TickerHubPage';

function renderHub() {
  return render(
    <MemoryRouter initialEntries={['/ticker/all']}>
      <TickerHubPage />
    </MemoryRouter>
  );
}

/**
 * 🔴 카드 보기로 전환한 뒤 렌더한다.
 *
 * 2026-08-03 사용자 지시로 이 화면의 **기본 보기가 표**가 됐다(DEFAULT_HUB_FILTERS.view = 'table').
 * 카드의 모양·라벨·틴트 클러스터 표식을 검사하는 테스트들은 카드가 화면에 있어야 성립하므로
 * 여기서 한 번 전환한다 — 기본값을 되돌리는 것이 아니라 **그 보기를 켜서** 본다.
 * ⚠ 기본값이 표라는 사실 자체는 아래 별도 테스트가 잠근다.
 */
async function renderHubAsCards() {
  const user = userEvent.setup();
  const rendered = renderHub();
  await user.click(screen.getByRole('button', { name: '카드' }));
  return rendered;
}

/** 카드/표 어느 보기에서도 티커로 가는 링크는 같은 수여야 한다 — 그 수를 세는 단일 헬퍼. */
const tickerLinkCount = (container: HTMLElement): number =>
  container.querySelectorAll('a[href^="/ticker/"]:not([href="/ticker/compare"]):not([href="/ticker/all"])').length;

describe('TickerHubPage', () => {
  it('groups tickers under their category with a jump link', () => {
    renderHub();

    // 카테고리 헤딩과 바로가기 색인이 함께 렌더된다.
    const nav = screen.getByRole('navigation', { name: '카테고리 바로가기' });
    expect(within(nav).getByRole('link', { name: /배당성장 ETF/ })).toHaveAttribute('href', '#dividend-growth');
    expect(screen.getByRole('heading', { name: /배당성장 ETF/ })).toBeInTheDocument();
  });

  it('renders each ticker as a card linking to its detail page', () => {
    renderHub();

    // 카드의 접근 가능한 이름은 티커 심볼(CardSymbol)로 시작한다 — `/^SCHD/`로 앵커링해야
    // SCHY 카드(태그라인에 비교 대상으로 "SCHD"를 언급)와 혼동되지 않는다.
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

  it('marks each card grid as one tint cluster so the colour caps count as a single face', async () => {
    const { container } = await renderHubAsCards();

    /*
     * 이 화면은 틴트 캡(48px)을 쓰는 유일한 라우트다. 2026-08-03 흰 캔버스 전환으로 캡의 면색이
     * 중립(surface-sunken)이 되어 **지금은** tintscan 이 세지 않지만, 표식은 남긴다 — 캡을 다시
     * 채도로 되돌리는 순간 표식 없이는 카드 장수만큼 면이 잡혀 예산(화면당 2면)이 조용히 터진다.
     * 표식은 장식이 아니라 측정 계약이고, 계약은 미리 서 있어야 값이 있다.
     */
    const grids = container.querySelectorAll('[data-tint-cluster]');
    expect(grids.length).toBeGreaterThan(0);
    for (const grid of grids) {
      // 라우트당 **한 값**만 허용된다(값이 갈리면 집계 단계가 막는다).
      expect(grid.getAttribute('data-tint-cluster')).toBe('pick-grid');
    }
  });

  it('labels every card metric so a value never stands alone', async () => {
    await renderHubAsCards();

    const card = screen.getByRole('link', { name: /^SCHD/ }).closest('article');
    expect(card).not.toBeNull();

    // 배당률·지급은 모든 티커가 갖는다(운용보수는 값이 없으면 행 자체가 빠진다).
    expect(within(card as HTMLElement).getByText('배당률')).toBeInTheDocument();
    expect(within(card as HTMLElement).getByText('지급')).toBeInTheDocument();
  });

  it('narrows the list by search and says how many are left', async () => {
    const user = userEvent.setup();
    const { container } = renderHub();

    const before = tickerLinkCount(container);
    expect(before).toBeGreaterThan(20);

    await user.type(screen.getByRole('searchbox', { name: '티커·종목명 검색' }), 'jepi');

    // JEPI 만 남는다 — 빈 상태의 추천 칩(SCHD·JEPI·O)이 서지 않는 상태여야 한다.
    expect(screen.getByRole('link', { name: /^JEPI/ })).toHaveAttribute('href', '/ticker/jepi');
    expect(tickerLinkCount(container)).toBeLessThan(before);
    expect(screen.getByRole('status')).toHaveTextContent('전체');
  });

  it('keeps every category section (and therefore every anchor) alive while filtered', async () => {
    const user = userEvent.setup();
    const { container } = renderHub();

    await user.type(screen.getByRole('searchbox', { name: '티커·종목명 검색' }), 'jepi');

    /*
     * 🔴 필터가 걸려도 섹션은 사라지지 않는다 — 섹션 id 는 색인 앵커의 목적지다.
     * 결과가 0인 칸은 한 줄 안내로 남는다(링크가 죽지 않게 하는 계약).
     */
    const nav = screen.getByRole('navigation', { name: '카테고리 바로가기' });
    for (const anchor of within(nav).getAllByRole('link')) {
      const href = anchor.getAttribute('href') ?? '';
      expect(container.querySelector(`section${href}`)).not.toBeNull();
    }
  });

  it('offers a way back when nothing matches', async () => {
    const user = userEvent.setup();
    renderHub();

    await user.type(screen.getByRole('searchbox', { name: '티커·종목명 검색' }), 'zzzz없는티커');

    expect(screen.getByText('조건에 맞는 티커가 없습니다')).toBeInTheDocument();

    // 막다른 길로 두지 않는다 — 조건을 지우면 목록이 돌아온다.
    await user.click(screen.getAllByRole('button', { name: /조건 지우기/ })[0]);
    expect(screen.getByRole('link', { name: /^SCHD/ })).toBeInTheDocument();
  });

  it('keeps every detail entry point when the reader switches to the table view', async () => {
    const user = userEvent.setup();
    const { container } = renderHub();

    const cardLinks = tickerLinkCount(container);

    await user.click(screen.getByRole('button', { name: '표' }));

    // 🔴 보기 전환은 표현만 바꾼다 — 진입점 수가 줄면 기능이 사라진 것이다.
    expect(tickerLinkCount(container)).toBe(cardLinks);
    expect(screen.getAllByRole('table').length).toBeGreaterThan(0);
    expect(screen.getByRole('link', { name: 'SCHD' })).toHaveAttribute('href', '/ticker/schd');
  });

  it('sorts by dividend yield on request', async () => {
    const user = userEvent.setup();
    const { container } = await renderHubAsCards();

    await user.selectOptions(screen.getByRole('combobox', { name: '정렬 기준' }), 'yield-desc');

    const firstSection = container.querySelector('section#dividend-growth');
    const symbols = [...(firstSection?.querySelectorAll('h3') ?? [])].map((h) => h.textContent ?? '');
    expect(symbols.length).toBeGreaterThan(1);

    // 정렬 결과는 이름이 아니라 값의 순서로 검증한다 — 데이터가 갱신돼도 이 계약은 유지된다.
    const yields = [...(firstSection?.querySelectorAll('dd') ?? [])]
      .map((dd) => dd.textContent ?? '')
      .filter((text) => text.endsWith('%'));
    const parsed = symbols.map((_, index) => Number.parseFloat(yields[index * 2] ?? '0'));
    for (let i = 1; i < parsed.length; i += 1) expect(parsed[i]).toBeLessThanOrEqual(parsed[i - 1]);
  });

  it('reports the library scope in the masthead spec strip', () => {
    renderHub();

    expect(screen.getByText('수록 종목')).toBeInTheDocument();
    expect(screen.getByText('배당률 범위')).toBeInTheDocument();
    expect(screen.getByText('매월 지급')).toBeInTheDocument();
  });

  /**
   * 🔴 기본 보기는 **표**다(2026-08-03 사용자 지시: "카드가 아니라 표가 default인게 더 좋다").
   * 이 허브는 고르는 화면이 아니라 **비교해서 찾는** 화면이라, 배당률·운용보수·주기를 나란히
   * 훑는 일이 카드 격자보다 표에서 빠르다. 값의 출처는 DEFAULT_HUB_FILTERS 하나다.
   */
  it('기본 보기는 표다 — 카드가 아니다', () => {
    renderHub();

    expect(screen.getByRole('button', { name: '표' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: '카드' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getAllByRole('table').length).toBeGreaterThan(0);
  });
});
