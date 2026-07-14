import { defineConfig, loadEnv } from 'vite';
import type { Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * 배포 도메인의 단일 진실 공급원(single source of truth).
 *
 * 이 값 하나가 아래 전부에 주입된다:
 *   - index.html: canonical / og:url / og:image / hreflang / JSON-LD (`%VITE_SITE_URL%` 토큰)
 *   - sitemap.xml: <loc>
 *   - robots.txt: Sitemap: 지시어
 *   - 런타임 canonical 보정 (shared/lib/analytics.ts)
 *
 * ⚠ `.example`은 RFC 2606이 예약한 "절대 해석되지 않는" 테스트용 TLD다. 즉 현재 값은 placeholder이며,
 *   실제 도메인으로 바꾸기 전에는 서치콘솔 등록·SNS 미리보기·sitemap이 전부 무효다.
 *   레포에 이미 들어 있던 값(public/sitemap.xml)을 그대로 승계했을 뿐, 지어내지 않았다.
 *
 * 바꾸는 법 (둘 중 하나):
 *   1) 아래 DEFAULT_SITE_URL 한 줄 수정 (가장 간단)
 *   2) 빌드 환경변수 VITE_SITE_URL 주입 (CI/호스팅에서 덮어쓰기; .env는 .gitignore 대상이라 CI엔 안 간다)
 */
const DEFAULT_SITE_URL = 'https://snowball-income.example';

const stripTrailingSlash = (url: string) => url.replace(/\/+$/, '');

/** 사이트맵에 넣을 라우트. router/routes.tsx의 실제 라우트와 일치해야 한다(현재 `/` 단일). */
const ROUTES = ['/'] as const;

const buildSitemap = (siteUrl: string, lastmod: string) =>
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${ROUTES.map(
  (route) => `  <url>
    <loc>${siteUrl}${route}</loc>
    <xhtml:link rel="alternate" hreflang="ko" href="${siteUrl}${route}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${siteUrl}${route}" />
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>`
).join('\n')}
</urlset>
`;

// Yeti(네이버)/Daum은 JS를 실행하지 않는다. 별도 블록을 두는 건 차단이 아니라 명시적 허용 신호다.
// (가장 구체적인 User-agent 블록만 적용되므로, 두 블록의 내용이 같아야 의도대로 동작한다.)
const buildRobots = (siteUrl: string) =>
  `User-agent: *
Allow: /

User-agent: Yeti
Allow: /

User-agent: Daumoa
Allow: /

Sitemap: ${siteUrl}/sitemap.xml
`;

/**
 * sitemap.xml / robots.txt를 도메인 단일 소스에서 생성한다.
 * public/에 정적 파일로 두면 도메인이 3곳(html·sitemap·robots)에 흩어져 반드시 drift가 난다.
 * 외부 의존성 0 — 인라인 플러그인.
 */
const seoAssetsPlugin = (siteUrl: string): Plugin => {
  const lastmod = new Date().toISOString().slice(0, 10);
  const files: Record<string, () => string> = {
    '/sitemap.xml': () => buildSitemap(siteUrl, lastmod),
    '/robots.txt': () => buildRobots(siteUrl)
  };

  return {
    name: 'snowball-seo-assets',
    // index.html의 %VITE_SITE_URL% 토큰을 치환한다.
    // Vite 내장 HTML env 치환은 .env 파일/process.env만 읽으므로 코드에 둔 기본값을 알지 못한다.
    // order: 'pre'로 내장 플러그인보다 먼저 돌려서 "미정의 토큰" 경고와 잔여 토큰을 모두 없앤다.
    transformIndexHtml: {
      order: 'pre',
      handler: (html) => html.replace(/%VITE_SITE_URL%/g, siteUrl)
    },
    // dev 서버에서도 동일하게 서빙해 빌드와 어긋나지 않게 한다.
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const create = req.url ? files[req.url.split('?')[0]] : undefined;
        if (!create) return next();
        res.setHeader('Content-Type', req.url?.startsWith('/sitemap') ? 'application/xml' : 'text/plain');
        res.end(create());
      });
    },
    generateBundle() {
      for (const [route, create] of Object.entries(files)) {
        this.emitFile({ type: 'asset', fileName: route.slice(1), source: create() });
      }
    }
  };
};

export default defineConfig(({ mode }) => {
  // loadEnv는 .env 파일 + process.env의 VITE_ 접두 변수를 함께 읽는다 → CI 주입도 그대로 동작.
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const siteUrl = stripTrailingSlash(env.VITE_SITE_URL || DEFAULT_SITE_URL);

  return {
    plugins: [react(), seoAssetsPlugin(siteUrl)],
    // index.html의 %VITE_SITE_URL% 토큰과 앱 코드의 import.meta.env.VITE_SITE_URL이
    // 항상 같은 값(정규화된 siteUrl)을 보도록 되돌려 넣는다.
    define: {
      'import.meta.env.VITE_SITE_URL': JSON.stringify(siteUrl)
    },
    resolve: {
      alias: {
        '@': new URL('.', import.meta.url).pathname
      }
    },
    server: {
      open: true // dev 서버 실행 시 자동으로 브라우저 오픈
    }
  };
});
