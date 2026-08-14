// @vitest-environment node — 파일만 읽는 순수 테스트 (기준: vitest.config.ts)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { ROUTE_SHELLS, ROUTE_SHELL_EXCLUSIONS } from '@/tools/seo/routeShells';

/**
 * **색인 대상 라우트가 저마다의 정적 HTML 을 갖는다**는 계약 (2026-08-14).
 *
 * 이 앱은 SPA 라서 모든 라우트가 같은 `index.html`(= 랜딩 셸)을 받는다. 앱은 `useDocumentMeta` 로
 * 런타임에 제목·canonical 을 고치지만 **JS 를 실행하지 않는 크롤러는 그 수정을 보지 못한다.**
 * 실측(2026-08-14) 당시 사이트맵의 정적 라우트 23개 중 **14개**가 제목·canonical·본문이 랜딩과
 * 완전히 같았다 — robots.txt 로 네이버(Yeti)·다음(Daumoa)을 명시 허용해 놓고 그들에게는 사실상
 * 한 페이지만 보여 주던 상태다.
 *
 * 🔴 이 테스트가 막는 재발은 하나다: **새 라우트를 사이트맵에만 올리고 셸을 빠뜨리는 것.**
 *    그 실패는 화면에 아무 증상이 없고, 몇 주 뒤 "왜 이 페이지는 검색에 안 뜨지"로만 나타난다.
 */

const readRepoFile = (relativePath: string): string =>
  // ⚠ CRLF 정규화 — Windows 체크아웃에서만 정규식이 통째로 빗나가는 것을 막는다.
  readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), 'utf8').replace(/\r\n/g, '\n');

const viteConfig = readRepoFile('../../vite.config.ts');
const vercelJson = JSON.parse(readRepoFile('../../vercel.json')) as {
  rewrites: { source: string; destination: string }[];
};

