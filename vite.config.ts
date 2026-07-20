import { existsSync, readFileSync } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { fileURLToPath } from 'node:url';
import { build as esbuild } from 'esbuild';
import { defineConfig, loadEnv } from 'vite';
import type { Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import type { SimulationOutput } from './shared/types';

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

/**
 * 사이트맵에 넣을 **정적 라우트**. router/routes.tsx의 실제 공개 라우트와 일치해야 한다.
 * 글 상세(`/community/:kind/:id`)는 DB에서 오므로 여기가 아니라 `/api/sitemap`(동적)이 담당한다.
 * 글쓰기/수정/프로필은 로그인 전용 화면이라 색인 대상이 아니다.
 */
const ROUTES = [
  { path: '/', priority: '1.0', changefreq: 'weekly' },
  { path: '/community/portfolio', priority: '0.8', changefreq: 'daily' },
  { path: '/community/board', priority: '0.8', changefreq: 'daily' }
] as const;

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

const buildPagesSitemap = (siteUrl: string, lastmod: string) =>
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${ROUTES.map(
  ({ path, priority, changefreq }) => `  <url>
    <loc>${siteUrl}${path}</loc>
    <xhtml:link rel="alternate" hreflang="ko" href="${siteUrl}${path}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${siteUrl}${path}" />
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`
).join('\n')}
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

        <h2>자주 묻는 질문</h2>
        <h3>배당 재투자(스노우볼) 효과란 무엇인가요?</h3>
        <p>
          받은 배당으로 같은 주식을 다시 사면 보유 주식 수가 늘고, 늘어난 주식이 다시 배당을 만듭니다. 이 과정이
          반복되며 배당과 자산이 함께 불어나는 것을 눈덩이(스노우볼)에 빗대어 부릅니다. 이 앱은 매달 그 과정을
          하나씩 계산해서 보여줍니다.
        </p>
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
 * `/api/og` 가 런타임에 fetch 하는 Pretendard 를 정적 자산으로 내보낸다.
 *
 * - Satori 는 시스템 폰트를 못 쓰고 **ttf/otf/woff 만** 읽는다(woff2 불가). 그래서 npm `pretendard` 가 함께
 *   싣는 `dist/public/static/*.otf` 를 쓴다.
 * - 레포에 1.5MB짜리 바이너리를 커밋하지 않으려고 **빌드 때 node_modules 에서 복사**한다.
 * - 클라이언트 번들과는 무관하다(HTML/CSS 어디서도 참조하지 않는다). 서버 함수만 HTTP 로 가져간다.
 */
const OG_FONT_FILES = ['Pretendard-Regular.otf', 'Pretendard-Bold.otf'] as const;
const PRETENDARD_STATIC_DIR = 'node_modules/pretendard/dist/public/static';

const readOgFont = (file: string): Buffer => {
  try {
    return readFileSync(new URL(`./${PRETENDARD_STATIC_DIR}/${file}`, import.meta.url));
  } catch (error) {
    // 조용히 넘어가면 동적 OG 가 영구히 정적 이미지로 폴백되면서도 아무도 모른다. 빌드를 세운다.
    throw new Error(
      `[snowball] OG 폰트를 찾지 못했다: ${PRETENDARD_STATIC_DIR}/${file}. \`npm install\` 후 다시 시도하라. (${String(error)})`
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
  const files: Record<string, () => string> = {
    '/sitemap.xml': () => buildSitemapIndex(siteUrl, lastmod),
    '/sitemap-pages.xml': () => buildPagesSitemap(siteUrl, lastmod),
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

/* -------------------------------------------------------------------------- */
/* dev 전용 — /api/* 서버리스 함수를 Vite 개발서버에서 직접 서빙                    */
/* -------------------------------------------------------------------------- */

/**
 * `yarn dev`(순수 Vite)에는 서버 런타임이 없어 `/api/*` 가 404 다(그래서 네이버 콜백이 실패했다).
 * 이 플러그인이 Vercel Node 함수와 **같은 시그니처**(`handler(Request): Promise<Response>`)를 그대로
 * 호출해, `vercel dev` 없이도 로그인(`/api/naver-auth`)·계정삭제(`/api/account-delete`)가 dev 에서 돈다.
 *
 * 두 가지 기존 관례를 재사용한다:
 *   1) esbuild 로 핸들러를 한 번 번들 → `@/` alias 를 tsconfig paths 로 해석(loadEngine 과 동일 이유).
 *   2) configureServer 미들웨어(ogFontsPlugin/seoAssetsPlugin 과 동일 형태).
 *
 * 서버 전용 시크릿(NAVER_CLIENT_SECRET / SUPABASE_SERVICE_ROLE_KEY)은 아래 factory 에서 **process.env 로만**
 * 주입한다(핸들러는 process.env 를 읽는다). `define` 에는 절대 넣지 않으므로 클라이언트 번들엔 나가지 않는다.
 * `apply: 'serve'` 라 프로덕션 빌드(=Vercel 실제 함수)에는 영향이 없다.
 */
type WebHandler = (request: Request) => Promise<Response> | Response;

/** api/<name>.ts | .tsx 경로를 찾는다. 없으면 null(→ 미들웨어 pass-through). */
const resolveApiFile = (name: string): string | null => {
  for (const ext of ['ts', 'tsx'] as const) {
    const url = new URL(`./api/${name}.${ext}`, import.meta.url);
    if (existsSync(url)) return fileURLToPath(url);
  }
  return null;
};

/** 핸들러당 1회 esbuild 번들 → data URL import(메모리 평가). dev 편의로 캐시한다. */
const apiHandlerCache = new Map<string, Promise<WebHandler>>();
const loadApiHandler = (file: string): Promise<WebHandler> => {
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
      const mod = (await import(`data:text/javascript;base64,${source}`)) as { default?: WebHandler };
      if (typeof mod.default !== 'function') throw new Error(`${file}: default export 가 함수가 아니다`);
      return mod.default;
    })();
    apiHandlerCache.set(file, cached);
  }
  return cached;
};

/** Node IncomingMessage → Web Request(Vercel Node 함수가 받는 형태). */
const toWebRequest = async (req: IncomingMessage): Promise<Request> => {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  const host = req.headers.host ?? 'localhost';
  const url = `http://${host}${req.url ?? '/'}`;
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (typeof value === 'string') headers.set(key, value);
    else if (Array.isArray(value)) headers.set(key, value.join(', '));
  }
  const method = req.method ?? 'GET';
  const hasBody = method !== 'GET' && method !== 'HEAD' && chunks.length > 0;
  return new Request(url, { method, headers, body: hasBody ? Buffer.concat(chunks) : undefined });
};

/** Web Response → Node ServerResponse. */
const sendWebResponse = async (res: ServerResponse, webRes: Response): Promise<void> => {
  res.statusCode = webRes.status;
  webRes.headers.forEach((value, key) => res.setHeader(key, value));
  res.end(Buffer.from(await webRes.arrayBuffer()));
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
          await sendWebResponse(res, await handler(await toWebRequest(req)));
        } catch (error) {
          // 무음 실패 금지 — dev 콘솔 + 응답 본문에 사유를 드러낸다.
          server.config.logger.error(`[api-dev] /api/${match[1]} 실패: ${String(error)}`);
          res.statusCode = 500;
          res.setHeader('content-type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ error: 'dev_api_error', detail: String(error) }));
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
