import { existsSync, readFileSync } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { fileURLToPath } from 'node:url';
import { build as esbuild } from 'esbuild';
import { defineConfig, loadEnv } from 'vite';
import type { Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import type { SimulationOutput } from './shared/types';
import { API_BUNDLES } from './tools/apiBundle/manifest.mjs';

/**
 * 배포 도메인의 단일 진실 공급원(single source of truth).
 *
 * 이 값 하나가 아래 전부에 주입된다:
 *   - index.html: canonical / og:url / og:image / hreflang / JSON-LD (`%VITE_SITE_URL%` 토큰)
 *   - sitemap.xml: <loc>
 *   - robots.txt: Sitemap: 지시어
 *   - 런타임 canonical 보정 (shared/lib/analytics.ts)
 *
 * 🔴 **2026-08-08 실제 도메인으로 확정했다.** 그전 값은 `snowball-income.example` 이었는데, `.example`
 *   은 RFC 2606이 예약한 "절대 해석되지 않는" TLD 다 — 즉 canonical·og:url·sitemap·robots 가 전부
 *   **존재하지 않는 주소**를 가리키고 있었다. 서치콘솔도 SNS 미리보기도 그 상태로는 무효였다.
 *
 * ⚠ 이 값은 **`hungry-hippo.xyz` 하나**다. `snowball-income.vercel.app`(Vercel 기본 도메인)으로도
 *   앱이 뜨지만 그쪽은 정식 주소가 아니다 — vercel.json 의 리다이렉트가 그 호스트로 들어온 요청을
 *   정식 도메인으로 넘긴다. 그래야 사용자가 주소창을 복사해 만든 공유 링크도 정식 도메인이 된다
 *   (시뮬레이터 공유 링크는 **현재 href** 로 만들어진다 — `pages/Main/hooks/persistence/shareUrl.ts`).
 *
 * 바꾸는 법 (둘 중 하나):
 *   1) 아래 DEFAULT_SITE_URL 한 줄 수정 (가장 간단)
 *   2) 빌드 환경변수 VITE_SITE_URL 주입 (CI/호스팅에서 덮어쓰기; .env는 .gitignore 대상이라 CI엔 안 간다)
 */
const DEFAULT_SITE_URL = 'https://hungry-hippo.xyz';

const stripTrailingSlash = (url: string) => url.replace(/\/+$/, '');

/**
 * 사이트맵에 넣을 **정적 라우트**. router/routes.tsx의 실제 공개 라우트와 일치해야 한다.
 * 글 상세(`/community/:kind/:id`)는 DB에서 오므로 여기가 아니라 `/api/sitemap`(동적)이 담당한다.
 * 글쓰기/수정/프로필은 로그인 전용 화면이라 색인 대상이 아니다.
 *
 * 티커 SEO 랜딩(`/ticker/:name`, `/ticker/all` 허브)은 **여기 하드코딩하지 않는다** — 아래
 * `loadTickerRoutes()`가 `shared/constants/tickers`의 `TICKER_CONTENT_LIST`에서 파생해
 * `buildPagesSitemap`에 합류시킨다. 티커 하나 추가(registry.ts 한 줄)만으로 이 사이트맵도 자동
 * 갱신되며, 이 파일을 다시 손댈 필요가 없다.
 */
const ROUTES = [
  /*
   * `/` = 랜딩(2026-08-01 이전 완료). 1.0 을 **그대로 유지**한다 — 주소가 바뀐 것이 아니라 그 주소가
   * 그리는 화면이 바뀐 것이라, 우선순위까지 함께 흔들면 색인이 두 번 출렁인다.
   * ⚠ `public/sitemap.xml` 은 존재하지 않는다. 이 배열이 정적 라우트 사이트맵의 **유일한 정본**이다.
   */
  { path: '/', priority: '1.0', changefreq: 'weekly' },
  /* 시뮬레이터. 랜딩보다 한 단계 낮은 0.9 로 고정(둘 다 색인 대상이고 내용이 다르다). */
  { path: '/simulator', priority: '0.9', changefreq: 'weekly' },
  { path: '/community/portfolio', priority: '0.8', changefreq: 'daily' },
  { path: '/community/board', priority: '0.8', changefreq: 'daily' },
  /*
   * 법무 고지문. **일부러 사이트맵에 넣는다** — 검색 유입을 노려서가 아니라 두 가지 이유다:
   *   1) 구글 OAuth 동의 화면 심사가 개인정보처리방침 URL 에 접근할 수 있어야 한다. 색인 가능·발견
   *      가능한 상태(`noindex` 없음 + 사이트맵 등재)가 그 검토를 막지 않는 가장 확실한 조합이다.
   *   2) 두 문서는 푸터 링크로만 도달할 수 있어 크롤 깊이가 깊다. 사이트맵이 그 경로를 짧게 만든다.
   * priority 를 최하위(0.2)로, changefreq 를 yearly 로 두는 이유: 개정이 드물고, 검색 결과에서
   * 본문 페이지와 경쟁하면 안 된다.
   */
  { path: '/privacy', priority: '0.2', changefreq: 'yearly' },
  { path: '/terms', priority: '0.2', changefreq: 'yearly' },
  /*
   * 배당 연속 증배 목록(허브 + 킹·귀족·챔피언). **크롤러가 읽는 본문은 서버가 낸다**
   * (`server/handlers/DividendListHtml` — 앱의 표는 React 가 그려서 JS 없는 크롤러에겐 빈 셸이다).
   * 여기에 하드코딩한 이유: 티커처럼 개수가 늘어나는 목록이 아니라 **셋으로 고정**이고, 목록 데이터
   * 폴더를 config 에서 esbuild 로 불러오는 비용을 낼 이유가 없다(`loadTickerRoutes` 참고).
   * 목록이 늘면 그때 파생으로 바꾼다.
   * 허브가 0.6, 목록이 0.7 인 것은 의도다 — 검색 유입은 "배당킹 목록"처럼 목록 이름으로 들어온다.
   */
  { path: '/dividend/lists', priority: '0.6', changefreq: 'monthly' },
  { path: '/dividend/kings', priority: '0.7', changefreq: 'monthly' },
  { path: '/dividend/aristocrats', priority: '0.7', changefreq: 'monthly' },
  { path: '/dividend/champions', priority: '0.7', changefreq: 'monthly' },
  /* 배당 히든스타(2026-08-08 신설). 달마다 한 종목이 더해지므로 다른 셋과 같은 monthly 다. */
  { path: '/dividend/hidden-stars', priority: '0.7', changefreq: 'monthly' },
  /*
   * 자료형 화면 셋(2026-08-04 신설).
   *
   * ⚠ **크롤러가 읽는 본문은 아직 없다.** 배당 목록과 달리 서버 렌더 핸들러를 두지 않아서,
   *   JS 를 실행하지 않는 크롤러에게는 빈 셸이다. 그래도 사이트맵에는 넣는다 — 구글은 JS 를
   *   실행하고, 등재해 두면 발견까지의 시간이 줄어든다. 검색 유입이 실제로 붙으면 그때
   *   `server/handlers/DividendListHtml` 과 같은 방식으로 서버 본문을 붙인다(핸드오프에 남김).
   * changefreq 가 서로 다른 것은 실제 갱신 주기가 달라서다: 증시 캘린더는 주 1회 수집,
   * 국회 거래는 주 1회, 국민연금은 분기 1회(13F 는 분기 데이터다).
   */
  { path: '/market/us-calendar', priority: '0.7', changefreq: 'weekly' },
  { path: '/portfolio/congress', priority: '0.6', changefreq: 'weekly' },
  /* 🔴 `yearly` 인 것은 게으름이 아니라 사실이다 — 국회공보 정기재산변동신고는 **연 1회**
     (3월 말) 공개된다. 주 1회라고 적으면 크롤러에게 거짓말을 하는 것이다. */
  { path: '/portfolio/korea-assembly', priority: '0.6', changefreq: 'yearly' },
  { path: '/portfolio/nps', priority: '0.6', changefreq: 'monthly' },
  /*
   * 🔴 **빠져 있던 넷**(2026-08-08 점검에서 발견). 넷 다 색인 대상 공개 라우트인데 사이트맵에만
   * 없었다 — 크롤러가 링크를 타고 발견할 수는 있지만 그만큼 늦고, 갱신 주기를 알릴 방법도 없다.
   *
   * ⚠ 이 배열은 `router/routes.tsx` 의 공개 라우트와 손으로 맞추는 목록이라 이런 누락이 생긴다.
   *   아래 `test/seo/` 의 가드가 그 대조를 자동화한다 — 새 공개 라우트를 열면 그 테스트가 먼저 빨개진다.
   */
  /* 대가들의 포트폴리오 — 13F 공시라 분기 갱신이지만 인물 구성이 그 사이에도 바뀐다. */
  { path: '/portfolio/investors', priority: '0.6', changefreq: 'monthly' },
  /* 배당 지급 캘린더 — 매달 날짜가 바뀌는 유틸리티. 검색 유입이 붙기 좋은 축이라 0.7. */
  { path: '/dividend/calendar', priority: '0.7', changefreq: 'weekly' },
  /* 내 배당 포트폴리오 — 로그인 없이도 쓰는 도구다(저장만 로그인). */
  { path: '/dividend/portfolio', priority: '0.7', changefreq: 'weekly' },
  /* 종목 비교 — `/ticker/all` 허브와 한 축이라 같은 0.6. */
  { path: '/ticker/compare', priority: '0.6', changefreq: 'weekly' },
] as const;

type SitemapRoute = { path: string; priority: string; changefreq: string };

/** `/ticker/all` 선택 허브 — `server/handlers/TickerHtml/TickerHtml.ts`의 `HUB_PATH`와 리터럴을 맞춘다. */
const TICKER_HUB_PATH = '/ticker/all';

/**
 * `shared/constants/tickers`를 config 파일에서 그냥 import할 수는 없다(위 `loadEngine`과 같은 이유 —
 * Vite config 로더가 `@/...` 스펙파이어를 external로 빼버린다). esbuild로 한 번 번들해 메모리에서
 * 평가한다. 여기서 필요한 건 `slug`뿐이라 최소 타입만 선언한다.
 */
type TickerRouteEntry = { slug: string };

let tickerRoutesPromise: Promise<TickerRouteEntry[]> | null = null;

const loadTickerRoutes = (): Promise<TickerRouteEntry[]> => {
  tickerRoutesPromise ??= (async () => {
    const rootDir = fileURLToPath(new URL('.', import.meta.url));
    const { outputFiles } = await esbuild({
      stdin: {
        contents: `export { TICKER_CONTENT_LIST } from './shared/constants/tickers';`,
        resolveDir: rootDir,
        loader: 'ts'
      },
      bundle: true,
      write: false,
      format: 'esm',
      platform: 'node',
      target: 'node20',
      tsconfig: 'tsconfig.json',
      logLevel: 'silent'
    });
    const source = Buffer.from(outputFiles[0].text).toString('base64');
    const mod = (await import(`data:text/javascript;base64,${source}`)) as { TICKER_CONTENT_LIST: TickerRouteEntry[] };
    return mod.TICKER_CONTENT_LIST;
  })();
  return tickerRoutesPromise;
};

/**
 * 검색어 랜딩(`/guide/:slug`)도 **레지스트리에서 파생**한다 — 티커와 같은 방법(esbuild 로 한 번
 * 번들해 메모리에서 평가)이다.
 *
 * 🔴 여기 경로를 손으로 나열하지 않는 이유: 가이드는 "레지스트리에 한 줄"이 추가 절차의 전부여야
 * 하는데, 사이트맵만 손으로 적으면 **글은 있는데 색인되지 않는 페이지**가 조용히 생긴다. 그 실패는
 * 아무 테스트도 잡지 못하고 몇 주 뒤 "왜 유입이 없지"로만 나타난다.
 */
type GuideRouteEntry = { slug: string };

let guideRoutesPromise: Promise<GuideRouteEntry[]> | null = null;

const loadGuideRoutes = (): Promise<GuideRouteEntry[]> => {
  guideRoutesPromise ??= (async () => {
    const rootDir = fileURLToPath(new URL('.', import.meta.url));
    const { outputFiles } = await esbuild({
      stdin: {
        contents: `export { GUIDES } from './shared/constants/guides';`,
        resolveDir: rootDir,
        loader: 'ts'
      },
      bundle: true,
      write: false,
      format: 'esm',
      platform: 'node',
      target: 'node20',
      tsconfig: 'tsconfig.json',
      logLevel: 'silent'
    });
    const source = Buffer.from(outputFiles[0].text).toString('base64');
    const mod = (await import(`data:text/javascript;base64,${source}`)) as { GUIDES: GuideRouteEntry[] };
    return mod.GUIDES;
  })();
  return guideRoutesPromise;
};

/**
 * 🔴 우선순위 0.8 은 이 사이트에서 **가장 높은 축**이다 — 이 페이지들의 존재 이유가 검색 유입
 * 하나이고(docs/site-assessment-2026-08-06.md P0-③), "검색어 = 페이지"가 1:1 이라 색인 가치가
 * 가장 직접적이다.
 */
const buildGuideSitemapRoutes = (guides: readonly GuideRouteEntry[]): SitemapRoute[] =>
  guides.map((guide) => ({ path: `/guide/${guide.slug}`, priority: '0.8', changefreq: 'monthly' }));

/** 허브(주 1회 갱신 성격) + 개별 티커(콘텐츠 변경이 드묾, 월 1회 성격)를 사이트맵 라우트로 변환한다. */
const buildTickerSitemapRoutes = (tickers: readonly TickerRouteEntry[]): SitemapRoute[] => [
  { path: TICKER_HUB_PATH, priority: '0.6', changefreq: 'weekly' },
  ...tickers.map((ticker) => ({ path: `/ticker/${ticker.slug}`, priority: '0.6', changefreq: 'monthly' }))
];

/**
 * ## 사이트맵을 3파일로 쪼갠 이유 (파일시스템 우선순위 회피)
 *
 * Vercel의 `rewrites`는 **파일시스템 조회 다음**에 평가된다(middleware.ts:24-26에 같은 함정 기록).
 * 이 플러그인이 `dist/sitemap.xml`을 실제 파일로 emit하므로, `/sitemap.xml → /api/sitemap` rewrite는
 * **영원히 발동하지 않는다** — 정적 파일이 먼저 히트한다. 그렇다고 emit을 없애면 이미 서치콘솔에
 * 제출된 URL이 깨진다.
 *
 * 그래서 충돌하지 않는 구조로 나눈다:
 *   - `/sitemap.xml`       (여기서 emit) = **sitemapindex**. 아래 둘을 가리킨다. robots.txt가 참조하는 정본.
 *   - `/sitemap-pages.xml` (여기서 emit) = 위 ROUTES의 정적 라우트.
 *   - `/sitemap-posts.xml` (파일 없음)   = vercel.json rewrite → `/api/sitemap`(공개 글, 동적·ISR).
 *     dist에 그 이름의 파일이 **없어야** rewrite가 발동한다 — 여기서 절대 emit하지 말 것.
 *
 * 글이 50,000 URL을 넘으면 `/api/sitemap`을 페이지 분할하고 이 index에 자식을 늘린다(구조를 index로
 * 잡아둔 이유). 지금 규모에선 자식 2개로 충분하다.
 */
const buildSitemapIndex = (siteUrl: string, lastmod: string) =>
  `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${siteUrl}/sitemap-pages.xml</loc>
    <lastmod>${lastmod}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${siteUrl}/sitemap-posts.xml</loc>
  </sitemap>
</sitemapindex>
`;

const buildPagesSitemap = (siteUrl: string, lastmod: string, extraRoutes: readonly SitemapRoute[] = []) =>
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${[...ROUTES, ...extraRoutes]
  .map(
    ({ path, priority, changefreq }) => `  <url>
    <loc>${siteUrl}${path}</loc>
    <xhtml:link rel="alternate" hreflang="ko" href="${siteUrl}${path}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${siteUrl}${path}" />
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>
`;

// Yeti(네이버)/Daum은 JS를 실행하지 않는다. 별도 블록을 두는 건 차단이 아니라 명시적 허용 신호다.
// (가장 구체적인 User-agent 블록만 적용되므로, 두 블록의 내용이 같아야 의도대로 동작한다.)
//
// ⚠ `Sitemap:` 지시자를 **세 줄 다** 둔다. sitemapindex 하나만 두어도 크롤러는 자식을 따라가지만,
//   sitemaps.org의 크로스-경로 규칙상 사이트맵은 자기 디렉터리 이하의 URL만 담을 수 있고 **robots.txt에
//   직접 등재된 사이트맵은 그 제약에서 면제**된다. `/sitemap-posts.xml`은 rewrite로 `/api/` 함수가
//   서빙하므로, 등재해 두면 경로 해석 차이로 조용히 거부당하는 경우를 원천 차단한다.
const buildRobots = (siteUrl: string) =>
  `User-agent: *
Allow: /

User-agent: Yeti
Allow: /

User-agent: Daumoa
Allow: /

Sitemap: ${siteUrl}/sitemap.xml
Sitemap: ${siteUrl}/sitemap-pages.xml
Sitemap: ${siteUrl}/sitemap-posts.xml
`;

/* -------------------------------------------------------------------------- */
/* 프리렌더 — 크롤러가 읽는 정적 셸의 "계산 예시"                                  */
/* -------------------------------------------------------------------------- */

/** index.html 안의 이 주석을 빌드 때 실제 계산 결과로 치환한다. 치환에 실패해도 HTML은 여전히 유효하다. */
const STATIC_EXAMPLE_MARKER = '<!--SNOWBALL_STATIC_EXAMPLE-->';

/**
 * 정적 셸에 넣을 **실제 계산 예시**.
 *
 * 숫자를 손으로 적으면 그건 지어낸 값이다. 그래서 앱과 **같은 엔진**(`runSimulation`)을 빌드 타임에 그대로 돌려
 * 나온 값을 굽는다. 크롤러(Yeti/Daumoa)와 JS 없는 첫 페인트가 보는 내용이 앱의 계산과 일치한다.
 *
 * 시작일을 고정한 이유: `defaultYieldFormValues.investmentStartDate` 는 "오늘"이라 빌드할 때마다 배당
 * 지급월이 밀려 숫자가 흔들린다. 예시는 결정적이어야 하므로 시작일을 못 박는다.
 */
const EXAMPLE_START_DATE = '2025-01-01';

/**
 * 계산 엔진을 **config 파일에서 그냥 import 할 수는 없다.**
 * Vite 의 config 로더는 bare 처럼 보이는 스펙파이어(`@/shared/...`)를 external 로 빼버리므로,
 * 엔진 내부의 `@/shared/constants/tax` 에서 `ERR_MODULE_NOT_FOUND` 가 난다.
 *
 * 그래서 esbuild 로 한 번 번들해서(=alias 를 루트 tsconfig 의 `paths` 로 해석) 메모리에서 평가한다.
 * 부수 효과가 하나 더 있다: **Vercel 함수 빌더와 완전히 같은 해석 경로**(esbuild + 루트 tsconfig paths)라서,
 * 이 빌드가 통과한다는 건 `/api/og.tsx` 의 `@/` import 도 배포에서 resolve 된다는 뜻이다.
 */
type ExampleModule = {
  runSimulation: (input: unknown) => SimulationOutput;
  DIVIDEND_UNIVERSE: Record<
    string,
    {
      ticker: string;
      initialPrice: number;
      dividendYield: number;
      dividendGrowth: number;
      expectedTotalReturn: number;
      frequency: string;
    }
  >;
  formatApproxKRW: (value: number) => string;
};

const loadEngine = async (): Promise<ExampleModule> => {
  const rootDir = fileURLToPath(new URL('.', import.meta.url));
  const { outputFiles } = await esbuild({
    stdin: {
      contents: `
        export { runSimulation } from './shared/lib/snowball';
        export { DIVIDEND_UNIVERSE } from './shared/constants/presets';
        export { formatApproxKRW } from './pages/Main/utils/formatters';
      `,
      resolveDir: rootDir,
      loader: 'ts'
    },
    bundle: true,
    write: false,
    format: 'esm',
    platform: 'node',
    target: 'node20',
    tsconfig: 'tsconfig.json',
    logLevel: 'silent'
  });

  const source = Buffer.from(outputFiles[0].text).toString('base64');
  return (await import(`data:text/javascript;base64,${source}`)) as ExampleModule;
};

/** 예시는 결정적이어야 하므로 한 번만 계산해서 캐시한다(dev 서버는 요청마다 transformIndexHtml 을 부른다). */
let staticExampleHtml: Promise<string> | null = null;

const buildStaticExampleHtml = async (): Promise<string> => {
  const { runSimulation, DIVIDEND_UNIVERSE, formatApproxKRW } = await loadEngine();
  const schd = DIVIDEND_UNIVERSE.SCHD;
  const { summary } = runSimulation({
    ticker: {
      ticker: schd.ticker,
      initialPrice: schd.initialPrice,
      dividendYield: schd.dividendYield,
      dividendGrowth: schd.dividendGrowth,
      expectedTotalReturn: schd.expectedTotalReturn,
      frequency: schd.frequency
    },
    settings: {
      initialInvestment: 0,
      monthlyContribution: 1_000_000,
      targetMonthlyDividend: 2_000_000,
      investmentStartDate: EXAMPLE_START_DATE,
      durationYears: 20,
      reinvestDividends: true,
      reinvestDividendPercent: 100,
      taxRate: 15.4,
      reinvestTiming: 'sameMonth',
      dpsGrowthMode: 'monthlySmooth'
    }
  });

  return `
        <h2>계산 예시 — SCHD에 월 100만원씩 20년</h2>
        <p>
          SCHD(배당수익률 ${schd.dividendYield}%, 배당 성장률 ${schd.dividendGrowth.toFixed(2)}%, 기대 총수익률
          ${schd.expectedTotalReturn}% 가정)에 매달 100만원을 20년간 적립하고, 세후 배당을 전액 재투자했을 때
          이 시뮬레이터가 계산하는 값입니다.
        </p>
        <ul>
          <li>총 납입 원금: <strong>${formatApproxKRW(summary.totalContribution)}원</strong></li>
          <li>20년 후 예상 자산: <strong>${formatApproxKRW(summary.finalAssetValue)}원</strong></li>
          <li>20년 후 예상 월 배당(세후): <strong>${formatApproxKRW(summary.finalMonthlyAverageDividend)}원</strong></li>
        </ul>
        <p class="disclaimer">
          배당소득세 15.4%, 투자 시작일 ${EXAMPLE_START_DATE} 기준입니다. 배당과 주가는 시장 상황에 따라 달라지므로
          실제 결과는 이 값과 다릅니다.
        </p>

        <h2>계산 방식에 대한 설명</h2>
        <h3>세금은 어떻게 반영되나요?</h3>
        <p>
          배당을 받을 때마다 배당소득세(기본 15.4%)를 뗀 금액을 재투자하거나 현금흐름으로 잡습니다. 전량 매도를
          가정한 양도소득세(기본공제 250만원을 인별 1회 적용)와 금융소득종합과세 기준 초과 시점도 따로 추정해
          보여줍니다.
        </p>
        <h3>배당 성장률과 기대 총수익률은 어떤 관계인가요?</h3>
        <p>
          이 시뮬레이터는 <strong>배당수익률 + 배당 성장률 = 기대 총수익률</strong>이라는 정합 모델을 씁니다. 주가는
          배당 성장률과 같은 속도로 오른다고 가정하므로, 배당수익률이 장기적으로 유지됩니다.
        </p>
        <h3>커버드콜 ETF처럼 배당 성장률이 음수여도 되나요?</h3>
        <p>
          됩니다. JEPI·QYLD 같은 옵션 인컴 ETF는 높은 분배율 대신 NAV가 깎일 수 있는데, 배당 성장률에 음수를 넣으면
          그 침식을 그대로 계산에 반영합니다.
        </p>`;
};

/* -------------------------------------------------------------------------- */
/* OG 이미지용 폰트 — dist/fonts/*.otf                                          */
/* -------------------------------------------------------------------------- */

/**
 * `/api/og` 가 런타임에 fetch 하는 본문 서체(Wanted Sans) otf 를 정적 자산으로 내보낸다.
 *
 * - Satori 는 시스템 폰트를 못 쓰고 **ttf/otf/woff 만** 읽는다(woff2 불가). 그래서 화면이 쓰는 동적 서브셋
 *   woff2 가 아니라, npm `wanted-sans` 가 함께 싣는 `fonts/otf/*.otf` 를 쓴다.
 * - 레포에 1.3MB짜리 바이너리를 커밋하지 않으려고 **빌드 때 node_modules 에서 복사**한다.
 *   (`public/fonts/` 의 서브셋 woff2 와는 다른 물건이다 — 그쪽은 화면용, 이쪽은 OG 렌더용.)
 * - 클라이언트 번들과는 무관하다(HTML/CSS 어디서도 참조하지 않는다). 서버 함수만 HTTP 로 가져간다.
 */
const OG_FONT_FILES = ['WantedSans-Regular.otf', 'WantedSans-Bold.otf'] as const;
const OG_FONT_SOURCE_DIR = 'node_modules/wanted-sans/fonts/otf';

const readOgFont = (file: string): Buffer => {
  try {
    return readFileSync(new URL(`./${OG_FONT_SOURCE_DIR}/${file}`, import.meta.url));
  } catch (error) {
    // 조용히 넘어가면 동적 OG 가 영구히 정적 이미지로 폴백되면서도 아무도 모른다. 빌드를 세운다.
    throw new Error(
      `[snowball] OG 폰트를 찾지 못했다: ${OG_FONT_SOURCE_DIR}/${file}. \`npm install\` 후 다시 시도하라. (${String(error)})`
    );
  }
};

const ogFontsPlugin = (): Plugin => ({
  name: 'snowball-og-fonts',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      const file = OG_FONT_FILES.find((name) => req.url?.split('?')[0] === `/fonts/${name}`);
      if (!file) return next();
      res.setHeader('Content-Type', 'font/otf');
      res.end(readOgFont(file));
    });
  },
  generateBundle() {
    for (const file of OG_FONT_FILES) {
      this.emitFile({ type: 'asset', fileName: `fonts/${file}`, source: readOgFont(file) });
    }
  }
});

