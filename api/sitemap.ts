/*
  ⚠ og.tsx / share-html.ts 와 동일 규약: 모듈 스코프에서 `import.meta.env` 를 읽는 코드를 끌고 오면
  Vercel Node 런타임에서 함수가 즉사한다(try/catch 로도 못 잡는 모듈 평가 단계). `@/shared/lib/og` 는
  순수 문자열 + process.env 조회만 담고 있어 안전하다. `/api` 는 Vercel 규약상 배럴 규칙 예외.
*/
import { fetchPublicPostRefs, resolveSiteUrl, SITEMAP_POST_LIMIT } from '@/shared/lib/og';
import type { PublicPostRef } from '@/shared/lib/og';
import { toNodeHandler } from '@/shared/lib/server';

/**
 * `/api/sitemap` — **공개 게시글**의 동적 사이트맵(`<urlset>`).
 *
 * ## 런타임: Node.js — **`toNodeHandler` 어댑터 필수**
 * `export const config` 가 없으므로 Vercel 은 Node 런타임으로 배포하고 `(req, res)` 로 호출한다. 아래 웹 표준
 * `handler` 를 그대로 default export 하면 `res.end()` 가 없어 **무응답 타임아웃**이 된다(2026-07-20 실제 장애).
 * Edge 로 옮기는 것은 선택지가 아니다(Edge 번들러가 `@/` alias 미해석). 근거: `@/shared/lib/server` nodeHandler.ts.
 *
 * ## 라우팅: 왜 `/sitemap.xml` 이 아니라 별도 경로인가
 * `vite.config.ts` 의 `seoAssetsPlugin` 이 빌드 때 `dist/sitemap.xml` 을 **실제 파일로 emit** 한다.
 * Vercel 의 `rewrites` 는 **파일시스템 조회 다음**에 평가되므로(middleware.ts:24-26 에 같은 이유가
 * 기록돼 있다) `/sitemap.xml → /api/sitemap` rewrite 는 **영원히 발동하지 않는다** — 정적 파일이 먼저
 * 히트한다. 그래서 구조를 셋으로 나눴다:
 *   - `/sitemap.xml`        (정적, 빌드 emit) = **sitemapindex**. 아래 둘을 가리킨다.
 *   - `/sitemap-pages.xml`  (정적, 빌드 emit) = 앱 라우트(`/`, `/community/portfolio`, `/community/board`).
 *   - `/sitemap-posts.xml`  → **이 함수로 rewrite**(vercel.json). `dist/` 에 그런 파일이 **없으므로**
 *                             파일시스템이 미스 → rewrite 가 정상 발동한다.
 * 즉 파일시스템 우선순위를 우회하는 대신 **충돌하지 않는 새 경로**를 쓴다. `seoAssetsPlugin` 이 이미
 * emit 하던 파일을 없애지 않으므로 기존 색인·robots 참조가 깨지지 않는다.
 *
 * ## 캐시(= ISR)
 * Vercel Edge Network 는 프레임워크와 무관하게 응답의 `s-maxage`/`stale-while-revalidate` 를 존중한다.
 * 그게 곧 ISR 이다(api/share-html.ts:34 선례).
 *   - `s-maxage=3600`(1h): 사이트맵은 크롤러만 읽고 크롤 주기가 시간~일 단위다. 새 글이 최대 1시간 늦게
 *     보이는 대신 DB 조회를 시간당 1회로 묶는다. 더 짧게 잡아도 크롤러가 더 자주 오지 않는다.
 *   - `stale-while-revalidate=86400`(24h): DB 가 흔들려도 하루 동안은 마지막 성공본을 계속 내보낸다
 *     — 사이트맵이 5xx/빈 응답이 되면 색인이 통째로 멈추므로, 신선도보다 가용성이 우선이다.
 *
 * ## 규모 상한
 * sitemaps.org 상한은 파일당 **50,000 URL / 50MB(비압축)** 다. `SITEMAP_POST_LIMIT`(45,000)로 방어선을
 * 두되, 실제로 넘어서면 이 함수를 `?page=N` 으로 쪼개고 정적 `sitemap.xml`(sitemapindex)에 자식을
 * 늘리는 방향으로 확장한다(구조를 index 로 잡아둔 이유).
 */

/** 공개 글 사이트맵 — 1시간 신선도 / 24시간 stale 허용. 근거는 위 주석. */
const CACHE_SITEMAP = 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400';

/**
 * XML **텍스트 노드** 이스케이프. `<loc>` 에 들어가는 URL 은 DB 에서 온 id 로 조립되고, 앞으로 제목 등
 * 자유 텍스트가 들어올 수 있다. 다섯 문자 전부 막는다(`&` 를 **먼저** 치환해야 이중 이스케이프가 없다).
 */
const escapeXml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

/** `/community/portfolio/:id` · `/community/board/:id` — router/routes.tsx 의 실제 상세 라우트. */
const postPath = (ref: PublicPostRef): string => `/community/${ref.kind}/${ref.id}`;

/**
 * `<lastmod>` 는 W3C Datetime 이어야 한다. Postgres timestamptz 문자열(`2026-07-20 11:22:33.123+00`)은
 * 그대로 쓰면 안 되므로 Date 로 파싱해 ISO 로 정규화한다. 파싱 불가면 **lastmod 를 생략**한다
 * (틀린 날짜보다 없는 편이 낫다 — 크롤러가 lastmod 를 신뢰하지 못하면 사이트맵 전체를 무시한다).
 */
const toLastmod = (value: string): string | null => {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
};

const buildUrlEntry = (siteUrl: string, ref: PublicPostRef): string => {
  const loc = escapeXml(`${siteUrl}${postPath(ref)}`);
  const lastmod = toLastmod(ref.updatedAt);
  return [
    '  <url>',
    `    <loc>${loc}</loc>`,
    ...(lastmod ? [`    <lastmod>${escapeXml(lastmod)}</lastmod>`] : []),
    '    <changefreq>weekly</changefreq>',
    '    <priority>0.7</priority>',
    '  </url>'
  ].join('\n');
};

const buildUrlset = (siteUrl: string, refs: readonly PublicPostRef[]): string =>
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${refs.map((ref) => buildUrlEntry(siteUrl, ref)).join('\n')}
</urlset>
`;

/** 웹 표준 핸들러 — `test/api/sitemap.test.ts` 가 `handler(new Request(...))` 로 직접 호출한다. */
export async function handler(request: Request): Promise<Response> {
  const siteUrl = resolveSiteUrl(request.url);

  // 조회 실패(env 미설정/네트워크/스키마 드리프트)는 null → **빈 urlset 을 200 으로** 반환한다.
  // 5xx 를 내면 서치콘솔이 사이트맵을 "가져올 수 없음"으로 표시하고 재시도 간격을 늘린다.
  const refs = await fetchPublicPostRefs(SITEMAP_POST_LIMIT);

  return new Response(buildUrlset(siteUrl, refs ?? []), {
    status: 200,
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      // 조회에 실패했을 땐 빈 사이트맵을 엣지에 1시간 박제하지 않는다(다음 요청이 곧바로 재시도).
      'cache-control': refs === null ? 'no-store' : CACHE_SITEMAP
    }
  });
}

/** ⚠ Vercel 이 실제로 호출하는 진입점. 어댑터를 벗기면 무응답으로 되돌아간다(위 "런타임" 주석). */
export default toNodeHandler(handler);
