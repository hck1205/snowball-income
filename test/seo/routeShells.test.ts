// @vitest-environment node — 파일만 읽는 순수 테스트 (기준: vitest.config.ts)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { ROUTE_SHELLS, ROUTE_SHELL_EXCLUSIONS } from '@/tools/seo/routeShells';
import { withSiteTitleSuffix } from '@/shared/constants/site';
import { PRIVACY_DOCUMENT, TERMS_DOCUMENT } from '@/pages/Legal/copy';

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

  it('🔴 법무 문서는 셸 제목 + 접미 === 런타임 documentTitle 이다', () => {
    // `LegalDocument` 는 `useDocumentMeta` 를 안 거치고 `document.title = documentTitle` 로 직접 쓴다.
    // 그래서 접미가 그 상수 안에 들어 있고, 셸은 앞자리만 받아 붙인다 — 둘이 갈리면 JS 실행 전후로
    // 탭 제목이 바뀐다(구글 OAuth 심사가 읽는 URL 이라 특히 어긋나면 안 된다).
    for (const [path, model] of [
      ['/privacy', PRIVACY_DOCUMENT],
      ['/terms', TERMS_DOCUMENT]
    ] as const) {
      const shell = ROUTE_SHELLS.find((route) => route.path === path);
      expect(shell, path).toBeDefined();
      expect(`${shell!.title} - Hungry Hippo`, path).toBe(model.documentTitle);
    }
  });
});

describe('빌드 배선', () => {
  it('플러그인이 plugins 배열에 실제로 등록돼 있다', () => {
    expect(viteConfig).toMatch(/plugins:\s*\[[^\]]*routeShellsPlugin\(siteUrl\)/);
  });

  /*
   * 🔴 2026-08-14: 두 곳이 각자 `const SITE_SUFFIX = 'Hungry Hippo'` 를 들고 있던 것을
   *    `shared/constants/site` 하나로 모았다(사본은 일곱 곳이었다). 그래서 이 가드는 **문자열이
   *    서로 같은지**를 볼 필요가 없어졌다 — 같은 함수를 부르는지만 보면 구조적으로 보장된다.
   *    (종전 테스트는 사라진 `SITE_SUFFIX` 리터럴을 찾고 있어서 리팩터와 함께 깨져 있었다.)
   */
  it('런타임 훅과 빌드 배선이 같은 정본 함수로 접미를 붙인다', () => {
    const hook = readRepoFile('../../pages/Ticker/hooks/useDocumentMeta.ts');

    expect(hook).toContain('withSiteTitleSuffix(title)');
    expect(viteConfig).toContain('withSiteTitleSuffix(route.title)');
    /* 정본을 직접 import 하는지까지 본다 — 같은 이름의 지역 함수를 새로 만들면 다시 갈린다. */
    expect(hook).toMatch(/import \{ withSiteTitleSuffix \} from '@\/shared\/constants\/site'/);
    expect(viteConfig).toMatch(/import \{ withSiteTitleSuffix \} from '\.\/shared\/constants\/site'/);
  });

  it('정본 함수가 만드는 형태는 `제목 - 사이트명` 이다', () => {
    expect(withSiteTitleSuffix('배당 캘린더')).toBe('배당 캘린더 - Hungry Hippo');
    /* 🔴 콘텐츠가 접미를 직접 적으면 두 번 붙는다 — 그 실수를 이 함수가 막아 주지는 않는다.
       적발은 각 화면 테스트의 몫이다(예: test/router/sitemapRoute.test.tsx). */
    expect(withSiteTitleSuffix('사이트맵 - Hungry Hippo')).toBe('사이트맵 - Hungry Hippo - Hungry Hippo');
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
