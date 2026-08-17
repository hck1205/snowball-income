import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LANDING_COPY, LANDING_SEARCH_FALLBACK } from '@/pages/Landing/copy';
import { renderLandingPage, setWorkspaceMarker, stubMarketIndicesFetch } from './landingHarness';

/**
 * 랜딩 종목 검색 — **사용자 행동 기반** 계약.
 *
 * 이 검색이 지켜야 하는 것은 화려한 상호작용이 아니라 넷이다.
 *  ① 없으면 없다고 **사유를 말한다**(무음 실패 금지) — 그리고 그때도 갈 곳을 준다.
 *  ② 폴백을 "추천"이라고 부르지 않는다 — 그 순간 투자 권유가 된다.
 *  ③ 결과는 소개 페이지가 **실재하는** 종목뿐이다(죽은 링크 금지).
 *  ④ 팝업이 아니다 — 흐름 안 목록이라 모달도 포커스 트랩도 없다.
 */

let restoreFetch: () => void;

const typeQuery = async (text: string) => {
  const user = userEvent.setup();
  const input = screen.getByRole('searchbox', { name: LANDING_COPY.hero.searchLabel });
  await user.clear(input);
  await user.type(input, text);
  return input;
};

describe('랜딩 — 종목 검색', () => {
  beforeEach(() => {
    restoreFetch = stubMarketIndicesFetch();
    setWorkspaceMarker(false);
  });

  afterEach(() => {
    restoreFetch();
  });

  it('심볼을 치면 그 종목의 소개 페이지로 가는 링크가 나온다', async () => {
    renderLandingPage();
    await typeQuery('schd');

    const link = await screen.findByRole('link', { name: /SCHD/ });
    expect(link).toHaveAttribute('href', '/ticker/schd');
  });

  it('한글명 일부로도 찾는다', async () => {
    renderLandingPage();
    await typeQuery('리얼티');

    expect(await screen.findByRole('link', { name: /리얼티 인컴/ })).toHaveAttribute('href', '/ticker/o');
  });

  it('결과 건수를 눈과 귀에 같은 문장으로 알린다', async () => {
    renderLandingPage();
    await typeQuery('SCHD');

    const status = await screen.findByRole('status');
    expect(status).toHaveTextContent(LANDING_COPY.search.resultCount(1));
  });

  it('한 글자로는 검색하지 않는다 — 패널 자체가 뜨지 않아 히어로 높이가 흔들리지 않는다', async () => {
    renderLandingPage();
    await typeQuery('S');

    expect(screen.queryByRole('link', { name: /SCHD/ })).toBeNull();
    expect(screen.getByRole('status')).toHaveTextContent('');
  });

  it('결과가 없으면 사유를 말하고, "소개 글이 준비된 종목" 셋으로 안내한다', async () => {
    renderLandingPage();
    /*
     * 🔴 **실재하는 종목명을 "결과 없음" 질의로 쓰지 마라.** 예전에는 '테슬라' 였는데, 소개 페이지가
     * 늘 때마다 그 이름이 걸리기 시작한다(2026-08-17 TSLA 페이지 추가로 실제로 깨졌다). 회귀가
     * 아니라 검색이 맞게 동작한 결과다 — 라이브러리가 커져도 절대 걸릴 수 없는 문자열을 쓴다.
     */
    const NEVER_MATCHES = '존재하지않는종목';
    await typeQuery(NEVER_MATCHES);

    expect(await screen.findByText(LANDING_COPY.search.empty(NEVER_MATCHES))).toBeInTheDocument();

    const fallbackTitle = screen.getByText(LANDING_COPY.search.fallbackTitle);
    // 🔴 "추천 종목"이라고 부르면 투자 권유다. 문구가 바뀌면 여기서 잡는다.
    expect(fallbackTitle.textContent).not.toMatch(/추천/);

    for (const symbol of LANDING_SEARCH_FALLBACK) {
      expect(screen.getByRole('link', { name: new RegExp(symbol) })).toBeInTheDocument();
    }
  });

  it('검색 결과 패널은 팝업이 아니다 — 모달이 열리지 않는다', async () => {
    renderLandingPage();
    await typeQuery('SCHD');

    await screen.findByRole('link', { name: /SCHD/ });
    expect(screen.queryAllByRole('dialog')).toHaveLength(0);
  });

  it('주소의 `q` 로 들어오면 그 검색 결과가 이미 떠 있다', async () => {
    renderLandingPage('/?q=JEPI');

    expect(await screen.findByRole('link', { name: /JEPI/ })).toHaveAttribute('href', '/ticker/jepi');
  });

  it('무결과 폴백 링크도 전부 소개 페이지가 실재하는 종목이다 — 죽은 링크가 없다', async () => {
    renderLandingPage();
    // ⚠ 'ETF' 처럼 한글명에 흔한 낱말을 쓰면 무결과가 아니다 — 어느 종목명에도 없는 말을 고른다.
    await typeQuery('카카오뱅크');

    const status = await screen.findByRole('status');
    expect(status).toHaveTextContent(LANDING_COPY.search.empty('카카오뱅크'));

    const panel = screen.getByText(LANDING_COPY.search.fallbackTitle).parentElement as HTMLElement;
    for (const link of within(panel).getAllByRole('link')) {
      expect(link.getAttribute('href')).toMatch(/^\/ticker\/[a-z]+$/);
    }
  });
});