/**
 * sitemap.xml / robots.txt를 도메인 단일 소스에서 생성한다.
 * public/에 정적 파일로 두면 도메인이 3곳(html·sitemap·robots)에 흩어져 반드시 drift가 난다.
 * 외부 의존성 0 — 인라인 플러그인.
 */
const seoAssetsPlugin = (siteUrl: string): Plugin => {
  const lastmod = new Date().toISOString().slice(0, 10);
  // ⚠ `/sitemap-posts.xml`은 여기에 **넣지 않는다** — dist에 파일이 생기면 vercel.json의
  //   `/sitemap-posts.xml → /api/sitemap` rewrite가 파일시스템 히트에 막혀 죽는다(위 buildSitemapIndex 주석).
  // `/sitemap-pages.xml`만 비동기다 — 티커·가이드 라우트를 esbuild 메모리 평가로 **파생**해야 하기
  // 때문(위 `buildStaticExampleHtml`/`loadEngine`과 같은 이유·같은 기법). 둘 다 레지스트리가 단일
  // 원천이라, 콘텐츠를 늘릴 때 사이트맵을 따로 고칠 일이 없다.
  const files: Record<string, () => string | Promise<string>> = {
    '/sitemap.xml': () => buildSitemapIndex(siteUrl, lastmod),
    '/sitemap-pages.xml': async () =>
      buildPagesSitemap(siteUrl, lastmod, [
        ...buildTickerSitemapRoutes(await loadTickerRoutes()),
        ...buildGuideSitemapRoutes(await loadGuideRoutes())
      ]),
    '/robots.txt': () => buildRobots(siteUrl)
  };

  return {
    name: 'snowball-seo-assets',
    // index.html의 %VITE_SITE_URL% 토큰을 치환한다.
    // Vite 내장 HTML env 치환은 .env 파일/process.env만 읽으므로 코드에 둔 기본값을 알지 못한다.
    // order: 'pre'로 내장 플러그인보다 먼저 돌려서 "미정의 토큰" 경고와 잔여 토큰을 모두 없앤다.
    transformIndexHtml: {
      order: 'pre',
      handler: async (html) => {
        staticExampleHtml ??= buildStaticExampleHtml();
        return html.replace(/%VITE_SITE_URL%/g, siteUrl).replace(STATIC_EXAMPLE_MARKER, await staticExampleHtml);
      }
    },
    // dev 서버에서도 동일하게 서빙해 빌드와 어긋나지 않게 한다.
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        // dev에는 vercel.json rewrite가 없으므로 `/sitemap-posts.xml`을 `/api/sitemap`으로 직접 돌려준다
        // (apiDevPlugin이 뒤이어 받는다 — 이 플러그인이 plugins 배열에서 먼저라 미들웨어도 먼저 돈다).
        // ⚠ 상세 메타(`/community/:kind/:id` → /api/post-html)는 **일부러 dev에 배선하지 않는다**:
        //   post-html은 `dist/index.html` 원본 셸을 fetch하는데, dev의 index.html은 Vite 변환(@vite/client
        //   주입) 전이라 그 셸로는 앱이 부팅하지 않는다. dev에서는 `/api/post-html?...`을 직접 열어 확인한다.
        if (req.url?.split('?')[0] === '/sitemap-posts.xml') {
          req.url = '/api/sitemap';
          return next();
        }
        const create = req.url ? files[req.url.split('?')[0]] : undefined;
        if (!create) return next();
        res.setHeader('Content-Type', req.url?.startsWith('/sitemap') ? 'application/xml' : 'text/plain');
        // create()가 비동기(`/sitemap-pages.xml`)일 수 있어 apiDevPlugin과 같은 async IIFE로 감싼다.
        void (async () => {
          res.end(await create());
        })();
      });
    },
    async generateBundle() {
      for (const [route, create] of Object.entries(files)) {
        this.emitFile({ type: 'asset', fileName: route.slice(1), source: await create() });
      }
    }
  };
};

