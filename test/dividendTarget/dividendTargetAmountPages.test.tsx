import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { routes } from '@/router/routes';
import { DIVIDEND_TARGET_COPY } from '@/pages/DividendTarget/copy';
import { formatKoreanWon, formatManWon } from '@/pages/DividendTarget/utils';
import {
  DIVIDEND_TARGET_AMOUNT_PAGES_MAN,
  DIVIDEND_TARGET_PATH,
  dividendTargetAmountPath,
  parseDividendTargetAmountSegment
} from '@/shared/constants/routes';
import { buildDividendTargetModel, findTickerRequirement } from '@/shared/lib/dividendTarget';
import { ROUTE_SHELLS } from '@/tools/seo/routeShells';
import { renderDividendTargetShellBody } from '@/tools/seo/dividendTargetShell';

/**
 * 월 배당 필요 원금 — **금액별 고정 주소**(`/dividend/how-much/100`, 2026-11-09).
 *
 * 검색어가 금액 단위("월 100만원 배당 받으려면")로 들어오는데 쿼리 주소는 색인 대상이 아니라 맞물리는 지면이
 * 없었다. 잠그는 것: ① 주소의 금액으로 화면이 시작한다 ② 제목·canonical 이 금액마다 다르다 ③ 목록 밖 금액은
 * 기본 주소로 ④ 기존 `?m=` 링크는 그대로 ⑤ 크롤러 본문에 실제 숫자가 있다 ⑥ 사이트맵·rewrite 가 목록과 같다.
 */
const REPO_ROOT = join(__dirname, '../..');
const read = (path: string) => readFileSync(join(REPO_ROOT, path), 'utf-8');

const renderAt = (entry: string) => {
  const router = createMemoryRouter(routes, { initialEntries: [entry] });
  render(<RouterProvider router={router} />);
  return router;
};

const principalOf = (monthlyMan: number, ticker: string): string =>
  formatKoreanWon(
    findTickerRequirement(buildDividendTargetModel(monthlyMan * 10_000, 2), ticker)!.requirement!.requiredPrincipal
  );

describe('parseDividendTargetAmountSegment', () => {
  it('목록에 있는 금액만 받는다 — 기본 금액(250)·임의 숫자·숫자 아닌 값은 null', () => {
    expect(parseDividendTargetAmountSegment('100')).toBe(100);
    expect(parseDividendTargetAmountSegment('250')).toBeNull();
    expect(parseDividendTargetAmountSegment('7')).toBeNull();
    expect(parseDividendTargetAmountSegment('100abc')).toBeNull();
    expect(parseDividendTargetAmountSegment(undefined)).toBeNull();
  });
});

