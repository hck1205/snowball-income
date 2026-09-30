import { describe, expect, it } from 'vitest';
import { analyzeBasket, pairOverlap, previewAddDelta } from './etfOverlap';
import type { EtfHoldingsSnapshot } from './etfOverlap.types';

const snap = (ticker: string, holdings: Record<string, number>): EtfHoldingsSnapshot => ({
  ticker,
  name: `${ticker} ETF`,
  seriesId: 'S000000000',
  asOfDate: '2026-06-30',
  filingDate: '2026-08-28',
  accessionNumber: '0000000000-26-000000',
  sourceUrl: 'https://www.sec.gov/',
  totalHoldings: Object.keys(holdings).length,
  coveredWeightPercent: Object.values(holdings).reduce((sum, weight) => sum + weight, 0),
  holdings: Object.entries(holdings).map(([key, weight]) => ({ key, symbol: key, name: key, weight }))
});

describe('pairOverlap — 종목마다 작은 쪽 비중의 합', () => {
  it('손으로 센 값과 같다', () => {
    const a = snap('A', { X: 50, Y: 30, Z: 20 });
    const b = snap('B', { X: 10, Y: 40, W: 50 });
    // min(50,10) + min(30,40) = 10 + 30
    expect(pairOverlap(a, b)).toEqual({ a: 'A', b: 'B', overlap: 40, sharedCount: 2 });
  });

  it('순서와 무관하다', () => {
    const a = snap('A', { X: 50, Y: 50 });
    const b = snap('B', { X: 20, Z: 80 });
    expect(pairOverlap(a, b).overlap).toBe(pairOverlap(b, a).overlap);
  });

  it('같은 ETF 끼리는 100, 하나도 안 겹치면 0', () => {
    const a = snap('A', { X: 60, Y: 40 });
    expect(pairOverlap(a, snap('A2', { X: 60, Y: 40 })).overlap).toBe(100);
    expect(pairOverlap(a, snap('B', { Z: 100 })).overlap).toBe(0);
  });
});

describe('analyzeBasket — 같은 금액씩 산 합친 포트폴리오', () => {
  it('ETF 가 하나뿐이면 중복률은 0 이다(비교할 짝이 없다)', () => {
    const result = analyzeBasket([snap('A', { X: 60, Y: 40 })]);
    expect(result.overlapRate).toBe(0);
    expect(result.pairs).toEqual([]);
    expect(result.uniqueCount).toBe(2);
  });

  it('두 개 이상이 가진 종목의 비중 몫이 중복률이다', () => {
    // 합친 비중: X=(50+50)/2=50, Y=25, Z=25 → 겹치는 것은 X 뿐 → 50/100
    const result = analyzeBasket([snap('A', { X: 50, Y: 50 }), snap('B', { X: 50, Z: 50 })]);
    expect(result.overlapRate).toBe(50);
    expect(result.sharedCount).toBe(1);
    expect(result.stocks[0]).toMatchObject({ key: 'X', exposure: 50 });
    expect(result.stocks[0]!.holders).toEqual([
      { ticker: 'A', weight: 50 },
      { ticker: 'B', weight: 50 }
    ]);
  });

  it('🔴 분모는 100 이 아니라 실제로 담긴 비중 합이다(잘린 꼬리가 중복률을 깎지 않는다)', () => {
    // 두 ETF 가 상위 40% 만 공개하고, 그 40% 가 완전히 같다 → 중복률 100
    const result = analyzeBasket([snap('A', { X: 20, Y: 20 }), snap('B', { X: 20, Y: 20 })]);
    expect(result.overlapRate).toBe(100);
  });

  it('겹치는 종목이 먼저, 그 안에서는 합친 비중이 큰 순이다', () => {
    const result = analyzeBasket([
      snap('A', { BIG: 70, X: 20, Y: 10 }),
      snap('B', { X: 5, Y: 30, Z: 65 })
    ]);
    expect(result.stocks.map((stock) => stock.key)).toEqual(['Y', 'X', 'BIG', 'Z']);
  });

  it('짝은 바구니 순서대로 모두 나온다', () => {
    const result = analyzeBasket([snap('A', { X: 100 }), snap('B', { X: 100 }), snap('C', { Y: 100 })]);
    expect(result.pairs.map((pair) => `${pair.a}-${pair.b}`)).toEqual(['A-B', 'A-C', 'B-C']);
  });

  it('비중이 0 이하인 행은 무시한다', () => {
    const result = analyzeBasket([snap('A', { X: 50, NEG: -5 }), snap('B', { X: 50, NEG: 0 })]);
    expect(result.stocks.map((stock) => stock.key)).toEqual(['X']);
  });
});