/* -------------------------------------------------------------------------- */
/* dev 전용 — /api/* 서버리스 함수를 Vite 개발서버에서 직접 서빙                    */
/* -------------------------------------------------------------------------- */

/**
 * `yarn dev`(순수 Vite)에는 서버 런타임이 없어 `/api/*` 가 404 다(그래서 네이버 콜백이 실패했다).
 * 이 플러그인이 Vercel Node 함수의 **default export(= `toNodeHandler(handler)`, Node `(req,res)` 시그니처)** 를
 * 프로덕션과 똑같이 `(req, res)` 로 호출해, `vercel dev` 없이도 로그인(`/api/naver-auth`)·계정삭제
 * (`/api/account-delete`)가 dev 에서 돈다. (핸들러가 내부에서 req 본문 파싱·res 쓰기를 다 한다 —
 * 이 플러그인은 Node req/res 를 그대로 넘길 뿐, Web Request 로 바꾸지 않는다. 바꿔서 넘기면 res 가
 * undefined 가 돼 `res.end` 에서 터진다 — 과거 회귀 이력.)
 *
 * 두 가지 기존 관례를 재사용한다:
 *   1) esbuild 로 핸들러를 한 번 번들 → `@/` alias 를 tsconfig paths 로 해석(loadEngine 과 동일 이유).
 *   2) configureServer 미들웨어(ogFontsPlugin/seoAssetsPlugin 과 동일 형태).
 *
 * 서버 전용 시크릿(NAVER_CLIENT_SECRET / SUPABASE_SERVICE_ROLE_KEY)은 아래 factory 에서 **process.env 로만**
 * 주입한다(핸들러는 process.env 를 읽는다). `define` 에는 절대 넣지 않으므로 클라이언트 번들엔 나가지 않는다.
 * `apply: 'serve'` 라 프로덕션 빌드(=Vercel 실제 함수)에는 영향이 없다.
 */