describe('/dividend/how-much/:monthly — 화면', () => {
  it('🔴 주소의 금액으로 시작하고, 제목이 그 금액의 검색 질문이다', async () => {
    // useDocumentMeta 는 index.html 에 있는 canonical 을 **바꾼다**(새로 만들지 않는다) — 그 태그를 둔다.
    const canonical = document.createElement('link');
    canonical.rel = 'canonical';
    canonical.id = 'canonical-link';
    canonical.href = 'https://example.test/';
    document.head.appendChild(canonical);

    renderAt(dividendTargetAmountPath(100));

    expect(await screen.findByRole('heading', { level: 1, name: /매달 100만원 받으려면/ })).toBeInTheDocument();
    expect(screen.getAllByText(principalOf(100, 'SCHD')).length).toBeGreaterThan(0);
    expect(document.title).toContain(DIVIDEND_TARGET_COPY.amountMeta.title(formatManWon(100)));
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href')).toMatch(/\/dividend\/how-much\/100$/);
  });

  it('목록 밖 금액 주소는 기본 주소로 보낸다 (중복·빈 지면을 색인시키지 않는다)', async () => {
    const router = renderAt(`${DIVIDEND_TARGET_PATH}/7`);
    expect(await screen.findByRole('heading', { level: 1, name: /250만원/ })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe(DIVIDEND_TARGET_PATH);
  });

  it('금액 주소에서 금액을 바꾸면 기본 주소 + 쿼리로 옮긴다 (주소와 쿼리가 다른 금액을 말하지 않게)', async () => {
    const user = userEvent.setup();
    const router = renderAt(dividendTargetAmountPath(100));
    await screen.findByRole('heading', { level: 1, name: /100만원/ });

    await user.click(screen.getByRole('button', { name: '300만원' }));

    expect(router.state.location.pathname).toBe(DIVIDEND_TARGET_PATH);
    expect(router.state.location.search).toBe('?m=300');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('매달 300만원 받으려면');
  });

  it('금액 주소에서 종목만 바꿔도 금액은 이어진다', async () => {
    const user = userEvent.setup();
    const router = renderAt(dividendTargetAmountPath(100));
    await screen.findByRole('heading', { level: 1, name: /100만원/ });

    const compare = screen.getByRole('region', { name: DIVIDEND_TARGET_COPY.compare.title });
    await user.click(within(compare).getByRole('button', { name: /JEPI\b(?!Q)/ }));

    expect(router.state.location.pathname).toBe(DIVIDEND_TARGET_PATH);
    expect(new URLSearchParams(router.state.location.search).get('m')).toBe('100');
    expect(new URLSearchParams(router.state.location.search).get('t')).toBe('JEPI');
  });

  it('🔴 기존 쿼리 링크(`?m=300`)는 그대로 동작한다', async () => {
    renderAt(`${DIVIDEND_TARGET_PATH}?m=300`);
    expect(await screen.findByRole('heading', { level: 1, name: /매달 300만원 받으려면/ })).toBeInTheDocument();
  });
});

describe('크롤러 본문(정적 셸)', () => {
  it('🔴 화면과 같은 모델의 숫자를 표로 싣는다', () => {
    const html = renderDividendTargetShellBody(100);

    expect(html).toContain('<h1>월 100만원 배당 받으려면 얼마가 필요할까?</h1>');
    expect(html).toContain(principalOf(100, 'SCHD'));
    expect(html).toContain(principalOf(100, 'JEPI'));
    expect(html).toContain('<caption>');
  });

  it('다른 금액 지면으로 서로 잇는다 (자기 자신은 빼고)', () => {
    const html = renderDividendTargetShellBody(100);
    for (const man of DIVIDEND_TARGET_AMOUNT_PAGES_MAN) {
      const link = `href="${dividendTargetAmountPath(man)}"`;
      if (man === 100) expect(html).not.toContain(link);
      else expect(html).toContain(link);
    }
  });

  it('금액마다 셸이 있고 제목이 서로 다르며 본문을 갖는다', () => {
    for (const man of DIVIDEND_TARGET_AMOUNT_PAGES_MAN) {
      const shell = ROUTE_SHELLS.find((route) => route.path === dividendTargetAmountPath(man));
      expect(shell, String(man)).toBeDefined();
      expect(shell!.title).toBe(DIVIDEND_TARGET_COPY.amountMeta.title(formatManWon(man)));
      expect(shell!.bodyHtml).toContain(`월 ${formatManWon(man)}`);
    }
    expect(ROUTE_SHELLS.find((route) => route.path === DIVIDEND_TARGET_PATH)?.bodyHtml).toContain('<table>');
  });
});

describe('사이트맵·rewrite 와 금액 목록의 정합', () => {
  it('🔴 vite.config 사이트맵과 vercel.json rewrite 가 금액 목록과 정확히 같다', () => {
    const vite = read('vite.config.ts');
    const vercel = read('vercel.json');
    const sitemapAmounts = [...vite.matchAll(/path: '\/dividend\/how-much\/(\d+)'/g)].map((m) => Number(m[1]));
    const rewriteAmounts = [...vercel.matchAll(/"source": "\/dividend\/how-much\/(\d+)"/g)].map((m) => Number(m[1]));

    expect(sitemapAmounts).toEqual([...DIVIDEND_TARGET_AMOUNT_PAGES_MAN]);
    expect(rewriteAmounts).toEqual([...DIVIDEND_TARGET_AMOUNT_PAGES_MAN]);
  });
});
