/**
 * 종목이 **어느 시장**에 상장돼 있는가.
 *
 * 이 앱의 배당 유니버스는 미국 종목이 대부분이고 한국 상장 12종이 섞여 있다. 한 목록에 뒤섞이면
 * 찾는 쪽이 매번 걸러 읽어야 해서, 종목 선택 드로어가 이 값으로 탭을 가른다
 * (2026-08-07 사용자 지시).
 */
export type TickerMarket = 'us' | 'kr';

/**
 * 한국 상장 종목의 티커 접미사.
 *
 * 🔴 **이 접미사가 유일한 신호다.** 이 레포는 야후 심볼을 그대로 큐레이션에 못 박는다
 * (`shared/constants/presets/koreanDividendTickers.ts` 머리말) — `.KS`(유가증권) · `.KQ`(코스닥).
 * 미국 종목 티커에는 점이 없다.
 *
 * ⚠ "점이 있으면 한국"으로 줄여 쓰지 마라. 미국에도 점을 쓰는 표기가 있다(클래스 주식 `BRK.B`).
 *   지금 유니버스에 없을 뿐이고, 들어오는 날 조용히 한국 탭으로 새어 든다.
 */
const KOREAN_SUFFIXES = ['.KS', '.KQ'] as const;

/** 대소문자는 가리지 않는다 — 큐레이션은 대문자지만 공유 링크로 들어온 값까지 믿을 수는 없다. */
export const tickerMarketOf = (ticker: string): TickerMarket => {
  const upper = ticker.toUpperCase();
  return KOREAN_SUFFIXES.some((suffix) => upper.endsWith(suffix)) ? 'kr' : 'us';
};

/** 그 시장의 종목만 남긴다. 원본 순서를 보존한다 — 목록의 정렬은 호출부가 이미 정했다. */
export const filterByMarket = <T extends { ticker: string }>(
  options: readonly T[],
  market: TickerMarket
): T[] => options.filter((option) => tickerMarketOf(option.ticker) === market);

/** 그 시장의 종목 수. 탭 라벨의 배지가 쓴다 — 빈 탭을 눌러 보고 나서 알게 하지 않는다. */
export const countByMarket = <T extends { ticker: string }>(
  options: readonly T[],
  market: TickerMarket
): number => filterByMarket(options, market).length;
