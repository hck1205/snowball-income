/**
 * `/ticker/:slug` **SEO 소개 페이지가 실재하는** 종목의 경량 인덱스.
 *
 * 🔴 **의존성 0의 리프다 — 여기에 `import` 를 쓰지 마라.**
 * 존재 이유가 그것 하나다: 랜딩(`pages/Landing`)의 종목 검색은 "어느 종목에 소개 글이 있는가"만
 * 알면 되는데, 그 사실의 원본인 `shared/constants/tickers` 는 전 종목의 한국어 서사·FAQ 를 통째로
 * 안고 있어 서버 번들이 수백 KB 다(11종 시점 실측 **416KB** — decisions.md `[2026-07-23][seo]`.
 * 종목이 늘수록 커진다). 랜딩이 그 폴더를 직접
 * import 하면 첫인상 지면이 그 무게를 그대로 진다. 그래서 `{symbol, slug}` 만 복제한다.
 *
 * ⚠ **한글명은 여기 복제하지 않는다** — `PRESET_TICKER_KOREAN_NAME_BY_TICKER`
 * (`shared/constants/presets`)가 단일 출처이고, 그 맵은 시뮬레이터가 이미 엔트리로 끌고 있어
 * 추가 비용이 0이다. 검색 인덱스 조립은 `pages/Landing` 의 순수 함수가 한다.
 *
 * 🔴 **복제한 값은 반드시 어긋난다 — 어긋나는 순간 랜딩 검색이 죽은 링크를 만든다.**
 * 그래서 `test/landing/tickerPageIndexParity.test.ts` 가 레지스트리와 **양방향 1:1**을 단정한다
 * (12번째 티커 페이지를 추가하고 이 배열을 빼먹으면 그 테스트가 빨개진다).
 */
