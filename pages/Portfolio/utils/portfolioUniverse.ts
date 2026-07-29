import { DIVIDEND_UNIVERSE, PRESET_TICKER_KOREAN_NAME_BY_TICKER } from '@/shared/constants/presets';
import { resolvePortfolioMarketInfo } from '@/shared/lib/portfolio';
import type { PortfolioDataFreshness } from '@/shared/lib/portfolio';

/**
 * 종목 추가 드로어가 검색하는 **선택 가능 목록**.
 *
 * 신선도(`snapshot` / `preset`)는 여기서 다시 판정하지 않고 계산 계층의 해석기
 * (`resolvePortfolioMarketInfo`)에게 물어본다 — 목록의 배지와 표의 배지가 다른 규칙으로 갈리면
 * "드로어에선 멀쩡했는데 추가하니 시세 미갱신"이 된다.
 */

export type PortfolioUniverseEntry = {
  /** 대문자 심볼. */
  ticker: string;
  /** 한글명(있으면) 또는 영문명. 없으면 심볼. */
  name: string;
  /** 시세 출처. 유니버스 종목은 `manual` 이 될 수 없다. */
  freshness: PortfolioDataFreshness;
};

const KOREAN_NAME_BY_TICKER: Record<string, string> = PRESET_TICKER_KOREAN_NAME_BY_TICKER;

/** 유니버스 종목의 표시 이름. 수동 추가 종목(유니버스 밖)은 이름을 저장하지 않으므로 빈 문자열이다. */
export const resolvePortfolioTickerName = (ticker: string): string => {
  const symbol = ticker.trim().toUpperCase();
  const preset = DIVIDEND_UNIVERSE[symbol as keyof typeof DIVIDEND_UNIVERSE] as { name?: string } | undefined;

  return KOREAN_NAME_BY_TICKER[symbol] ?? preset?.name ?? '';
};

const buildPortfolioUniverse = (): PortfolioUniverseEntry[] =>
  Object.keys(DIVIDEND_UNIVERSE)
    .sort((left, right) => (left < right ? -1 : left > right ? 1 : 0))
    .map((ticker) => ({
      ticker,
      name: resolvePortfolioTickerName(ticker) || ticker,
      // 수량 0 은 시장 정보 해석에 영향을 주지 않는다(가격·배당률·신선도만 읽는다).
      freshness: resolvePortfolioMarketInfo({ ticker, quantity: 0 })?.freshness ?? 'preset'
    }));

/**
 * 빌드 시점에 고정된 데이터라 한 번만 만든다 — 호출자마다 새 배열을 만들면 참조가 매번 바뀌어
 * memo 가 무의미해진다. 호출자는 이 배열을 제자리에서 변형하지 않는다(필터는 새 배열로).
 */
let cachedUniverse: PortfolioUniverseEntry[] | null = null;

export const getPortfolioUniverse = (): PortfolioUniverseEntry[] => {
  cachedUniverse ??= buildPortfolioUniverse();
  return cachedUniverse;
};

/** 티커·이름 부분일치(대소문자 무시). 빈 질의는 전체를 그대로 돌려준다. */
export const filterPortfolioUniverse = (
  entries: readonly PortfolioUniverseEntry[],
  query: string
): PortfolioUniverseEntry[] => {
  const needle = query.trim().toLowerCase();
  if (needle.length === 0) return [...entries];

  return entries.filter(
    (entry) => entry.ticker.toLowerCase().includes(needle) || entry.name.toLowerCase().includes(needle)
  );
};
