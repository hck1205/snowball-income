import { describe, expect, it } from 'vitest';
import {
  MAX_OVERLAP_ETFS,
  OVERLAP_DEFAULT_WEIGHT,
  browseEtfUniverse,
  deltaTone,
  nextOverlapWeight,
  normalizeOverlapBasket,
  overlapBasketParams,
  overlapShares,
  formatDelta,
  formatPercent,
  normalizeOverlapSelection,
  overlapLevel,
  searchEtfUniverse
} from '@/pages/Ticker/utils';

const entries = [
  { ticker: 'SCHD', name: 'Schwab US Dividend Equity ETF', hasHoldings: true },
  { ticker: 'SCHG', name: 'Schwab US Large-Cap Growth ETF', hasHoldings: true },
  { ticker: 'SCH', name: 'Some Other ETF', hasHoldings: false },
  { ticker: 'DIVO', name: 'Amplify CWP Enhanced Dividend Income ETF', hasHoldings: false },
  { ticker: 'VIG', name: 'Vanguard Dividend Appreciation ETF', hasHoldings: true }
];

describe('normalizeOverlapSelection', () => {
  it('대문자로 맞추고, 중복·이상한 값을 버리고, 정원에서 자른다', () => {
    expect(normalizeOverlapSelection(['schd', ' VOO ', 'SCHD', '', '<x>'])).toEqual(['SCHD', 'VOO']);
    expect(normalizeOverlapSelection(['A', 'B', 'C', 'D', 'E', 'F', 'G'])).toHaveLength(MAX_OVERLAP_ETFS);
  });
});

describe('normalizeOverlapBasket — 티커와 비중은 짝으로 걸러진다', () => {
  it('버려진 티커의 비중도 함께 버린다(뒤의 짝이 밀리지 않는다)', () => {
    expect(normalizeOverlapBasket(['SCHD', 'SCHD', '<x>', 'VOO'], ['60', '10', '20', '40'])).toEqual({
      tickers: ['SCHD', 'VOO'],
      weights: [60, 40]
    });
  });

  it('비중이 없거나 이상하면 그 ETF 만 기본값이고, 눈금에 맞춰 자른다', () => {
    expect(normalizeOverlapBasket(['A', 'B', 'C', 'D'], ['abc', '-3', '999', '42'])).toEqual({
      tickers: ['A', 'B', 'C', 'D'],
      weights: [OVERLAP_DEFAULT_WEIGHT, OVERLAP_DEFAULT_WEIGHT, 100, 40]
    });
    expect(normalizeOverlapBasket(['A']).weights).toEqual([OVERLAP_DEFAULT_WEIGHT]);
  });

  it('URL 로 썼다 다시 읽으면 같은 바구니다(왕복)', () => {
    const basket = { tickers: ['SCHD', 'QQQ'], weights: [70, 30] };
    const params = overlapBasketParams(basket);
    expect(normalizeOverlapBasket(params.t!.split(','), params.w!.split(','))).toEqual(basket);
  });

  it('모두 기본값이면 w 를 싣지 않는다 — 예전(비중 없는) 링크와 같은 모양', () => {
    expect(overlapBasketParams({ tickers: ['A', 'B'], weights: [50, 50] })).toEqual({ t: 'A,B' });
    expect(overlapBasketParams({ tickers: [], weights: [] })).toEqual({});
  });
});

describe('비중 보조', () => {
  it('새로 담는 ETF 는 지금 비중들의 평균이다', () => {
    expect(nextOverlapWeight([])).toBe(OVERLAP_DEFAULT_WEIGHT);
    expect(nextOverlapWeight([80, 20])).toBe(50);
    expect(nextOverlapWeight([100, 30])).toBe(65);
  });

  it('몫은 합이 정확히 100.0 이다(반올림 차이는 가장 큰 몫이 진다)', () => {
    expect(overlapShares([50, 50, 50])).toEqual([33.4, 33.3, 33.3]);
    expect(overlapShares([60, 40])).toEqual([60, 40]);
    expect(overlapShares([])).toEqual([]);
  });
});

describe('browseEtfUniverse — 검색어 없이 보는 전체 목록', () => {
  it('많이 찾는 ETF(그 순서) → 담을 수 있는 나머지 → 담을 수 없는 것 순이다', () => {
    const list = browseEtfUniverse(entries, ['VIG', 'SCHD'], { onlyWithHoldings: false });
    expect(list.map((entry) => entry.ticker)).toEqual(['VIG', 'SCHD', 'SCHG', 'DIVO', 'SCH']);
  });

  it('담을 수 있는 것만 켜면 보유 종목이 없는 ETF 를 뺀다', () => {
    const list = browseEtfUniverse(entries, ['VIG'], { onlyWithHoldings: true });
    expect(list.map((entry) => entry.ticker)).toEqual(['VIG', 'SCHD', 'SCHG']);
  });
});

describe('searchEtfUniverse', () => {
  it('정확한 티커 → 티커 앞부분 → 이름 순이고, 같은 단계에서는 담을 수 있는 것이 먼저다', () => {
    expect(searchEtfUniverse(entries, 'sch').map((entry) => entry.ticker)).toEqual(['SCH', 'SCHD', 'SCHG']);
    expect(searchEtfUniverse(entries, 'dividend').map((entry) => entry.ticker)).toEqual(['SCHD', 'VIG', 'DIVO']);
  });

  it('빈 검색어는 결과가 없다(목록은 호출부가 인기 ETF 로 채운다)', () => {
    expect(searchEtfUniverse(entries, '  ')).toEqual([]);
  });

  it('결과 수를 제한한다', () => {
    expect(searchEtfUniverse(entries, 'etf', 2)).toHaveLength(2);
  });
});

describe('overlapLevel', () => {
  it('바구니 크기와 중복률로 단계를 정한다', () => {
    expect(overlapLevel(0, 0)).toBe('none');
    expect(overlapLevel(0, 1)).toBe('single');
    expect(overlapLevel(10, 2)).toBe('low');
    expect(overlapLevel(25, 2)).toBe('medium');
    expect(overlapLevel(50, 3)).toBe('high');
  });
});

describe('표기', () => {
  it('부호를 글자로 붙인다', () => {
    expect(formatDelta(3.24)).toBe('+3.2');
    expect(formatDelta(-1)).toBe('−1.0');
    expect(formatDelta(0.04)).toBe('0.0');
    expect(formatPercent(33.333)).toBe('33.3');
  });

  it('방향은 글자와 같은 반올림으로 정한다 — 0.0 이라 쓰면서 늘었다고 칠하지 않는다', () => {
    expect(deltaTone(0.04)).toBe('flat');
    expect(deltaTone(0.05)).toBe('up');
    expect(deltaTone(-2)).toBe('down');
  });
});
