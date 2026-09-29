import { describe, expect, it } from 'vitest';
import {
  MAX_OVERLAP_ETFS,
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
});
