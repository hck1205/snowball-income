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

  /**
   * 🔴 목차는 **본문 장만이 아니라 페이지 전체**를 센다(2026-08-03 개편).
   *
   * 종전 목차는 서사 섹션만 담아 문서의 앞 60%만 가리켰고, 참고 지표·FAQ·관련 티커로 내려가면
   * 활성 표시가 마지막 장에 멈춘 채였다. 이 검사가 그 뒤 절반을 잠근다 — 부록 항목이 목차에서
   * 사라지면 실패한다.
   */
  it('lists the appendix blocks in the table of contents, not just the prose chapters', async () => {
    const user = userEvent.setup();
    renderAt('/ticker/schd');

    const toc = screen.getByRole('navigation', { name: '이 페이지 목차' });
    for (const label of ['참고 지표', '자주 묻는 질문', '다음에 볼 티커']) {
      expect(within(toc).getByRole('button', { name: label })).toBeInTheDocument();
    }

    // 목차 항목은 실제 앵커로 이동한다(존재하지 않는 id 를 가리키면 눌러도 아무 일이 없다).
    await user.click(within(toc).getByRole('button', { name: '자주 묻는 질문' }));
    expect(document.getElementById('faq')).toHaveFocus();
  });

  /**
   * 히어로 지표 4종은 **하나도 빠지지 않는다** — 배치만 "주역 하나 + 보조 셋"으로 갈렸다.
   * 값이 아니라 개수를 지키는 검사다(엔진 값이 갱신돼도 이 검사는 그대로 유효하다).
   */
  it('keeps all four engine stats in the hero (one lead + three supporting)', () => {
    const facts = resolveTickerEngineFacts('SCHD');
    renderAt('/ticker/schd');

    for (const label of [
      '배당률(세전, 명목)',
      '연 배당성장률(계산 가정)',
      '기대 총수익률(가정)',
      '배당 지급 주기'
    ]) {
      expect(screen.getAllByText(label).length).toBeGreaterThan(0);
    }
    expect(screen.getAllByText(facts.expectedTotalReturnDisplay).length).toBeGreaterThan(0);
    expect(screen.getAllByText(facts.frequencyLabel).length).toBeGreaterThan(0);
  });

  /**
   * 상위 보유 종목은 **크롤러가 읽는 서버 HTML 에만** 있고 화면에는 없던 블록이다
   * (`server/handlers/TickerHtml` 의 renderTopHoldings). 2026-08-03 개편에서 화면에도 들어왔다.
   *
   * 🔴 앵커 티커를 하드코딩하지 않는다 — `topHoldings` 가 채워진 첫 엔트리를 데이터에서 고른다
   * (발행사 접근이 막혀 특정 티커가 비어도 이 파일을 고칠 일이 없어야 한다).
   */
  it('renders the top-holdings table for tickers that have issuer-disclosed holdings', () => {
    const entry = TICKER_CONTENT_LIST.find((content) => content.reference.topHoldings !== undefined);
    expect(entry).toBeDefined();
    const topHoldings = entry!.reference.topHoldings!;

    renderAt(`/ticker/${entry!.slug}`);

    expect(screen.getByRole('heading', { name: '상위 보유 종목' })).toBeInTheDocument();
    const table = screen.getByRole('table');
    // 첫 행의 심볼과 출처 링크가 실제로 나온다(표만 있고 출처가 없으면 값의 근거가 사라진다).
    expect(within(table).getByText(topHoldings.holdings[0]!.symbol)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: topHoldings.sourceLabel })).toHaveAttribute(
      'href',
      topHoldings.sourceUrl
    );
  });

  it('omits the top-holdings block entirely when the issuer data is not filled in (SCHD)', () => {
    const schd = TICKER_CONTENT_LIST.find((content) => content.ticker === 'SCHD');
    // 전제: SCHD 는 변동성을 이유로 보유 종목을 일부러 비워 뒀다. 채워지면 이 검사의 대상이 바뀐다.
    expect(schd?.reference.topHoldings).toBeUndefined();

    renderAt('/ticker/schd');
    expect(screen.queryByRole('heading', { name: '상위 보유 종목' })).toBeNull();
    expect(screen.queryByRole('table')).toBeNull();
  });

  /** 콘텐츠가 없는 관련 티커는 링크가 아닐 뿐 아니라, **글자로** 그 사실을 말해야 한다(색 단독 금지). */
  it('labels content-less related tickers in words, not only by styling', () => {
    renderAt('/ticker/sdy');
    expect(screen.getAllByText('소개 준비 중').length).toBeGreaterThan(0);
  });

  /** 이 지면의 법무 링크는 공용 푸터가 유일한 상시 진입점이다(개편 전에는 푸터 자체가 없었다). */
  it('renders the shared site footer with the legal entry points', () => {
    renderAt('/ticker/schd');
    expect(screen.getByRole('link', { name: '개인정보처리방침' })).toHaveAttribute('href', '/privacy');
    expect(screen.getByRole('link', { name: '이용약관' })).toHaveAttribute('href', '/terms');
  });
});
