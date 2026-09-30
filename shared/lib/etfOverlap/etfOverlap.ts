import type { BasketAnalysis, EtfHoldingsSnapshot, PairOverlap, StockExposure } from './etfOverlap.types';

/**
 * ETF 겹침 계산 — **순수 함수**. 네트워크·DOM·시계에 닿지 않는다.
 *
 * ## 정의 (화면 문구가 이 정의를 그대로 말한다)
 * - **합친 포트폴리오**: 바구니의 ETF 를 같은 금액씩 산다고 본다. 종목 s 의 비중은
 *   `Σ(각 ETF 에서 s 의 비중) / ETF 수`.
 * - **중복률**: 합친 포트폴리오에서 두 개 이상의 ETF 가 함께 가진 종목의 비중 합 ÷ 전체 비중 합.
 *   분모를 100 이 아니라 "실제로 담긴 비중 합"으로 두는 이유: 스냅샷은 꼬리(현금·아주 작은 종목)를
 *   잘라내 비중 합이 100 에 못 미친다. 100 으로 나누면 그 잘린 몫만큼 중복률이 늘 낮게 나온다.
 * - **두 ETF 의 겹침**: 종목마다 두 비중 중 작은 쪽의 합. 둘이 완전히 같으면 100, 하나도 안 겹치면 0.
 *   업계에서 흔히 쓰는 "가중 겹침"과 같은 정의다.
 *
 * 🔴 같은 종목은 `key`(ISIN → CUSIP → 이름)로 알아본다. 티커로 맞추지 않는다(`EtfHolding.key`).
 */

const round2 = (value: number): number => Math.round(value * 100) / 100;

/** 비중 표. 같은 key 가 한 ETF 안에 두 번 나오면 더한다(수집기가 이미 합치지만 방어한다). */
const weightMap = (snapshot: EtfHoldingsSnapshot): Map<string, number> => {
  const map = new Map<string, number>();
  for (const holding of snapshot.holdings) {
    if (!(holding.weight > 0)) continue;
    map.set(holding.key, (map.get(holding.key) ?? 0) + holding.weight);
  }
  return map;
};

/** 두 ETF 의 가중 겹침. 순서와 무관하다(`pairOverlap(a, b) === pairOverlap(b, a)`). */
export const pairOverlap = (a: EtfHoldingsSnapshot, b: EtfHoldingsSnapshot): PairOverlap => {
  const left = weightMap(a);
  const right = weightMap(b);
  let overlap = 0;
  let sharedCount = 0;
  for (const [key, weight] of left) {
    const other = right.get(key);
    if (other === undefined) continue;
    overlap += Math.min(weight, other);
    sharedCount += 1;
  }
  return { a: a.ticker, b: b.ticker, overlap: round2(Math.min(100, overlap)), sharedCount };
};

export const analyzeBasket = (basket: readonly EtfHoldingsSnapshot[]): BasketAnalysis => {
  const count = basket.length;
  const byKey = new Map<string, { symbol: string | null; name: string; nameWeight: number; exposure: number; holders: { ticker: string; weight: number }[] }>();

  for (const snapshot of basket) {
    const weights = weightMap(snapshot);
    for (const holding of snapshot.holdings) {
      const weight = weights.get(holding.key);
      if (weight === undefined) continue;
      /* 같은 key 의 두 번째 행은 이미 합쳐졌다 — 한 번만 센다. */
      weights.delete(holding.key);

      const entry = byKey.get(holding.key);
      if (!entry) {
        byKey.set(holding.key, {
          symbol: holding.symbol,
          name: holding.name,
          nameWeight: weight,
          exposure: weight / count,
          holders: [{ ticker: snapshot.ticker, weight }]
        });
        continue;
      }
      entry.exposure += weight / count;
      entry.holders.push({ ticker: snapshot.ticker, weight });
      /* 표시 이름·티커는 가장 크게 담은 ETF 의 표기를 따른다(발행사마다 표기가 조금씩 다르다). */
      if (weight > entry.nameWeight) {
        entry.name = holding.name;
        entry.nameWeight = weight;
      }
      if (!entry.symbol && holding.symbol) entry.symbol = holding.symbol;
    }
  }

  const stocks: StockExposure[] = [...byKey.entries()].map(([key, entry]) => ({
    key,
    symbol: entry.symbol,
    name: entry.name,
    exposure: entry.exposure,
    holders: entry.holders
  }));

  const total = stocks.reduce((sum, stock) => sum + stock.exposure, 0);
  const shared = stocks.filter((stock) => stock.holders.length >= 2);
  const sharedExposure = shared.reduce((sum, stock) => sum + stock.exposure, 0);
  const overlapRate = count < 2 || total <= 0 ? 0 : round2((sharedExposure / total) * 100);

  stocks.sort(
    (left, right) =>
      right.holders.length - left.holders.length || right.exposure - left.exposure || left.key.localeCompare(right.key)
  );

  const pairs: PairOverlap[] = [];
  for (let i = 0; i < count; i += 1) {
    for (let j = i + 1; j < count; j += 1) {
      pairs.push(pairOverlap(basket[i]!, basket[j]!));
    }
  }

  return {
    overlapRate,
    stocks: stocks.map((stock) => ({ ...stock, exposure: round2(stock.exposure) })),
    uniqueCount: stocks.length,
    sharedCount: shared.length,
    pairs
  };
};

/**
 * "이걸 담으면 중복률이 얼마나 바뀌나"(%p). 바구니가 비어 있으면 비교할 것이 없어 `null`.
 * 🔴 이미 담긴 ETF 를 다시 넣어 계산하지 않는다 — 호출부가 걸러야 하지만 여기서도 `null`.
 *
 * `currentRate` — 지금 바구니의 중복률을 이미 알면 넘긴다. 후보 여럿을 미리볼 때 같은 바구니를
 * 후보 수만큼 다시 계산하지 않게 한다(넘기지 않으면 여기서 센다 — 결과는 같다).
 */
export const previewAddDelta = (
  basket: readonly EtfHoldingsSnapshot[],
  candidate: EtfHoldingsSnapshot,
  currentRate?: number
): number | null => {
  if (basket.length === 0) return null;
  if (basket.some((snapshot) => snapshot.ticker === candidate.ticker)) return null;
  const before = currentRate ?? analyzeBasket(basket).overlapRate;
  const after = analyzeBasket([...basket, candidate]).overlapRate;
  return round2(after - before);
};