type NodeApiHandler = (req: IncomingMessage, res: ServerResponse) => void | Promise<void>;

/**
 * `/api/<name>` → 그 핸들러의 **소스** 경로를 찾는다. 없으면 null(→ 미들웨어 pass-through).
 *
 * ⚠ dev 는 `api/*.js`(커밋된 번들 산출물)를 **읽지 않는다** — 소스를 직접 번들해야 저장하자마자 반영된다
 *   (산출물을 읽으면 `npm run api:bundle` 을 돌리기 전까지 옛 코드가 뜬다). 배포 경로명 ↔ 소스 위치의
 *   대응은 번들러와 **같은 매니페스트**를 공유해 한쪽만 바뀌는 drift 를 막는다.
 */
const resolveApiFile = (name: string): string | null => {
  const target = `api/${name}.js`;
  const entry = API_BUNDLES.find((bundle) => bundle.out === target)?.entry;
  if (!entry) return null;
  const url = new URL(`./${entry}`, import.meta.url);
  return existsSync(url) ? fileURLToPath(url) : null;
};

/** 핸들러당 1회 esbuild 번들 → data URL import(메모리 평가). dev 편의로 캐시한다. */
const apiHandlerCache = new Map<string, Promise<NodeApiHandler>>();
const loadApiHandler = (file: string): Promise<NodeApiHandler> => {
  let cached = apiHandlerCache.get(file);
  if (!cached) {
    cached = (async () => {
      const { outputFiles } = await esbuild({
        entryPoints: [file],
        bundle: true,
        write: false,
        format: 'esm',
        platform: 'node',
        target: 'node20',
        tsconfig: 'tsconfig.json',
        logLevel: 'silent'
      });
      const source = Buffer.from(outputFiles[0].text).toString('base64');
      const mod = (await import(`data:text/javascript;base64,${source}`)) as { default?: NodeApiHandler };
      if (typeof mod.default !== 'function') throw new Error(`${file}: default export 가 함수가 아니다`);
      return mod.default;
    })();
    apiHandlerCache.set(file, cached);
  }
  return cached;
};

