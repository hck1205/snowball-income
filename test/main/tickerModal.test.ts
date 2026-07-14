import { describe, expect, it } from 'vitest';
import {
  buildTickerSearchRows,
  filterPresetKeys,
  isCustomTickerInput,
  isTickerCreateDisabled,
  parseNumericInputOrNaN,
  scoreTickerSearch,
  sortPresetKeys,
  toTotalReturnCaption,
  withDerivedTotalReturn
} from '@/pages/Main/components/TickerModal';
import type { PresetTickerKey } from '@/shared/constants';
import type { TickerDraft } from '@/shared/types/snowball';

const draft: TickerDraft = {
  ticker: 'SCHD',
  name: '',
  initialPrice: 27,
  dividendYield: 3.6,
  dividendGrowth: 8,
  expectedTotalReturn: 10,
  frequency: 'quarterly'
};

const presetTickers = {
  JEPI: { ...draft, ticker: 'JEPI', name: 'JPMorgan Equity Premium Income ETF' },
  SCHD: { ...draft, ticker: 'SCHD', name: 'Schwab US Dividend Equity ETF' },
  VYM: { ...draft, ticker: 'VYM', name: 'Vanguard High Dividend Yield ETF' }
} as unknown as Record<PresetTickerKey, TickerDraft>;

const koreanNameByTicker = {
  JEPI: 'JP모건 프리미엄 인컴',
  SCHD: '슈왑 배당주',
  VYM: '뱅가드 고배당'
} as unknown as Record<PresetTickerKey, string>;

const presetKeys = ['JEPI', 'SCHD', 'VYM'] as unknown as PresetTickerKey[];

describe('parseNumericInputOrNaN', () => {
  it('turns an empty input into NaN so the field can stay blank', () => {
    expect(parseNumericInputOrNaN('')).toBeNaN();
  });

  it('parses numeric text', () => {
    expect(parseNumericInputOrNaN('12.5')).toBe(12.5);
    expect(parseNumericInputOrNaN('0')).toBe(0);
    expect(parseNumericInputOrNaN('-3')).toBe(-3);
  });
});

describe('isCustomTickerInput', () => {
  it('is true only while creating a custom ticker', () => {
    expect(isCustomTickerInput('create', 'custom')).toBe(true);
    expect(isCustomTickerInput('create', 'SCHD' as PresetTickerKey)).toBe(false);
    expect(isCustomTickerInput('edit', 'custom')).toBe(false);
  });
});

describe('isTickerCreateDisabled', () => {
  it('allows a complete custom draft', () => {
    expect(isTickerCreateDisabled({ mode: 'create', selectedPreset: 'custom', tickerDraft: draft })).toBe(false);
  });

  it('blocks a blank ticker symbol', () => {
    expect(isTickerCreateDisabled({ mode: 'create', selectedPreset: 'custom', tickerDraft: { ...draft, ticker: '  ' } })).toBe(true);
  });

  it('blocks a blank numeric field', () => {
    expect(
      isTickerCreateDisabled({ mode: 'create', selectedPreset: 'custom', tickerDraft: { ...draft, dividendYield: Number.NaN } })
    ).toBe(true);
  });

  it('never blocks preset or edit mode', () => {
    expect(
      isTickerCreateDisabled({ mode: 'create', selectedPreset: 'SCHD' as PresetTickerKey, tickerDraft: { ...draft, ticker: '' } })
    ).toBe(false);
    expect(isTickerCreateDisabled({ mode: 'edit', selectedPreset: 'custom', tickerDraft: { ...draft, ticker: '' } })).toBe(false);
  });
});

describe('sortPresetKeys', () => {
  it('sorts by display label', () => {
    expect(sortPresetKeys(presetTickers)).toEqual(['JEPI', 'SCHD', 'VYM']);
  });
});

describe('filterPresetKeys', () => {
  it('returns every key for a blank keyword', () => {
    expect(filterPresetKeys({ presetKeys, presetTickers, koreanNameByTicker, keyword: '   ' })).toEqual(presetKeys);
  });

  it('matches the ticker symbol case-insensitively', () => {
    expect(filterPresetKeys({ presetKeys, presetTickers, koreanNameByTicker, keyword: 'schd' })).toEqual(['SCHD']);
  });

  it('matches the english display name', () => {
    expect(filterPresetKeys({ presetKeys, presetTickers, koreanNameByTicker, keyword: 'vanguard' })).toEqual(['VYM']);
  });

  it('matches the korean name', () => {
    expect(filterPresetKeys({ presetKeys, presetTickers, koreanNameByTicker, keyword: '고배당' })).toEqual(['VYM']);
  });

  it('returns nothing when no preset matches', () => {
    expect(filterPresetKeys({ presetKeys, presetTickers, koreanNameByTicker, keyword: 'zzz' })).toEqual([]);
  });
});

