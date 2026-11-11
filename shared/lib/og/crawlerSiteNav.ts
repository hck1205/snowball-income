import {
  MARKET_FOMC_GUIDE_PATH,
  MARKET_HOLIDAY_GUIDE_YEARS,
  MARKET_WEEK_GUIDE_PATH,
  marketHolidayGuidePath
} from '../../constants/routes';
/**
 * 크롤러 HTML 공통 **사이트 내비게이션** — 순수 문자열 함수, 의존성 0(shellBody.ts 와 같은 규약).
 *
 * ## 왜 필요한가 (2026-11-05 실측)
 * JS 를 실행하지 않고 읽은 초기 HTML 의 내부 링크 수가 이랬다:
 * ```
 *   /market/us-calendar   0개   ← 검색 유입이 실제로 생기는 유일한 페이지
 *   /dividend/lists       4개
 *   /guide/*              5개
 *   /ticker/<t>           관련 티커 4 + 카테고리 1
 * ```
 * 헤더 내비(`PrimaryNav`)는 React 가 그리므로 초기 HTML 에는 없다. 그래서 크롤러 눈에는 페이지들이
 * 서로 거의 이어지지 않은 섬이었고, 발견을 사이트맵에만 기대고 있었다. 링크는 크롤러가 페이지를
 * 찾고 중요도를 나누는 통로다 — 이 블록이 모든 크롤러 HTML 에 같은 허브 링크를 깐다.
 *
 * ## 🔴 목록은 헤더 내비의 **사본**이다 — 정본은 `components/PrimaryNav/PrimaryNav.utils.ts`
 * 그 모듈을 직접 import 하지 않는 이유: 아이콘(lucide-react)과 env 플래그(supabase·sheets)를 함께
 * 끌고 와서 **서버 번들(api/*.js)** 에 실리면 안 된다. 대신 `test/seo/crawlerSiteNav.test.ts` 가
 * `buildNavTree()` 와 **경로·라벨·순서가 같은지** 잠근다 — 내비를 바꾸면 여기도 고쳐야 테스트가 통과한다.
 * ⚠ 가계부(`/ledger`)는 뺀다. 구글 시트 연동 배포에서만 있는 라우트라 크롤러에게는 죽은 링크일 수 있다.
 *
 * ## 화면에 미치는 영향
 * 없다. 이 블록은 `#root` **안**에 들어가고, 앱은 `createRoot(#root).render` 로 그 내용을 통째로
 * 갈아 끼운다(main.tsx). JS 가 도는 방문자는 헤더 내비를 보고, 이 블록은 JS 없는 방문자·크롤러만 본다.
 */

import { escapeHtmlAttribute, escapeHtmlText } from './metaHtml';

export type CrawlerNavItem = { readonly to: string; readonly label: string };
export type CrawlerNavGroup = { readonly label: string; readonly items: readonly CrawlerNavItem[] };

/** 올해(목록 안이면) 휴장일 지면 — 헤더 내비와 같은 규칙. */
const HOLIDAY_GUIDE_YEAR =
  (MARKET_HOLIDAY_GUIDE_YEARS as readonly number[]).find((year) => year === new Date().getFullYear()) ?? MARKET_HOLIDAY_GUIDE_YEARS[0];

export const CRAWLER_SITE_NAV: readonly CrawlerNavGroup[] = [
  {
    label: '내 자산계획',
    items: [
      { to: '/simulator', label: '시뮬레이터' },
      { to: '/dividend/how-much', label: '월 배당 필요 금액' },
      { to: '/dividend/portfolio', label: '나의 배당 포트폴리오' },
      { to: '/ticker/overlap', label: 'ETF 조합 짜기' }
    ]
  },
  {
    label: '외부 포트폴리오',
    items: [
      { to: '/portfolio/investors', label: '대가들의 포트폴리오' },
      { to: '/portfolio/nps', label: '국민연금 (미국 주식)' },
      { to: '/portfolio/congress', label: '미국 의원 주식 거래' },
      { to: '/portfolio/korea-assembly', label: '한국 의원 주식 보유' }
    ]
  },
  {
    label: '배당 종목',
    items: [
      { to: '/dividend/lists', label: '목록 비교' },
      { to: '/dividend/kings', label: '배당킹' },
      { to: '/dividend/aristocrats', label: '배당귀족' },
      { to: '/dividend/champions', label: '배당챔피언' },
      { to: '/dividend/hidden-stars', label: '배당 히든스타' }
    ]
  },
  {
    label: '시장 읽기',
    items: [
      { to: '/market/pulse', label: '시장 온도' },
      { to: '/market/stats', label: '히포 통계' }
    ]
  },
  {
    label: '종목 탐색',
    items: [
      { to: '/ticker/all', label: 'ETF 소개' },
      { to: '/ticker/compare', label: '종목 비교' }
    ]
  },
  {
    label: '캘린더',
    items: [
      { to: '/dividend/calendar', label: '배당 캘린더' },
      { to: '/market/us-calendar', label: '미국 증시 캘린더' },
      // 미국 증시 안내 지면(2026-11-11) — 헤더 내비(CALENDAR_GROUP_ITEMS)와 같은 순서·이름·경로.
      { to: MARKET_WEEK_GUIDE_PATH, label: '이번 주 미국 증시 일정' },
      { to: MARKET_FOMC_GUIDE_PATH, label: 'FOMC 회의 일정' },
      { to: marketHolidayGuidePath(HOLIDAY_GUIDE_YEAR), label: '미국 증시 휴장일' }
    ]
  },
  {
    label: '커뮤니티',
    items: [
      { to: '/community/portfolio', label: '배당계산 갤러리' },
      { to: '/community/board', label: '게시판' },
      { to: '/community/firenow', label: '파이어족들' }
    ]
  }
];

/** 랜드마크 이름. 페이지 본문 안의 다른 `<nav>`(관련 티커·글 목록)와 스크린리더에서 구분된다. */
export const CRAWLER_SITE_NAV_LABEL = '사이트 전체 메뉴';

/**
 * 크롤러 HTML 에 붙일 내비 블록.
 * 라벨·경로는 위 정적 상수뿐이라 `<`·`&` 가 없지만, 목록이 바뀌어도 마크업이 깨지지 않게 이스케이프한다
 * (텍스트 자리는 `escapeHtmlText`, href 속성은 `escapeHtmlAttribute` — metaHtml.ts 규약).
 * ⚠ 묶음 이름에 `<h2>` 를 쓰지 않는다 — 페이지마다 끝에 같은 h2 일곱 개가 붙으면 본문의 제목 구조가
 *   흐려진다. 묶음 이름은 문단, 링크는 목록이다.
 */
export const buildCrawlerSiteNavHtml = (): string =>
  `<nav aria-label="${CRAWLER_SITE_NAV_LABEL}" class="crawler-site-nav">` +
  CRAWLER_SITE_NAV.map(
    (group) =>
      `<p>${escapeHtmlText(group.label)}</p><ul>` +
      group.items
        .map((item) => `<li><a href="${escapeHtmlAttribute(item.to)}">${escapeHtmlText(item.label)}</a></li>`)
        .join('') +
      '</ul>'
  ).join('') +
  '</nav>';
