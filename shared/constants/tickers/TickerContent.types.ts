import type { PresetTickerKey } from '@/shared/constants/presets';
import type { TickerCategoryId } from './TickerCategory';

/**
 * 숫자 하이라이트 카드 (섹션에 곁들이는 선택적 강조). `value`/`caption`에 `{{dividendYield}}` 같은
 * 토큰을 넣으면 `renderTickerContentTemplate`가 `resolveTickerEngineFacts`의 값으로 치환한다.
 * 엔진 6필드가 아닌 정적 사실(운용보수 등)은 토큰 없이 리터럴로 적어도 된다 — 자주 안 바뀌는 값이다.
 */
export type TickerContentStat = {
  label: string;
  value: string;
  caption?: string;
};

/**
 * 좌측 목차에서 점프할 하나의 콘텐츠 섹션. 이 배열이 목차·스크롤 앵커·(추후) 구조화 데이터의
 * 유일한 원천이다 — 프론트는 이 구조를 그대로 순회해 렌더한다(마크다운 파서 불필요).
 */
export type TickerContentSection = {
  /** 앵커 id. 페이지 내 유일해야 한다 (kebab-case, 예: 'dividend-yield'). */
  id: string;
  /** 좌측 목차 라벨 (짧게, 예: '배당률'). */
  navLabel: string;
  /** 섹션 제목 (본문 헤딩에 해당). */
  heading: string;
  /**
   * 본문 문단 배열. 문단마다 `<p>` 하나로 렌더된다는 전제다.
   * `{{token}}`은 `renderTickerContentTemplate` 치환 대상 (지원 토큰은 그 파일 참고).
   */
  paragraphs: string[];
  /** 선택적 근거 불릿 리스트. 토큰 치환 대상. */
  bullets?: string[];
  /** 섹션에 곁들일 숫자 하이라이트 (선택). */
  stat?: TickerContentStat;
};

/** 검색 질의형 FAQ 한 쌍. JSON-LD `FAQPage`의 `Question`/`acceptedAnswer`에 그대로 대응된다. */
export type TickerContentFaq = {
  /** 예: 'SCHD 배당률은?' — 실제 검색창에 칠 법한 형태로 쓴다. */
  question: string;
  /** 답변. 토큰 치환 대상. */
  answer: string;
};

/**
 * 시점에 민감하지 않거나 "작성 시점 기준"임을 명시하는 reference-only 팩트.
 * **엔진에 절대 대입하지 않는다** — 계산은 언제나 `shared/constants/presets`의 6필드
 * (가격·배당률·성장률·기대수익·주기·이름)만 쓰고, 이 타입의 어떤 필드도 `runSimulation`에 흘러가지 않는다.
 */
export type TickerReferenceFacts = {
  /** 추종 지수 (예: '다우존스 미국 배당 100 지수'). */
  trackedIndex?: string;
  /** 상장 연도. 정적 사실이라 안전. */
  inceptionYear?: number;
  /** 운용보수(총보수, %). 정적에 가깝지만 변경될 수 있어 `asOfNote`에 확인 시점을 남긴다. */
  expenseRatioPercent?: number;
  /** 보유 종목 수(대략치) — 지수 목표치와 실제 펀드 보유 수가 소폭 다를 수 있어 "약" 표현으로만 쓴다. */
  holdingsCountApprox?: number;
  /** 지급월 패턴을 정성적으로 설명하는 문구 (예: '3·6·9·12월 분기 지급'). */
  paymentMonthsNote?: string;
  /** 연속 배당 성장 연수(대략치). 매년 값이 바뀌므로 `asOfNote`에 기준 시점을 명시해야 한다. */
  consecutiveGrowthYearsApprox?: number;
  /**
   * 과거 배당 지급액 기준 CAGR(%) 근사치. **엔진의 `dividendGrowth`(기대 총수익 기반 가정)와는
   * 다른 숫자**이므로 절대 엔진 필드와 동일시하거나 대입하지 않는다. 순수 참고 서술용.
   */
  historicalDividendCagrPercent?: number;
  /**
   * 대표 섹터 비중 순서(대략, 비중 큰 순). 분기 리밸런싱마다 바뀌므로 정확한 %가 아니라
   * 상대적 순서만 담는다 — `asOfNote`에 조사 시점을 남긴다.
   */
  topSectors?: string[];
  /**
   * 대표 보유 종목. **확신 있는 현재 구성을 확인하지 못했다면 비워 둔다** — 특정 종목명을
   * 지어내지 않는다(리밸런싱마다 바뀌는 가장 변동성 큰 필드).
   */
  topHoldings?: string[];
  /**
   * 위 reference 필드들의 기준 시점·출처 고지 (필수). 배당률·성장률처럼 계산에 쓰이는 숫자는
   * 이 페이지가 아니라 시뮬레이터 프리셋을 그대로 따른다는 점도 함께 밝힌다.
   */
  asOfNote: string;
};