describe('buildTickerSearchRows', () => {
  it('uppercases tickers and keeps the primary entry on conflict', () => {
    const rows = buildTickerSearchRows({ schd: { name: 'Primary SCHD' } }, { SCHD: { name: 'Secondary SCHD' }, vym: { name: 'VYM' } });

    expect(rows).toEqual([
      { ticker: 'SCHD', name: 'Primary SCHD', issuer: '', tickerUpper: 'SCHD', nameUpper: 'PRIMARY SCHD' },
      { ticker: 'VYM', name: 'VYM', issuer: '', tickerUpper: 'VYM', nameUpper: 'VYM' }
    ]);
  });
});

describe('scoreTickerSearch', () => {
  const rows = buildTickerSearchRows(
    {
      SCHD: { name: 'Schwab US Dividend Equity ETF' },
      SCH: { name: 'Prefix row' },
      VSCHD: { name: 'Contains row' },
      DHCS: { name: 'Anagram row' },
      ZZZZ: { name: 'Unrelated row' }
    },
    {}
  );

  it('returns nothing for a blank keyword', () => {
    expect(scoreTickerSearch({ rows, keyword: '', maxResults: 10 })).toEqual([]);
  });

  it('ranks exact, prefix, then substring matches', () => {
    const results = scoreTickerSearch({ rows, keyword: 'schd', maxResults: 10 });

    expect(results.map((row) => row.ticker).slice(0, 2)).toEqual(['SCHD', 'VSCHD']);
    expect(results[0].score).toBeGreaterThan(results[1].score);
  });

  it('keeps character-only hits but ranks them below real matches', () => {
    const results = scoreTickerSearch({ rows, keyword: 'schd', maxResults: 10 });
    const anagram = results.find((row) => row.ticker === 'DHCS');
    const exact = results.find((row) => row.ticker === 'SCHD');

    expect(anagram).toBeDefined();
    expect(anagram?.score).toBeLessThan(exact?.score ?? 0);
  });

  it('drops rows that share no character with the keyword', () => {
    const results = scoreTickerSearch({ rows, keyword: 'schd', maxResults: 10 });

    expect(results.map((row) => row.ticker)).not.toContain('ZZZZ');
  });

  it('respects the result cap', () => {
    expect(scoreTickerSearch({ rows, keyword: 'S', maxResults: 2 })).toHaveLength(2);
  });
});

describe('withDerivedTotalReturn', () => {
  it('총수익률을 배당률 + 배당 성장률로 다시 계산한다', () => {
    expect(withDerivedTotalReturn({ ...draft, dividendYield: 3.34, dividendGrowth: 6.66 }).expectedTotalReturn).toBe(10);
  });

  it('음의 배당 성장률(커버드콜)도 반영한다', () => {
    expect(withDerivedTotalReturn({ ...draft, dividendYield: 10, dividendGrowth: -3 }).expectedTotalReturn).toBe(7);
  });

  it('드래프트에 이미 들어 있던 총수익률 값을 신뢰하지 않고 덮어쓴다', () => {
    // 총수익률은 입력이 아니라 파생값이다.
    const stale = { ...draft, dividendYield: 3, dividendGrowth: 5, expectedTotalReturn: 999 };

    expect(withDerivedTotalReturn(stale).expectedTotalReturn).toBe(8);
  });

  it('입력이 비어 있으면(NaN) 총수익률도 NaN 이다', () => {
    expect(withDerivedTotalReturn({ ...draft, dividendYield: Number.NaN }).expectedTotalReturn).toBeNaN();
  });
});

describe('toTotalReturnCaption', () => {
  it('총수익률 분해를 문장으로 보여준다', () => {
    expect(toTotalReturnCaption({ ...draft, dividendYield: 3.34, dividendGrowth: 6.66 })).toBe(
      '총수익률 10% (배당 3.34% + 성장 6.66%)'
    );
  });

  it('음의 성장률도 그대로 보여준다', () => {
    expect(toTotalReturnCaption({ ...draft, dividendYield: 10, dividendGrowth: -3 })).toBe('총수익률 7% (배당 10% + 성장 -3%)');
  });

  it('값이 비어 있으면 캡션을 감춘다', () => {
    expect(toTotalReturnCaption({ ...draft, dividendGrowth: Number.NaN })).toBeNull();
  });
});
