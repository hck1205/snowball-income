import type { EtfUniverseEntry } from '@/shared/lib/etfOverlap';

/**
 * `/ticker/overlap`(ETF 조합 짜기) 화면의 순수 규칙. 계산 자체는 `shared/lib/etfOverlap` 이 하고,
 * 여기는 **화면의 규칙**(바구니 정원·검색·결론 단계)만 둔다.
 */

/** 바구니 정원. 다섯을 넘으면 짝이 10개를 넘어 매트릭스가 읽히지 않는다. */
export const MAX_OVERLAP_ETFS = 5;

/** 검색 결과 상한. 목록이 자기 안에서 스크롤되므로 넉넉히 두되, 4,000개 전부를 매 입력마다 정렬하지는 않는다. */
export const OVERLAP_SEARCH_LIMIT = 100;

/** 비중의 눈금. 슬라이더가 이 범위·간격으로 움직이고, URL 에도 이 정수로 실린다. */
export const OVERLAP_WEIGHT_MIN = 5;
export const OVERLAP_WEIGHT_MAX = 100;
export const OVERLAP_WEIGHT_STEP = 5;
/** 비중을 따로 정하지 않은 ETF 의 값. 모두 이 값이면 같은 금액씩이다("균등하게"). */
export const OVERLAP_DEFAULT_WEIGHT = 50;

/** 바구니 — 티커와 **같은 순서**의 상대 비중(정수). 비중은 합이 100 일 필요가 없다(몫으로 정규화한다). */
export type OverlapBasketState = { readonly tickers: string[]; readonly weights: number[] };

const clampWeight = (value: number): number =>
  Math.min(OVERLAP_WEIGHT_MAX, Math.max(OVERLAP_WEIGHT_MIN, Math.round(value / OVERLAP_WEIGHT_STEP) * OVERLAP_WEIGHT_STEP));

/**
 * URL `?t=`·`?w=` → 바구니. 대문자·중복 제거·정원 컷. 알 수 없는 티커도 일단 둔다(목록이 늦게 올 수 있다).
 *
 * 🔴 비중은 티커와 **짝으로** 걸러진다 — 티커 하나가 버려지면 그 자리의 비중도 함께 버려야 뒤의 짝이
 *    밀리지 않는다. 비중이 없거나 숫자가 아니면 그 ETF 만 기본값이다(링크 하나가 망가져도 나머지는 산다).
 */
export const normalizeOverlapBasket = (rawTickers: readonly string[], rawWeights: readonly string[] = []): OverlapBasketState => {
  const seen = new Set<string>();
  const tickers: string[] = [];
  const weights: number[] = [];
  rawTickers.forEach((value, index) => {
    if (tickers.length >= MAX_OVERLAP_ETFS) return;
    const ticker = value.trim().toUpperCase();
    if (!/^[A-Z][A-Z0-9.\-]{0,9}$/.test(ticker) || seen.has(ticker)) return;
    seen.add(ticker);
    tickers.push(ticker);
    const weight = Number(rawWeights[index]);
    weights.push(Number.isFinite(weight) && weight > 0 ? clampWeight(weight) : OVERLAP_DEFAULT_WEIGHT);
  });
  return { tickers, weights };
};

/** 바구니 → URL 파라미터. 모두 기본값(같은 금액)이면 `w` 를 싣지 않는다 — 링크가 짧고 예전 링크와 같다. */
export const overlapBasketParams = (basket: OverlapBasketState): Record<string, string> => {
  if (basket.tickers.length === 0) return {};
  const params: Record<string, string> = { t: basket.tickers.join(',') };
  if (basket.weights.some((weight) => weight !== OVERLAP_DEFAULT_WEIGHT)) params.w = basket.weights.join(',');
  return params;
};

/** 새로 담는 ETF 의 비중 — 지금 비중들의 평균(`previewAddDelta` 와 같은 규칙). 비었으면 기본값. */
export const nextOverlapWeight = (weights: readonly number[]): number =>
  weights.length === 0 ? OVERLAP_DEFAULT_WEIGHT : clampWeight(weights.reduce((sum, weight) => sum + weight, 0) / weights.length);

/**
 * 상대 비중 → 화면에 보일 몫(%, 소수 첫째 자리). 반올림으로 합이 100.0 에서 어긋나면 가장 큰 몫이 차이를 진다 —
 * 몫을 더해 본 사람이 99.9% 를 보고 계산이 틀렸다고 읽지 않게.
 */
export const overlapShares = (weights: readonly number[]): number[] => {
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  if (weights.length === 0 || total <= 0) return weights.map(() => 0);
  const shares = weights.map((weight) => Math.round((weight / total) * 1000) / 10);
  const drift = Math.round((100 - shares.reduce((sum, share) => sum + share, 0)) * 10) / 10;
  if (drift !== 0) {
    const largest = shares.indexOf(Math.max(...shares));
    shares[largest] = Math.round((shares[largest]! + drift) * 10) / 10;
  }
  return shares;
};

/** 티커만 필요한 호출부용(비교 화면과 같은 이름·모양). */
export const normalizeOverlapSelection = (raw: readonly string[]): string[] => normalizeOverlapBasket(raw).tickers;

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

