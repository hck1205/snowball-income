/**
 * 라우트별 **정적 셸**의 정본 — 빌드가 이 목록대로 `dist/<path>.html` 을 굽는다.
 *
 * ## 🔴 무엇을 고치는 목록인가
 * 이 앱은 SPA 라서 색인 대상 라우트가 전부 **같은 `index.html`(= 랜딩 셸)** 을 받는다. 앱은
 * `useDocumentMeta` 로 런타임에 제목·설명·canonical 을 고치지만 **JS 를 실행하지 않는 크롤러**는
 * 그 수정을 보지 못한다. 그쪽 눈에는 사이트맵에 올린 라우트 십수 개가 **제목도 canonical 도 본문도
 * 랜딩과 완전히 같은 중복 페이지**다 — robots.txt 로 네이버(Yeti)·다음(Daumoa)을 명시 허용해 놓고
 * 정작 그들에게는 한 페이지만 보여 주고 있었다(2026-08-14 실측: 14개 라우트).
 *
 * ## 🔴 왜 서버리스 함수가 아니라 정적 파일인가
 * Vercel Hobby 함수 상한이 **12개인데 이미 12개**다(`tools/apiBundle/manifest.mjs`). 정적 파일은
 * 그 칸을 쓰지 않고, 엣지에서 셸을 fetch·치환하는 방식과 달리 일반 방문자에게 지연도 더하지 않는다.
 *
 * ## 문구는 화면이 쓰는 것을 그대로 쓴다
 * 각 항목은 그 화면이 `useDocumentMeta` 에 넘기는 **바로 그 상수**를 참조한다. 새로 쓰지 않는 이유는
 * 하나다 — 두 벌이 되면 정적 HTML 과 탭 제목이 조용히 갈라진다.
 * 🔴 새 라우트를 사이트맵에 올리면 여기에도 넣어라. `test/seo/routeShells.test.ts` 가 사이트맵과
 *    이 목록의 **양방향 일치**를 강제하므로, 빠뜨리면 테스트가 먼저 빨개진다.
 *
 * ⚠ 동적 라우트(`/ticker/:name`·`/guide/:slug`·`/community/:kind/:id`·배당 목록)는 여기 없다 —
 *   그쪽은 이미 `vercel.json` rewrite → 서버 렌더 핸들러가 라우트별 HTML 을 만든다.
 */
import { CONGRESS_COPY } from '../../pages/Congress/copy';
import { DIVIDEND_CALENDAR_COPY } from '../../pages/DividendCalendar/copy';
import { HIPPO_STATS_COPY } from '../../pages/HippoStats/copy';
import { INVESTORS_COPY } from '../../pages/Investors/copy';
import { KOREA_ASSEMBLY_COPY } from '../../pages/KoreaAssembly/copy';
import { MARKET_CALENDAR_COPY } from '../../pages/MarketCalendar/copy';
import { MARKET_PULSE_COPY } from '../../pages/MarketPulse/copy';
import { NPS_COPY } from '../../pages/Nps/copy';
import { PORTFOLIO_COPY } from '../../pages/Portfolio/copy';
import { TICKER_COMPARE_COPY } from '../../pages/Ticker/copy';
import { SIMULATOR_COPY } from '../../shared/constants/simulator';
import { SIMULATOR_PATH } from '../../shared/constants/routes';

export type RouteShell = {
  /** 라우트 경로. `dist/<path>.html` 과 `vercel.json` rewrite 의 키가 된다. */
  path: string;
  /** `<title>`·og:title 원본. 사이트명 접미는 빌드가 붙인다(런타임 훅과 같은 형태). */
  title: string;
  /** meta description·og:description. */
  description: string;
};

export const ROUTE_SHELLS: readonly RouteShell[] = [
  { path: SIMULATOR_PATH, title: SIMULATOR_COPY.meta.title, description: SIMULATOR_COPY.meta.description },
  {
    path: '/dividend/calendar',
    title: DIVIDEND_CALENDAR_COPY.meta.title,
    description: DIVIDEND_CALENDAR_COPY.meta.description
  },
  { path: '/dividend/portfolio', title: PORTFOLIO_COPY.meta.title, description: PORTFOLIO_COPY.meta.description },
  { path: '/ticker/compare', title: TICKER_COMPARE_COPY.meta.title, description: TICKER_COMPARE_COPY.meta.description },
  { path: '/market/pulse', title: MARKET_PULSE_COPY.documentTitle, description: MARKET_PULSE_COPY.metaDescription },
  { path: '/market/stats', title: HIPPO_STATS_COPY.documentTitle, description: HIPPO_STATS_COPY.metaDescription },
  {
    path: '/market/us-calendar',
    title: MARKET_CALENDAR_COPY.meta.title,
    description: MARKET_CALENDAR_COPY.meta.description
  },
  { path: '/portfolio/congress', title: CONGRESS_COPY.meta.title, description: CONGRESS_COPY.meta.description },
  {
    path: '/portfolio/korea-assembly',
    title: KOREA_ASSEMBLY_COPY.meta.title,
    description: KOREA_ASSEMBLY_COPY.meta.description
  },
  { path: '/portfolio/nps', title: NPS_COPY.meta.title, description: NPS_COPY.meta.description },
  { path: '/portfolio/investors', title: INVESTORS_COPY.meta.title, description: INVESTORS_COPY.meta.description }
];

/**
 * 셸을 굽지 **않는** 사이트맵 라우트와 그 이유. 목록에서 빠진 것이 "빠뜨린 것"인지 "정한 것"인지
 * 구분하려고 명시한다 — 이유 없는 누락은 테스트가 잡는다.
 */
export const ROUTE_SHELL_EXCLUSIONS: Readonly<Record<string, string>> = {
  '/': '랜딩 자신. index.html 이 곧 이 라우트의 셸이다',
  '/sitemap': '사이트 색인. 크롤러는 sitemap.xml 을 읽으므로 HTML 색인은 사람용이다',
  '/privacy': '법적 고지. 색인 가치가 낮고 화면 문구가 곧 전부다',
  '/terms': '법적 고지. 위와 같다',
  '/community/firenow': '커뮤니티 목록. 글 상세는 api/post-html 이 이미 라우트별 HTML 을 만든다'
};