/** 사이트맵 정본(vite.config.ts 의 ROUTES)에서 정적 라우트 경로만 뽑는다. */
const sitemapRoutes = [...viteConfig.matchAll(/\{ path: '([^']+)', priority/g)].map((match) => match[1]);

/** 서버 렌더 핸들러가 이미 라우트별 HTML 을 만드는 경로(정적 셸이 필요 없다). */
const SERVER_RENDERED = new Set(
  vercelJson.rewrites.filter((rule) => rule.destination.startsWith('/api/')).map((rule) => rule.source)
);

describe('사이트맵 ↔ 셸 목록 양방향 일치', () => {
  it('사이트맵의 정적 라우트는 셸이 있거나, 서버 렌더이거나, 제외 사유가 적혀 있다', () => {
    const shellPaths = new Set(ROUTE_SHELLS.map((route) => route.path));
    const unexplained = sitemapRoutes.filter(
      (path) => !shellPaths.has(path) && !SERVER_RENDERED.has(path) && !(path in ROUTE_SHELL_EXCLUSIONS)
    );

    // 빠뜨린 라우트가 있으면 그 경로가 그대로 실패 메시지에 뜬다.
    expect(unexplained).toEqual([]);
  });

  it('셸 목록의 모든 경로가 사이트맵에도 있다 — 색인되지 않을 페이지를 굽지 않는다', () => {
    const orphans = ROUTE_SHELLS.map((route) => route.path).filter((path) => !sitemapRoutes.includes(path));
    expect(orphans).toEqual([]);
  });

  it('제외 목록이 실재하는 라우트만 가리킨다 (오래된 사유가 남지 않게)', () => {
    const stale = Object.keys(ROUTE_SHELL_EXCLUSIONS).filter((path) => !sitemapRoutes.includes(path));
    expect(stale).toEqual([]);
  });
});

describe('셸 목록 ↔ vercel.json rewrite 양방향 일치', () => {
  it('셸마다 `<path>.html` 로 가는 rewrite 가 있다 — 없으면 구운 파일이 아무에게도 안 나간다', () => {
    const missing = ROUTE_SHELLS.filter((route) => {
      const rule = vercelJson.rewrites.find((item) => item.source === route.path);
      return rule?.destination !== `${route.path}.html`;
    }).map((route) => route.path);

    expect(missing).toEqual([]);
  });

  it('🔴 rewrite 가 전부 catch-all(`/(.*)`) 보다 앞에 있다 — 뒤면 index.html 이 먼저 잡아 규칙이 죽는다', () => {
    const catchAllIndex = vercelJson.rewrites.findIndex((rule) => rule.source === '/(.*)');
    const tooLate = ROUTE_SHELLS.filter(
      (route) => vercelJson.rewrites.findIndex((rule) => rule.source === route.path) > catchAllIndex
    ).map((route) => route.path);

    expect(catchAllIndex).toBeGreaterThan(0);
    expect(tooLate).toEqual([]);
  });

  it('🔴 `/ticker/compare` 가 `/ticker/:name` 보다 앞에 있다 — 뒤면 티커 핸들러가 삼킨다', () => {
    const compareIndex = vercelJson.rewrites.findIndex((rule) => rule.source === '/ticker/compare');
    const tickerIndex = vercelJson.rewrites.findIndex((rule) => rule.source === '/ticker/:name');

    expect(compareIndex).toBeGreaterThanOrEqual(0);
    expect(tickerIndex).toBeGreaterThan(compareIndex);
  });
});

describe('문구', () => {
  it('제목·설명이 비어 있지 않다 (정본이 비면 셸도 빈다)', () => {
    for (const route of ROUTE_SHELLS) {
      expect(route.title.length, route.path).toBeGreaterThan(3);
      expect(route.description.length, route.path).toBeGreaterThan(40);
    }
  });

  it('🔴 제목에 사이트명 접미가 이미 들어 있지 않다 — 들어 있으면 두 번 붙는다', () => {
    // 2026-08-14 실측: `documentTitle` 두 개가 접미를 품고 있어 `… - Hungry Hippo - Hungry Hippo` 였다.
    const doubled = ROUTE_SHELLS.filter((route) => route.title.includes('Hungry Hippo')).map((route) => route.path);
    expect(doubled).toEqual([]);
  });

  it('제목이 서로 다르다 — 중복 제목은 이 작업이 고치려는 결함 그 자체다', () => {
    const titles = ROUTE_SHELLS.map((route) => route.title);
    expect(new Set(titles).size).toBe(titles.length);
  });
});

describe('빌드 배선', () => {
  it('플러그인이 plugins 배열에 실제로 등록돼 있다', () => {
    expect(viteConfig).toMatch(/plugins:\s*\[[^\]]*routeShellsPlugin\(siteUrl\)/);
  });

  it('접미 문자열이 런타임 훅과 같다', () => {
    const hook = readRepoFile('../../pages/Ticker/hooks/useDocumentMeta.ts');
    const hookSuffix = /const SITE_SUFFIX = '([^']+)'/.exec(hook)?.[1];
    const buildSuffix = /const SITE_SUFFIX = '([^']+)'/.exec(viteConfig)?.[1];

    expect(hookSuffix).toBeDefined();
    expect(buildSuffix).toBe(hookSuffix);
  });

  it('두 곳 모두 `제목 - 사이트명` 형태로 조립한다', () => {
    const hook = readRepoFile('../../pages/Ticker/hooks/useDocumentMeta.ts');
    expect(hook).toContain('`${title} - ${SITE_SUFFIX}`');
    expect(viteConfig).toContain('`${route.title} - ${SITE_SUFFIX}`');
  });
});

describe('미들웨어 — 공유 링크도 시뮬레이터 셸을 쓴다', () => {
  const middleware = readRepoFile('../../middleware.ts');

  it('simulator.html 을 먼저 가져온다', () => {
    expect(middleware).toContain("'/simulator.html'");
  });

  it('없으면 index.html 로 폴백한다 — 옛 배포로 롤백돼도 공유 카드가 죽지 않는다', () => {
    expect(middleware).toMatch(/simulatorShell\.ok\s*\?\s*simulatorShell\s*:/);
  });
});

describe('robots.txt — 생성형 엔진(GEO)', () => {
  it('주요 AI 크롤러를 명시한다', () => {
    for (const agent of ['GPTBot', 'OAI-SearchBot', 'ClaudeBot', 'PerplexityBot', 'Google-Extended', 'CCBot']) {
      expect(viteConfig).toContain(`'${agent}'`);
    }
  });

  it('기계 판독 요약(llms.txt)의 위치를 알린다', () => {
    expect(viteConfig).toContain('/llms.txt');
  });

  it('국내 검색(Yeti·Daumoa)은 그대로 허용한다', () => {
    expect(viteConfig).toContain('User-agent: Yeti');
    expect(viteConfig).toContain('User-agent: Daumoa');
  });
});