/**
 * 증감의 방향 — 칩 색이 이 값을 따른다. 소수 첫째 자리에서 반올림한 값으로 판단한다
 * (`formatDelta` 가 `0.0` 이라고 쓰는데 색만 "늘었다"로 칠해지면 글자와 색이 서로 다른 말을 한다).
 */
export type DeltaTone = 'up' | 'down' | 'flat';

export const deltaTone = (delta: number): DeltaTone => {
  const rounded = Math.round(delta * 10) / 10;
  if (rounded > 0) return 'up';
  if (rounded < 0) return 'down';
  return 'flat';
};

/**
 * 검색어 없이 보는 **전체 목록**. 순서: 많이 찾는 ETF(`popular` 순서 그대로) → 보유 종목이 있는 나머지(티커순)
 * → 보유 종목이 없는 것(티커순). 담을 수 있는 것이 위로 온다.
 * `onlyWithHoldings` 면 보유 종목이 없는 ETF 를 뺀다 — 4,000여 개 중 대부분이 아직 담을 수 없어서,
 * 켜 두지 않으면 목록이 "준비 중" 줄로 채워진다.
 */
export const browseEtfUniverse = (
  etfs: readonly EtfUniverseEntry[],
  popular: readonly string[],
  options: { readonly onlyWithHoldings: boolean }
): EtfUniverseEntry[] => {
  const byTicker = new Map(etfs.map((entry) => [entry.ticker, entry]));
  const pinned = popular
    .map((ticker) => byTicker.get(ticker))
    .filter((entry): entry is EtfUniverseEntry => entry !== undefined);
  const pinnedSet = new Set(pinned.map((entry) => entry.ticker));
  const rest = etfs
    .filter((entry) => !pinnedSet.has(entry.ticker))
    .sort(
      (left, right) =>
        Number(right.hasHoldings) - Number(left.hasHoldings) || left.ticker.localeCompare(right.ticker)
    );
  const all = [...pinned, ...rest];
  return options.onlyWithHoldings ? all.filter((entry) => entry.hasHoldings) : all;
};

/** "비슷한 ETF" 로 부르는 짝 겹침 하한(%). 같은 지수를 따르는 ETF 끼리는 90% 를 넘고, 성격이 다르면 30% 아래다. */
export const SIMILAR_PAIR_MIN = 50;
/** "포함 관계" 로 부르는 포함률 하한(%) — 한 ETF 가 담은 비중의 이만큼을 다른 ETF 도 갖고 있다. */
export const CONTAINED_MIN = 70;

/**
 * 결론 문장의 종류.
 *
 * 🔴 중복률만 보고 "비슷한 ETF 를 담았다"고 말하지 않는다. SCHD+VOO 는 중복률이 50% 를 넘지만 두 ETF 가 함께
 *    싣는 비중은 8% 안팎이다 — SCHD 의 종목 대부분을 VOO 가 **작은 비중으로** 들고 있는 포함 관계일 뿐이다.
 *    그래서 짝 겹침(`overlap`)과 포함률(`aInB`·`bInA`)을 함께 보고 셋으로 가른다.
 */
export type OverlapVerdictDetail =
  | { readonly kind: 'level'; readonly level: OverlapLevel }
  | { readonly kind: 'similar'; readonly a: string; readonly b: string; readonly overlap: number }
  | {
      readonly kind: 'contained';
      readonly inner: string;
      readonly outer: string;
      readonly containment: number;
      readonly overlap: number;
    };

type PairLike = {
  readonly a: string;
  readonly b: string;
  readonly overlap: number;
  readonly aInB: number;
  readonly bInA: number;
};

/** 가장 많이 겹친 짝. 짝이 없으면 `null`. */
export const topOverlapPair = <T extends PairLike>(pairs: readonly T[]): T | null =>
  pairs.reduce<T | null>((best, pair) => (best === null || pair.overlap > best.overlap ? pair : best), null);

export const describeOverlap = (
  rate: number,
  basketSize: number,
  pairs: readonly PairLike[]
): OverlapVerdictDetail => {
  const level = overlapLevel(rate, basketSize);
  if (basketSize < 2 || pairs.length === 0) return { kind: 'level', level };

  const top = topOverlapPair(pairs)!;
  if (top.overlap >= SIMILAR_PAIR_MIN) return { kind: 'similar', a: top.a, b: top.b, overlap: top.overlap };

  let contained: Extract<OverlapVerdictDetail, { kind: 'contained' }> | null = null;
  for (const pair of pairs) {
    const candidates = [
      { inner: pair.a, outer: pair.b, containment: pair.aInB, overlap: pair.overlap },
      { inner: pair.b, outer: pair.a, containment: pair.bInA, overlap: pair.overlap }
    ];
    for (const candidate of candidates) {
      if (candidate.containment < CONTAINED_MIN) continue;
      if (!contained || candidate.containment > contained.containment) contained = { kind: 'contained', ...candidate };
    }
  }
  return contained ?? { kind: 'level', level };
};
