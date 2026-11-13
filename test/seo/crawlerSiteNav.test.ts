import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  CALENDAR_GROUP_ITEMS,
  COMMUNITY_GROUP_ITEMS,
  DIVIDEND_LIST_GROUP_ITEMS,
  MARKET_GROUP_ITEMS,
  PERSONAL_GROUP_ITEMS,
  PORTFOLIO_GROUP_ITEMS,
  TICKER_GROUP_ITEMS
} from '@/components/PrimaryNav';
import { COMMUNITY_COPY } from '@/shared/constants/community';
import {
  CRAWLER_SITE_NAV,
  CRAWLER_SITE_NAV_LABEL,
  buildCrawlerSiteNavHtml,
  injectIntoRoot
} from '@/shared/lib/og';

/**
 * 크롤러 HTML 공통 내비(2026-11-05)의 계약.
 *
 * 초기 HTML(JS 미실행) 기준으로 `/market/us-calendar` 의 내부 링크가 **0개**였다 — 헤더 내비는 React 가
 * 그려서 크롤러에게 보이지 않는다. 이 블록이 그 자리를 메운다. 지키는 것은 둘이다.
 *
 * 1. 목록이 **헤더 내비와 같다** — 사본이라(서버 번들에 아이콘·env 를 싣지 않으려고) 갈라질 수 있다.
 * 2. 모든 크롤러 표면에 **정확히 한 벌**이 붙는다 — 랜딩 본문의 것과 페이지의 것이 겹치지 않는다.
 */

const n = COMMUNITY_COPY.nav;

const toPairs = (items: readonly { to: string; label: string }[]) => items.map(({ to, label }) => ({ to, label }));

describe('크롤러 내비 ↔ 헤더 내비 일치', () => {
  it('🔴 묶음 순서·이름·경로·라벨이 헤더 내비와 같다 (가계부만 뺀다)', () => {
    const expected = [
      // 가계부는 구글 시트 연동 배포에만 있는 라우트라 크롤러에게 죽은 링크일 수 있다.
      { label: n.personalGroup, items: toPairs(PERSONAL_GROUP_ITEMS.filter((item) => !item.sheetsOnly)) },
      { label: n.portfolioGroup, items: toPairs(PORTFOLIO_GROUP_ITEMS) },
      { label: n.dividendListGroup, items: toPairs(DIVIDEND_LIST_GROUP_ITEMS) },
      { label: n.marketGroup, items: toPairs(MARKET_GROUP_ITEMS) },
      { label: n.tickerGroup, items: toPairs(TICKER_GROUP_ITEMS) },
      { label: n.calendarGroup, items: toPairs(CALENDAR_GROUP_ITEMS) },
      { label: n.communityGroup, items: toPairs(COMMUNITY_GROUP_ITEMS) }
    ];

    expect(CRAWLER_SITE_NAV.map((group) => ({ label: group.label, items: toPairs(group.items) }))).toEqual(expected);
  });
});

describe('크롤러 내비 마크업', () => {
  const html = buildCrawlerSiteNavHtml();

  it('모든 항목을 링크로 낸다', () => {
    const hrefs = [...html.matchAll(/<a href="([^"]+)">/g)].map((match) => match[1]);
    expect(hrefs).toEqual(CRAWLER_SITE_NAV.flatMap((group) => group.items.map((item) => item.to)));
  });

  it('이름 붙은 nav 랜드마크 하나다 — 본문 안의 다른 nav 와 구분된다', () => {
    expect(html.startsWith(`<nav aria-label="${CRAWLER_SITE_NAV_LABEL}"`)).toBe(true);
    expect(html.match(/<nav\b/g)).toHaveLength(1);
  });

  it('제목 태그를 만들지 않는다 — 페이지 본문의 제목 구조를 흐리지 않는다', () => {
    expect(html).not.toMatch(/<h[1-6]\b/);
  });
});

const countNav = (html: string): number => html.split(`aria-label="${CRAWLER_SITE_NAV_LABEL}"`).length - 1;