describe('analyzeBasket — 비중', () => {
  it('비중대로 합친다: 60/40 이면 X = 0.6×50 + 0.4×50, Y = 0.6×50, Z = 0.4×50', () => {
    const result = analyzeBasket([snap('A', { X: 50, Y: 50 }), snap('B', { X: 50, Z: 50 })], [60, 40]);
    expect(result.stocks.find((stock) => stock.key === 'X')!.exposure).toBe(50);
    expect(result.stocks.find((stock) => stock.key === 'Y')!.exposure).toBe(30);
    expect(result.stocks.find((stock) => stock.key === 'Z')!.exposure).toBe(20);
    expect(result.overlapRate).toBe(50);
  });

  it('겹치지 않는 ETF 에 비중을 몰면 중복률이 줄어든다', () => {
    const basket = [snap('A', { X: 100 }), snap('B', { X: 50, Z: 50 })];
    // 겹치는 X 의 몫 = pA×100 + pB×50, 전체 = 100 → 비중이 B 로 갈수록 줄어든다
    expect(analyzeBasket(basket, [50, 50]).overlapRate).toBe(75);
    expect(analyzeBasket(basket, [10, 90]).overlapRate).toBe(55);
  });

  it('비중 합이 100 이 아니어도 몫으로 정규화한다', () => {
    const basket = [snap('A', { X: 50, Y: 50 }), snap('B', { X: 50, Z: 50 })];
    expect(analyzeBasket(basket, [3, 2])).toEqual(analyzeBasket(basket, [60, 40]));
  });

  it('비중이 이상하면(길이 불일치·0·음수) 같은 금액으로 본다', () => {
    const basket = [snap('A', { X: 50, Y: 50 }), snap('B', { X: 50, Z: 50 })];
    const equal = analyzeBasket(basket);
    expect(analyzeBasket(basket, [1])).toEqual(equal);
    expect(analyzeBasket(basket, [0, 10])).toEqual(equal);
    expect(analyzeBasket(basket, [-1, 10])).toEqual(equal);
  });

  it('두 ETF 의 겹침(짝)은 바구니 비중과 무관하다', () => {
    const basket = [snap('A', { X: 50, Y: 50 }), snap('B', { X: 50, Z: 50 })];
    expect(analyzeBasket(basket, [90, 10]).pairs).toEqual(analyzeBasket(basket).pairs);
  });
});

describe('previewAddDelta — 담기 전 미리보기', () => {
  it('비중이 있으면 새 ETF 는 지금 비중들의 평균으로 들어간다고 본다', () => {
    const basket = [snap('A', { X: 100 }), snap('B', { Z: 100 })];
    const candidate = snap('C', { X: 100 });
    const expected =
      analyzeBasket([...basket, candidate], [80, 20, 50]).overlapRate - analyzeBasket(basket, [80, 20]).overlapRate;
    expect(previewAddDelta(basket, candidate, { weights: [80, 20] })).toBeCloseTo(expected, 2);
  });

  it('담은 뒤 중복률 − 지금 중복률(%p)', () => {
    const basket = [snap('A', { X: 50, Y: 50 }), snap('B', { Z: 100 })];
    const candidate = snap('C', { X: 50, Z: 50 });
    const expected = analyzeBasket([...basket, candidate]).overlapRate - analyzeBasket(basket).overlapRate;
    expect(previewAddDelta(basket, candidate)).toBeCloseTo(expected, 2);
    expect(previewAddDelta(basket, candidate)).toBeGreaterThan(0);
  });

  it('지금 중복률을 넘겨도 결과가 같다(후보마다 바구니를 다시 세지 않는 경로)', () => {
    const basket = [snap('A', { X: 50, Y: 50 }), snap('B', { Z: 100 })];
    const candidate = snap('C', { X: 50, Z: 50 });
    expect(previewAddDelta(basket, candidate, { currentRate: analyzeBasket(basket).overlapRate })).toBe(
      previewAddDelta(basket, candidate)
    );
  });

  it('바구니가 비었거나 이미 담긴 ETF 면 null', () => {
    const a = snap('A', { X: 100 });
    expect(previewAddDelta([], a)).toBeNull();
    expect(previewAddDelta([a], a)).toBeNull();
  });
});