const apiDevPlugin = (): Plugin => ({
  name: 'snowball-api-dev',
  apply: 'serve',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      const path = req.url?.split('?')[0] ?? '';
      const match = /^\/api\/([\w-]+)$/.exec(path);
      if (!match) return next();
      const file = resolveApiFile(match[1]);
      if (!file) return next();
      void (async () => {
        try {
          const handler = await loadApiHandler(file);
          // default export 는 프로덕션과 동일한 Node 핸들러 — req/res 를 그대로 넘긴다(내부에서 응답을 쓴다).
          await handler(req, res);
        } catch (error) {
          // 무음 실패 금지 — dev 콘솔 + 응답 본문에 사유를 드러낸다.
          server.config.logger.error(`[api-dev] /api/${match[1]} 실패: ${String(error)}`);
          if (!res.headersSent) {
            res.statusCode = 500;
            res.setHeader('content-type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({ error: 'dev_api_error', detail: String(error) }));
          }
        }
      })();
    });
  }
});

export default defineConfig(({ command, mode }) => {
  // loadEnv는 .env 파일 + process.env의 VITE_ 접두 변수를 함께 읽는다 → CI 주입도 그대로 동작.
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const siteUrl = stripTrailingSlash(env.VITE_SITE_URL || DEFAULT_SITE_URL);

  // dev 전용: .env 의 **서버 전용 변수**(NAVER_CLIENT_SECRET 등)를 process.env 로 넣어 /api 미들웨어가
  // 읽게 한다. 클라이언트 번들엔 절대 안 나간다(define 에 추가하지 않음). 빌드(command==='build')에선 skip.
  if (command === 'serve') {
    const allEnv = loadEnv(mode, process.cwd(), '');
    for (const [key, value] of Object.entries(allEnv)) {
      if (process.env[key] === undefined) process.env[key] = value;
    }
  }

  return {
    plugins: [react(), seoAssetsPlugin(siteUrl), ogFontsPlugin(), apiDevPlugin()],
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
