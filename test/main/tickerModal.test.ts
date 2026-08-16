// @vitest-environment node — DOM 을 쓰지 않는 순수 테스트 (기준: vitest.config.ts)
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
import { DIVIDEND_UNIVERSE, PRESET_TICKER_KOREAN_NAME_BY_TICKER, type PresetTickerKey } from '@/shared/constants';
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

  /**
   * 🔴 한글명 맵은 **손으로 채우는 목록**이라 프리셋을 추가하고 빠뜨릴 수 있다. 타입은
   * `Record<PresetTickerKey, string>` 이라 항상 있는 것처럼 보이지만 런타임엔 `undefined` 가 오고,
   * 그대로 `toUpperCase()` 를 부르면 **프리셋 검색 전체가 죽는다**(빈 목록이 아니라 예외).
   * 잘 안 알려진 종목까지 한글 음차를 지어내는 것보다 없는 채로 두는 편이 낫고, 그러려면 여기가 견뎌야 한다.
   */
  it('한글명이 없는 프리셋이 섞여 있어도 검색이 죽지 않는다', () => {
    const withMissingKorean = { ...koreanNameByTicker } as Record<PresetTickerKey, string>;
    delete (withMissingKorean as Record<string, string>).SCHD;

    expect(() =>
      filterPresetKeys({ presetKeys, presetTickers, koreanNameByTicker: withMissingKorean, keyword: 'schd' })
    ).not.toThrow();
    // 티커·영문명 매칭은 그대로 살아 있다.
    expect(filterPresetKeys({ presetKeys, presetTickers, koreanNameByTicker: withMissingKorean, keyword: 'schd' })).toEqual([
      'SCHD'
    ]);
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

  it('공백을 무시하고도 매칭한다 ("리얼티인컴" 으로 "리얼티 인컴" 이 걸리듯)', () => {
    // '뱅가드 고배당'(공백 포함) 이 '뱅가드고배당'(공백 없음) 검색어로도 걸려야 한다.
    expect(filterPresetKeys({ presetKeys, presetTickers, koreanNameByTicker, keyword: '뱅가드고배당' })).toEqual(['VYM']);
    // JP모건 프리미엄 인컴 → '프리미엄인컴' 으로도.
    expect(filterPresetKeys({ presetKeys, presetTickers, koreanNameByTicker, keyword: '프리미엄인컴' })).toEqual(['JEPI']);
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

/**
 * 실제 유니버스로 도는 검색 테스트.
 *
 * 🔴 프리셋 검색이 훑는 것은 **티커·영문명·한글명 셋뿐**이다(`filterPresetKeys`). 레버리지 종목은
 *    사용자가 티커를 외우고 오기보다 "레버리지"·"3배"로 훑으므로, 그 낱말이 한글명에 없으면 목록에
 *    있어도 **찾을 수 없다**. 한글명에서 접미사를 떼는 순간 이 테스트가 빨개진다.
 */
describe('레버리지 프리셋 검색 (실제 유니버스)', () => {
  const universe = DIVIDEND_UNIVERSE as unknown as Record<PresetTickerKey, TickerDraft>;
  const allKeys = Object.keys(universe) as PresetTickerKey[];
  const search = (keyword: string): PresetTickerKey[] =>
    filterPresetKeys({
      presetKeys: allKeys,
      presetTickers: universe,
      koreanNameByTicker: PRESET_TICKER_KOREAN_NAME_BY_TICKER,
      keyword
    });

  it('티커로 찾는다', () => {
    expect(search('qld')).toContain('QLD');
  });

  it('"레버리지" 로 레버리지 종목 전량이 걸린다', () => {
    expect(search('레버리지').sort()).toEqual(['QLD', 'SOXL', 'SPXL', 'SSO', 'TNA', 'TQQQ', 'UPRO', 'USD']);
  });

  it('"3배" 로 3배 종목만 걸린다', () => {
    expect(search('3배').sort()).toEqual(['SOXL', 'SPXL', 'TNA', 'TQQQ', 'UPRO']);
  });
});
