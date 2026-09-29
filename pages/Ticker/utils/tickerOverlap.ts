import type { EtfUniverseEntry } from '@/shared/lib/etfOverlap';

/**
 * `/ticker/overlap`(ETF 겹침) 화면의 순수 규칙. 계산 자체는 `shared/lib/etfOverlap` 이 하고,
 * 여기는 **화면의 규칙**(바구니 정원·검색·결론 단계)만 둔다.
 */

/** 바구니 정원. 다섯을 넘으면 짝이 10개를 넘어 매트릭스가 읽히지 않는다. */
export const MAX_OVERLAP_ETFS = 5;

/** 검색 결과를 한 번에 몇 줄까지 그리나. 4,000개를 전부 그리면 입력이 버벅인다. */
export const OVERLAP_SEARCH_LIMIT = 20;

/** URL `?t=` 값 → 바구니. 대문자·중복 제거·정원 컷. 알 수 없는 티커도 일단 둔다(목록이 늦게 올 수 있다). */
export const normalizeOverlapSelection = (raw: readonly string[]): string[] => {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of raw) {
    const ticker = value.trim().toUpperCase();
    if (!/^[A-Z][A-Z0-9.\-]{0,9}$/.test(ticker) || seen.has(ticker)) continue;
    seen.add(ticker);
    out.push(ticker);
    if (out.length >= MAX_OVERLAP_ETFS) break;
  }
  return out;
};

const normalizeQuery = (raw: string): string => raw.trim().toLowerCase().replace(/[\s·.\-_/]/g, '');

/**
 * 검색. 티커가 정확히 같으면 맨 위, 그다음 티커가 그 글자로 시작하는 것, 그다음 이름에 든 것.
 * 같은 단계 안에서는 **보유 종목이 있는 ETF 가 먼저**다 — 담을 수 있는 것을 먼저 보여 준다.
 */
export const searchEtfUniverse = (
  etfs: readonly EtfUniverseEntry[],
  query: string,
  limit: number = OVERLAP_SEARCH_LIMIT
): EtfUniverseEntry[] => {
  const needle = normalizeQuery(query);
  if (!needle) return [];

  const ranked: { entry: EtfUniverseEntry; rank: number }[] = [];
  for (const entry of etfs) {
    const ticker = entry.ticker.toLowerCase();
    let rank: number;
    if (ticker === needle) rank = 0;
    else if (ticker.startsWith(needle)) rank = 1;
    else if (normalizeQuery(entry.name).includes(needle)) rank = 2;
    else continue;
    ranked.push({ entry, rank: rank * 2 + (entry.hasHoldings ? 0 : 1) });
  }
  ranked.sort((left, right) => left.rank - right.rank || left.entry.ticker.localeCompare(right.entry.ticker));
  return ranked.slice(0, limit).map((item) => item.entry);
};

/**
 * 중복률의 결론 단계 — 문장과 게이지 색이 이 값을 따른다.
 * 🔴 경계는 판단이 아니라 **읽기 쉬운 눈금**이다. "나쁘다"가 아니라 "몰려 있다"를 말한다(카피 규율).
 */
export type OverlapLevel = 'none' | 'single' | 'low' | 'medium' | 'high';

export const overlapLevel = (rate: number, basketSize: number): OverlapLevel => {
  if (basketSize === 0) return 'none';
  if (basketSize === 1) return 'single';
  if (rate >= 50) return 'high';
  if (rate >= 25) return 'medium';
  return 'low';
};

/** `12.345` → `12.3`. 소수 첫째 자리까지. */
export const formatPercent = (value: number): string => (Math.round(value * 10) / 10).toFixed(1);

/** `+3.2`·`−1.0`·`0.0` — 부호를 글자로 붙인다(색만으로 말하지 않는다). */
export const formatDelta = (value: number): string => {
  const rounded = Math.round(value * 10) / 10;
  if (rounded === 0) return '0.0';
  return `${rounded > 0 ? '+' : '−'}${Math.abs(rounded).toFixed(1)}`;
};