export const TICKER_PAGE_INDEX = [
  { symbol: 'SCHD', slug: 'schd' },
  { symbol: 'VIG', slug: 'vig' },
  { symbol: 'DGRO', slug: 'dgro' },
  { symbol: 'DGRW', slug: 'dgrw' },
  { symbol: 'SCHY', slug: 'schy' },
  { symbol: 'HDV', slug: 'hdv' },
  { symbol: 'VYM', slug: 'vym' },
  { symbol: 'SPYD', slug: 'spyd' },
  { symbol: 'JEPI', slug: 'jepi' },
  { symbol: 'JEPQ', slug: 'jepq' },
  { symbol: 'O', slug: 'o' },
  { symbol: 'NOBL', slug: 'nobl' },
  { symbol: 'SDY', slug: 'sdy' },
  { symbol: 'RDVY', slug: 'rdvy' },
  { symbol: 'QYLD', slug: 'qyld' },
  { symbol: 'XYLD', slug: 'xyld' },
  { symbol: 'DIVO', slug: 'divo' },
  { symbol: 'KO', slug: 'ko' },
  { symbol: 'JNJ', slug: 'jnj' },
  { symbol: 'SPYI', slug: 'spyi' },
  { symbol: 'QQQI', slug: 'qqqi' },
  { symbol: 'VNQ', slug: 'vnq' },
  { symbol: 'PG', slug: 'pg' },
  { symbol: 'PEP', slug: 'pep' },
  { symbol: 'MO', slug: 'mo' },
  { symbol: 'VZ', slug: 'vz' },
  { symbol: 'XOM', slug: 'xom' },
  { symbol: 'DLN', slug: 'dln' },
  { symbol: 'DON', slug: 'don' },
  { symbol: 'DES', slug: 'des' },
  { symbol: 'DHS', slug: 'dhs' },
  { symbol: 'SDVY', slug: 'sdvy' },
  { symbol: 'DVY', slug: 'dvy' },
  { symbol: 'FDVV', slug: 'fdvv' },
  { symbol: 'PEY', slug: 'pey' },
  { symbol: 'FDL', slug: 'fdl' },
  { symbol: 'RYLD', slug: 'ryld' },
  { symbol: 'IDVO', slug: 'idvo' },
  { symbol: 'SCHH', slug: 'schh' },
  { symbol: 'VNQI', slug: 'vnqi' },
  { symbol: 'VIGI', slug: 'vigi' },
  { symbol: 'VYMI', slug: 'vymi' },
  { symbol: 'IDV', slug: 'idv' },
  { symbol: 'DWX', slug: 'dwx' },
  { symbol: 'T', slug: 't' },
  { symbol: 'ABBV', slug: 'abbv' },
  { symbol: 'CVX', slug: 'cvx' },
  { symbol: 'MCD', slug: 'mcd' },
  { symbol: 'MMM', slug: 'mmm' },
  { symbol: 'IBM', slug: 'ibm' },
  { symbol: 'CAT', slug: 'cat' },
  { symbol: 'ADP', slug: 'adp' },
  { symbol: 'ITW', slug: 'itw' },
  { symbol: 'KMB', slug: 'kmb' },
  { symbol: 'CL', slug: 'cl' },
  { symbol: 'ED', slug: 'ed' },
  { symbol: 'PLD', slug: 'pld' },
  { symbol: 'VICI', slug: 'vici' },
  { symbol: 'ENB', slug: 'enb' },
  { symbol: 'VOO', slug: 'voo' },
  { symbol: 'VTI', slug: 'vti' },
  { symbol: 'QQQ', slug: 'qqq' },
  { symbol: 'SPY', slug: 'spy' },
  { symbol: 'IVV', slug: 'ivv' },
  { symbol: 'VUG', slug: 'vug' },
  { symbol: 'VT', slug: 'vt' },
  { symbol: 'VXUS', slug: 'vxus' },
  { symbol: 'DIA', slug: 'dia' },
  { symbol: 'SMH', slug: 'smh' },
  { symbol: 'SPHD', slug: 'sphd' },
  { symbol: 'CGDV', slug: 'cgdv' },
  { symbol: 'JPM', slug: 'jpm' },
  { symbol: 'BAC', slug: 'bac' },
  { symbol: 'WFC', slug: 'wfc' },
  { symbol: 'GS', slug: 'gs' },
  { symbol: 'MS', slug: 'ms' },
  { symbol: 'V', slug: 'v' },
  { symbol: 'MA', slug: 'ma' },
  { symbol: 'AXP', slug: 'axp' },
  { symbol: 'SPGI', slug: 'spgi' },
  { symbol: 'HD', slug: 'hd' },
  { symbol: 'LOW', slug: 'low' },
  { symbol: 'WMT', slug: 'wmt' },
  { symbol: 'TGT', slug: 'tgt' },
  { symbol: 'COST', slug: 'cost' },
  { symbol: 'CSCO', slug: 'csco' },
  { symbol: 'UNH', slug: 'unh' },
  { symbol: 'AMGN', slug: 'amgn' },
  { symbol: 'PFE', slug: 'pfe' },
  { symbol: 'MRK', slug: 'mrk' },
  { symbol: 'LLY', slug: 'lly' },
  { symbol: 'ORCL', slug: 'orcl' },
  { symbol: 'QCOM', slug: 'qcom' },
  { symbol: 'RTX', slug: 'rtx' },
  { symbol: 'UNP', slug: 'unp' },
  { symbol: 'AAPL', slug: 'aapl' },
  { symbol: 'MSFT', slug: 'msft' },
  { symbol: 'DE', slug: 'de' },
  { symbol: 'NEE', slug: 'nee' },
  { symbol: 'AMT', slug: 'amt' },
  { symbol: 'UPS', slug: 'ups' },
  { symbol: 'CVS', slug: 'cvs' },
  { symbol: 'GD', slug: 'gd' },
  { symbol: 'AVGO', slug: 'avgo' },
  { symbol: 'TXN', slug: 'txn' },
  /* 5차 확충(2026-08-17) — 레버리지 8종 */
  { symbol: 'TQQQ', slug: 'tqqq' },
  { symbol: 'QLD', slug: 'qld' },
  { symbol: 'SSO', slug: 'sso' },
  { symbol: 'UPRO', slug: 'upro' },
  { symbol: 'SPXL', slug: 'spxl' },
  { symbol: 'USD', slug: 'usd' },
  { symbol: 'SOXL', slug: 'soxl' },
  { symbol: 'TNA', slug: 'tna' },
  /* 5차 확충(2026-08-17) — 성장주 7종 */
  { symbol: 'NVDA', slug: 'nvda' },
  { symbol: 'GOOGL', slug: 'googl' },
  { symbol: 'AMZN', slug: 'amzn' },
  { symbol: 'META', slug: 'meta' },
  { symbol: 'TSLA', slug: 'tsla' },
  { symbol: 'TSM', slug: 'tsm' },
  { symbol: 'ASML', slug: 'asml' }
] as const;

/** 인덱스 한 줄. 심볼은 대문자, slug 는 소문자(라우트 파라미터와 같은 형태). */
export type TickerPageIndexEntry = (typeof TICKER_PAGE_INDEX)[number];

/** `/ticker/:slug` 절대 경로. 링크를 만드는 곳마다 문자열을 조립하지 않게 한 곳에서 만든다. */
export const tickerPagePath = (slug: string): string => `/ticker/${slug}`;

/** 종목 소개 허브. 검색 결과가 상한을 넘을 때의 "전체 보기" 착지점이다. */
export const TICKER_HUB_PATH = '/ticker/all';