describe('서버 렌더 핸들러 공용 주입', () => {
  it('🔴 본문 뒤에 내비가 정확히 한 벌 붙는다', () => {
    const shell = '<html><body><div id="root"></div></body></html>';
    const out = injectIntoRoot(shell, '<article><h1>SCHD</h1></article>');

    expect(out).toContain(`<article><h1>SCHD</h1></article><nav aria-label="${CRAWLER_SITE_NAV_LABEL}"`);
    expect(countNav(out)).toBe(1);
  });

  it('🔴 랜딩 본문에 있던 내비는 본문과 함께 걷혀 두 벌이 되지 않는다', () => {
    const shell =
      '<html><body><div id="root"><div class="app-shell-fallback"><h1>랜딩</h1>' +
      buildCrawlerSiteNavHtml() +
      '</div></div></body></html>';
    const out = injectIntoRoot(shell, '<article><h1>SCHD</h1></article>');

    expect(out).not.toContain('<h1>랜딩</h1>');
    expect(countNav(out)).toBe(1);
  });
});

describe('index.html 랜딩 본문', () => {
  // ⚠ CRLF 정규화 — Windows 체크아웃에서도 같은 문자열 위치를 본다.
  const indexHtml = readFileSync(resolve(__dirname, '../../index.html'), 'utf8').replace(/\r\n/g, '\n');

  it('🔴 빌드가 치환할 내비 자리가 랜딩 본문(.app-shell-fallback) 안에 있다', () => {
    // 본문 밖에 두면 다른 페이지가 랜딩 본문을 걷어낼 때 남아서 내비가 두 벌이 된다.
    const fallbackStart = indexHtml.indexOf('<div class="app-shell-fallback">');
    const marker = indexHtml.indexOf('<!--SNOWBALL_SITE_NAV-->');
    const rootScript = indexHtml.indexOf('<script type="module" src="/main.tsx">');

    expect(fallbackStart).toBeGreaterThan(-1);
    expect(marker).toBeGreaterThan(fallbackStart);
    expect(marker).toBeLessThan(rootScript);
    expect(indexHtml.indexOf('<!--SNOWBALL_SITE_NAV-->', marker + 1)).toBe(-1);
  });
});

describe('JS 환경에서는 크롤러 블록이 첫 페인트부터 숨는다 (2026-11-13)', () => {
  /*
   * 크롤러 블록은 사람에게 보이면 안 된다 — 앱이 뜨기 전 잠깐이라도 스타일 없는 글자 목록이 번쩍인다.
   * 2026-11-05 에 내비를 깔면서 숨김 규칙에 넣지 않아 모든 페이지에서 실제로 번쩍였다(사용자 신고).
   * #root 바로 아래에 붙는 크롤러 블록의 class 는 전부 `index.html` 의 `.js .<class>` 숨김 규칙에 있어야 한다.
   */
  const html = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8');
  const hideRule = /((?:\.js\s+\.[\w-]+\s*,\s*)*\.js\s+\.[\w-]+)\s*\{\s*display:\s*none;?\s*\}/g;
  const hidden = new Set([...html.matchAll(hideRule)].flatMap((m) => [...m[1]!.matchAll(/\.js\s+\.([\w-]+)/g)].map((c) => c[1]!)));

  it('본문(app-shell-fallback)과 사이트 내비(crawler-site-nav)가 숨김 규칙에 있다', () => {
    const navClass = /class="([\w-]+)"/.exec(buildCrawlerSiteNavHtml())![1]!;
    expect(hidden).toContain('app-shell-fallback');
    expect(hidden).toContain(navClass);
  });

  it('숨김 표식(js 클래스)은 본문보다 먼저, 동기 스크립트로 붙는다', () => {
    const marker = html.indexOf("document.documentElement.classList.add('js')");
    expect(marker).toBeGreaterThan(-1);
    expect(marker).toBeLessThan(html.indexOf('<body'));
  });
});