export type TickerRelatedLink = {
  /** 관련 티커 심볼 — 계산 유니버스에 존재해야 시뮬레이터로 바로 연결할 수 있다. */
  ticker: PresetTickerKey;
  /** 왜 관련 있는지 한 줄 (예: '더 높은 현재 배당을 원한다면'). */
  relationLabel: string;
};

/**
 * 티커별 액센트 테마(선택). 상세 페이지가 **페이지 루트 스코프 CSS 변수**로 깔아 히어로 그라데이션·
 * 스탯 하이라이트·목차 활성·구분선 등 **장식(chrome)** 에만 쓴다. 본문 텍스트/배경 색은 앱 팔레트
 * 토큰(`--sb-*`)을 그대로 유지하고 액센트만 주입하므로 `html[data-palette]` 테마 시스템과 충돌하지
 * 않는다. 미지정 티커는 앱 기본 브랜드 팔레트로 폴백한다(과설계 회피 — 전 티커가 색을 가질 필요 없다).
 *
 * ⚠ 서버 HTML 렌더러(`api/ticker-html`)는 이 필드를 **읽지 않는다**(장식 전용) — 값 추가는 안전하지만
 * `shared/constants/tickers` 를 수정하면 번들이 낡으므로 `npm run api:bundle` 재생성이 필요하다.
 */
export type TickerAccentTheme = {
  /** 그라데이션 시작(진한 앵커). 위에 흰 라벨을 얹는 장식용. */
  from: string;
  /** 그라데이션 끝(밝은 쪽). */
  to: string;
  /**
   * 라이트 테마 서피스에서 액센트 텍스트·활성 표시·보더의 기준색(대비 4.5:1 이상).
   * soft 배경/보더는 이 색을 서피스와 color-mix 해 파생한다.
   */
  textLight: string;
  /** 다크 테마 서피스에서의 같은 기준색. */
  textDark: string;
};

/**
 * 티커 하나를 설명하는 SEO 랜딩 콘텐츠 엔트리.
 *
 * **엔진 6필드(가격·배당률·성장률·기대수익·주기·이름)는 여기 없다** — 전부
 * `shared/constants/presets`(`DIVIDEND_UNIVERSE`/`PRESET_TICKER_KOREAN_NAME_BY_TICKER`)의
 * 단일 소스를 그대로 쓴다. 렌더 시 `resolveTickerEngineFacts(ticker)`로 조인하고, 문단 속
 * `{{token}}`은 `renderTickerContentTemplate`가 그 값으로 치환한다. 이렇게 분리해야 프리셋이
 * 자동 갱신(크론)돼도 콘텐츠를 다시 쓰지 않고 숫자가 항상 최신으로 맞는다.
 */
export type TickerContent = {
  ticker: PresetTickerKey;
  /** URL 슬러그 (소문자). 라우트 `/ticker/:name`의 `:name`. 보통 `ticker.toLowerCase()`. */
  slug: string;
  categoryIds: TickerCategoryId[];
  /** `<title>`/`og:title` 원본 (~60자 권장). 사이트명 접미는 라우트 배선이 붙인다. */
  metaTitle: string;
  /** meta description (~150자 권장). */
  metaDescription: string;
  /** 히어로 영역 한 줄 후크 카피. 토큰 치환 대상. */
  heroTagline: string;
  sections: TickerContentSection[];
  faqs: TickerContentFaq[];
  reference: TickerReferenceFacts;
  relatedTickers: TickerRelatedLink[];
  /** 티커별 액센트 테마(선택) — 상세 페이지 장식에만 쓰인다. 미지정이면 앱 기본 브랜드 팔레트. */
  accent?: TickerAccentTheme;
  /** 하단 상시 고지 문구 — 정보제공·투자자문 아님, 분배율·주가·세금 변동 고지. */
  disclaimer: string;
  /** 이 콘텐츠(서사·reference 팩트)를 검증/작성한 시점(ISO date, YYYY-MM-DD). 엔진 값의 as-of와 별개. */
  contentUpdatedAt: string;
};
