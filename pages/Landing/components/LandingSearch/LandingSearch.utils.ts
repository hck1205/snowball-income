import { PRESET_TICKER_KOREAN_NAME_BY_TICKER } from '@/shared/constants/presets';
import { TICKER_PAGE_INDEX } from '@/shared/constants/tickerPages';
import { LANDING_SEARCH_FALLBACK } from '../../copy';
import type { LandingTickerEntry } from './LandingSearch.types';

/**
 * 랜딩 종목 검색의 **순수 계층**.
 *
 * 이 검색은 로컬 배열 11종을 훑는 **동기 함수**다 — 로딩도 실패도 없다.
 * 🔴 그래서 스피너·스켈레톤을 만들지 마라(있지도 않은 비동기를 흉내 내는 것이다).
 */

/** 조합 중인 한 글자로는 검색하지 않는다 — 1글자면 11종 중 절반이 걸려 아무것도 좁혀지지 않는다. */
export const LANDING_SEARCH_MIN_QUERY_LENGTH = 2;

/** 화면에 세우는 결과 상한. 넘치면 마지막 줄이 허브로 보낸다. */
export const LANDING_SEARCH_RESULT_LIMIT = 6;

/**
 * URL 반영 디바운스.
 * ⚠ `CommunitySearchBar` 와 값이 같지만 **상수는 일부러 따로 둔다** — 커뮤니티 상수를 랜딩이
 * import 하면 도메인이 섞이고, 한쪽 사정으로 값을 바꿀 때 다른 화면이 딸려 온다.
 */
export const LANDING_SEARCH_DEBOUNCE_MS = 300;

/** 쿼리 파라미터. 🔴 `s`·`share` 는 공유 링크 복원 경로라 절대 쓰지 마라(방문자가 시뮬레이터로 튕긴다). */
export const LANDING_SEARCH_QUERY_PARAM = 'q';

const KOREAN_NAME_BY_TICKER: Record<string, string | undefined> = PRESET_TICKER_KOREAN_NAME_BY_TICKER;

/**
 * 검색 대상 = **소개 페이지가 실재하는 종목**뿐이다.
 *
 * 심볼·slug 는 의존성 0짜리 경량 인덱스(`shared/constants/tickerPages`)에서, 한글명은 단일 출처인
 * `PRESET_TICKER_KOREAN_NAME_BY_TICKER` 에서 조인한다 — 한글명을 인덱스에 복제하면 두 곳이 어긋난다.
 * 한글명이 없는 종목이 생겨도 심볼 검색은 살아 있어야 하므로 빈 문자열로 떨어뜨린다(가드 테스트가
 * 결손 0을 단정하므로 실제로는 일어나지 않는다).
 */
export const LANDING_TICKER_INDEX: readonly LandingTickerEntry[] = TICKER_PAGE_INDEX.map((entry) => ({
  symbol: entry.symbol,
  slug: entry.slug,
  koreanName: KOREAN_NAME_BY_TICKER[entry.symbol] ?? ''
}));

const findBySymbol = (symbol: string): LandingTickerEntry | undefined =>
  LANDING_TICKER_INDEX.find((entry) => entry.symbol === symbol);

/**
 * 결과가 0건일 때 대신 세우는 셋. 🔴 "추천"이 아니라 **소개 글이 준비된 종목**이다.
 * 죽은 폴백(인덱스에 없는 심볼)은 가드 테스트가 막는다.
 */
export const LANDING_SEARCH_FALLBACK_ENTRIES: readonly LandingTickerEntry[] = LANDING_SEARCH_FALLBACK.map(
  (symbol) => findBySymbol(symbol)
).filter((entry): entry is LandingTickerEntry => entry !== undefined);

/** 검색을 할 만한 입력인가. 화면은 이 판정으로 패널을 그릴지 정한다(빈 입력이면 히어로 높이가 안 흔들린다). */
export const isSearchableQuery = (raw: string): boolean => raw.trim().length >= LANDING_SEARCH_MIN_QUERY_LENGTH;

/**
 * 순위 — 낮을수록 위. ①심볼 완전일치 ②심볼 접두일치 ③심볼 부분일치 ④한글명 부분일치.
 * 어디에도 안 걸리면 `null`(결과에서 뺀다). 동순위는 배열 순서를 유지한다(안정 정렬).
 */
const rankOf = (entry: LandingTickerEntry, query: string): number | null => {
  const upper = query.toUpperCase();
  if (entry.symbol === upper) return 0;
  if (entry.symbol.startsWith(upper)) return 1;
  if (entry.symbol.includes(upper)) return 2;
  // 공백을 지우거나 초성을 해석하지 않는다 — 11종짜리 목록에 필요 없는 과설계다.
  if (entry.koreanName.length > 0 && entry.koreanName.includes(query)) return 3;
  return null;
};

/** 검색 본체. 상한을 넘겨도 **잘라서** 돌려주고, 전체 건수는 호출부가 인덱스 길이로 안다. */
export const searchTickerPages = (
  raw: string,
  index: readonly LandingTickerEntry[] = LANDING_TICKER_INDEX
): LandingTickerEntry[] => {
  const query = raw.trim();
  if (!isSearchableQuery(query)) return [];

  return index
    .map((entry, order) => ({ entry, order, rank: rankOf(entry, query) }))
    .filter((row): row is { entry: LandingTickerEntry; order: number; rank: number } => row.rank !== null)
    .sort((left, right) => left.rank - right.rank || left.order - right.order)
    .slice(0, LANDING_SEARCH_RESULT_LIMIT)
    .map((row) => row.entry);
};
