import { describe, expect, it } from 'vitest';
import { DIVIDEND_UNIVERSE, type PresetTickerKey } from '@/shared/constants';
import type { TickerDraft } from '@/shared/types/snowball';
import type { PresetFilterState } from './PresetFilterPanel.types';
import {
  DIVIDEND_YIELD_CAP,
  EMPTY_FILTER_STATE,
  EXPECTED_TOTAL_RETURN_CAP,
  applyPresetFilters,
  buildActiveFilterTags,
  countActiveFilters,
  createInitialFilterState,
  derivePresetRanges,
  isDividendYieldActive,
  isExpectedTotalReturnActive,
  isFrequencyActive,
  isPriceActive
} from './PresetFilterPanel.utils';

const makeDraft = (draft: Partial<TickerDraft> & { ticker: string }): TickerDraft => ({
  name: draft.ticker,
  initialPrice: 100,
  dividendYield: 3,
  dividendGrowth: 3,
  // applyPresetFilters 는 저장된 expectedTotalReturn 을 믿지 않고 dy+dg 로 파생 판정한다.
  expectedTotalReturn: 6,
  frequency: 'monthly',
  ...draft
});

// 경계·캡·AND 를 결정적으로 관찰하기 위한 소량 픽스처.
const FIXTURE = {
  A: makeDraft({ ticker: 'A', initialPrice: 10, dividendYield: 2, dividendGrowth: 3, frequency: 'monthly' }), // etr 5
  B: makeDraft({ ticker: 'B', initialPrice: 50, dividendYield: 4, dividendGrowth: 6, frequency: 'quarterly' }), // etr 10
  C: makeDraft({ ticker: 'C', initialPrice: 100, dividendYield: 10, dividendGrowth: -2, frequency: 'monthly' }), // etr 8
  D: makeDraft({ ticker: 'D', initialPrice: 20, dividendYield: 40, dividendGrowth: -30, frequency: 'monthly' }), // etr 10, 커버드콜 40%
  E: makeDraft({ ticker: 'E', initialPrice: 30, dividendYield: 20, dividendGrowth: 10, frequency: 'annual' }) // etr 30
} as unknown as Record<PresetTickerKey, TickerDraft>;

const KEYS = ['A', 'B', 'C', 'D', 'E'] as unknown as PresetTickerKey[];
const RANGES = derivePresetRanges(FIXTURE);

/** RANGES 를 기반으로 한 초기(전량 통과) 상태에 부분 덮어쓰기. */
const filterWith = (overrides: Partial<PresetFilterState>): PresetFilterState => ({
  ...createInitialFilterState(RANGES),
  ...overrides
});

const apply = (filter: PresetFilterState) => applyPresetFilters(KEYS, FIXTURE, filter);

describe('derivePresetRanges', () => {
  it('주가는 데이터 min/max 를 floor/ceil, 배당률·기대총수익률은 캡 상수를 상한으로 쓴다', () => {
    expect(RANGES).toEqual({
      dyMin: 0,
      dyMax: DIVIDEND_YIELD_CAP,
      priceMin: 10,
      priceMax: 100,
      etrMin: 0,
      etrMax: EXPECTED_TOTAL_RETURN_CAP
    });
  });
});

describe('applyPresetFilters — 빈 필터', () => {
  it('EMPTY_FILTER_STATE 는 전량 통과한다', () => {
    expect(apply(EMPTY_FILTER_STATE)).toEqual(KEYS);
  });

  it('createInitialFilterState 도 전량 통과한다', () => {
    expect(apply(createInitialFilterState(RANGES))).toEqual(KEYS);
  });
});

describe('applyPresetFilters — 배당률 경계(포함)', () => {
  it('값 == min, 값 == max 는 통과한다(포함 경계)', () => {
    // dyMin=4, dyMax=10 → 정확히 4(B) 와 정확히 10(C) 이 포함되어야 한다.
    expect(apply(filterWith({ dyMin: 4, dyMax: 10 }))).toEqual(['B', 'C'] as unknown as PresetTickerKey[]);
  });

  it('min-ε 는 배제된다(하한 미만)', () => {
    // dyMin=4.01 → yield 4(B) 는 탈락, 10(C) 만 남는다.
    expect(apply(filterWith({ dyMin: 4.01, dyMax: 10 }))).toEqual(['C'] as unknown as PresetTickerKey[]);
  });

  it('max+ε 는 배제된다(상한 초과)', () => {
    // dyMax=9.99(캡 미만이라 상한 제약 유효) → yield 10(C) 탈락, 4(B) 만 남는다.
    expect(apply(filterWith({ dyMin: 4, dyMax: 9.99 }))).toEqual(['B'] as unknown as PresetTickerKey[]);
  });
});

describe('applyPresetFilters — 20% 배당률 캡', () => {
  it('dyMax=20(캡) 이면 상한 무제약 → 40% 커버드콜(D)이 포함된다', () => {
    expect(apply(filterWith({ dyMax: DIVIDEND_YIELD_CAP }))).toContain('D' as unknown as PresetTickerKey);
  });

  it('dyMax=19.5(캡 미만) 이면 상한이 살아 20%+ 종목(D,E)이 배제된다', () => {
    const result = apply(filterWith({ dyMax: 19.5 }));
    expect(result).not.toContain('D' as unknown as PresetTickerKey);
    expect(result).not.toContain('E' as unknown as PresetTickerKey);
    expect(result).toContain('C' as unknown as PresetTickerKey);
  });
});

describe('applyPresetFilters — 25% 기대총수익률 캡', () => {
  it('etrMax=25(캡) 이면 상한 무제약 → etr 30(E)이 포함된다', () => {
    expect(apply(filterWith({ etrMax: EXPECTED_TOTAL_RETURN_CAP }))).toContain('E' as unknown as PresetTickerKey);
  });

  it('etrMax=24.5(캡 미만) 이면 etr 30(E)이 배제된다', () => {
    const result = apply(filterWith({ etrMax: 24.5 }));
    expect(result).not.toContain('E' as unknown as PresetTickerKey);
    // 나머지(etr <= 10)는 그대로 남는다.
    expect(result).toEqual(['A', 'B', 'C', 'D'] as unknown as PresetTickerKey[]);
  });
});

describe('applyPresetFilters — 주기 멀티토글(OR)', () => {
  it('빈 배열이면 주기 제약 없음(전량)', () => {
    expect(apply(filterWith({ frequencies: [] }))).toEqual(KEYS);
  });

  it("['monthly'] 는 월배당만 통과한다", () => {
    expect(apply(filterWith({ frequencies: ['monthly'] }))).toEqual(['A', 'C', 'D'] as unknown as PresetTickerKey[]);
  });

  it("['monthly','quarterly'] 는 OR 로 둘 다 통과한다", () => {
    expect(apply(filterWith({ frequencies: ['monthly', 'quarterly'] }))).toEqual(
      ['A', 'B', 'C', 'D'] as unknown as PresetTickerKey[]
    );
  });
});

describe('applyPresetFilters — AND 결합', () => {
  it('배당률 ∩ 주가 ∩ 주기가 모두 만족해야 통과한다', () => {
    // dy 3~12(B,C) ∩ price<=60(B) ∩ quarterly(B) → B 만.
    expect(
      apply(filterWith({ dyMin: 3, dyMax: 12, priceMax: 60, frequencies: ['quarterly'] }))
    ).toEqual(['B'] as unknown as PresetTickerKey[]);
  });

  it('4개 축을 동시에 좁히면 빈 교집합(0개)이 된다', () => {
    // dy 4~10 → {B,C}; price<=60 → C 탈락; monthly → B(quarterly) 탈락 ⇒ []
    expect(
      apply(filterWith({ dyMin: 4, dyMax: 10, priceMax: 60, frequencies: ['monthly'] }))
    ).toEqual([]);
  });
});

describe('applyPresetFilters — NaN 필드 스킵', () => {
  it('배당률이 NaN 인 종목은 배당률 축 판정을 건너뛰고 통과한다', () => {
    const withNaN = {
      ...FIXTURE,
      F: makeDraft({ ticker: 'F', initialPrice: 15, dividendYield: Number.NaN, dividendGrowth: 5, frequency: 'monthly' })
    } as unknown as Record<PresetTickerKey, TickerDraft>;
    const keys = ['F'] as unknown as PresetTickerKey[];

    // dyMin=5 인데도 NaN 배당률은 하한 판정을 건너뛰어 통과.
    expect(applyPresetFilters(keys, withNaN, filterWith({ dyMin: 5 }))).toEqual(keys);
  });
});

describe('isXActive / countActiveFilters', () => {
  it('초기 상태는 어떤 축도 활성이 아니다(0개)', () => {
    const initial = createInitialFilterState(RANGES);
    expect(isDividendYieldActive(initial)).toBe(false);
    expect(isPriceActive(initial, RANGES)).toBe(false);
    expect(isExpectedTotalReturnActive(initial)).toBe(false);
    expect(isFrequencyActive(initial)).toBe(false);
    expect(countActiveFilters(initial, RANGES)).toBe(0);
  });

  it('주가 활성 판정은 데이터 범위(ranges)에 의존한다', () => {
    const narrowed = filterWith({ priceMax: 60 });
    // ranges.priceMax(100) 보다 좁으므로 활성.
    expect(isPriceActive(narrowed, RANGES)).toBe(true);
    // 같은 필터라도 데이터 범위가 더 좁으면(예: max 60) 활성이 아니다.
    expect(isPriceActive(narrowed, { ...RANGES, priceMax: 60 })).toBe(false);
  });

  it('여러 축을 좁히면 활성 개수가 그만큼 는다', () => {
    const three = filterWith({ dyMax: 10, priceMax: 60, frequencies: ['monthly'] });
    expect(countActiveFilters(three, RANGES)).toBe(3);

    const four = filterWith({ dyMax: 10, priceMax: 60, etrMax: 20, frequencies: ['monthly'] });
    expect(countActiveFilters(four, RANGES)).toBe(4);
  });
});

describe('buildActiveFilterTags', () => {
  it('활성 필터가 없으면 태그도 없다', () => {
    expect(buildActiveFilterTags(createInitialFilterState(RANGES), RANGES)).toEqual([]);
  });

  it('캡값 상한은 "N%+" 로 라벨링한다', () => {
    const tags = buildActiveFilterTags(filterWith({ dyMin: 5, etrMin: 3 }), RANGES);
    const dividend = tags.find((tag) => tag.id === 'dividendYield');
    const totalReturn = tags.find((tag) => tag.id === 'expectedTotalReturn');
    expect(dividend?.label).toBe('배당률 5% ~ 20%+');
    expect(totalReturn?.label).toBe('기대총수익률 3% ~ 25%+');
  });

  it('tag.clear 는 그 축만 초기화하고 다른 축은 보존한다', () => {
    const state = filterWith({ dyMin: 5, dyMax: 12, priceMax: 60, frequencies: ['monthly'] });
    const tags = buildActiveFilterTags(state, RANGES);
    const dividendTag = tags.find((tag) => tag.id === 'dividendYield');
    expect(dividendTag).toBeDefined();

    const cleared = dividendTag!.clear(state);
    // 배당률만 리셋.
    expect(cleared.dyMin).toBe(0);
    expect(cleared.dyMax).toBe(DIVIDEND_YIELD_CAP);
    // 나머지 축은 불변.
    expect(cleared.priceMax).toBe(60);
    expect(cleared.frequencies).toEqual(['monthly']);
  });

  it('price 태그의 clear 는 주가를 데이터 범위로 되돌린다', () => {
    const state = filterWith({ priceMin: 20, priceMax: 60 });
    const priceTag = buildActiveFilterTags(state, RANGES).find((tag) => tag.id === 'price');
    const cleared = priceTag!.clear(state);
    expect(cleared.priceMin).toBe(RANGES.priceMin);
    expect(cleared.priceMax).toBe(RANGES.priceMax);
  });
});

describe('실제 프리셋 데이터 스모크', () => {
  const universe = DIVIDEND_UNIVERSE as unknown as Record<PresetTickerKey, TickerDraft>;
  const allKeys = Object.keys(universe) as PresetTickerKey[];

  it('빈 필터는 실제 프리셋을 전량 통과시킨다', () => {
    expect(applyPresetFilters(allKeys, universe, EMPTY_FILTER_STATE)).toEqual(allKeys);
  });

  it('월배당 필터는 실제 프리셋의 부분집합을 남긴다', () => {
    const ranges = derivePresetRanges(universe);
    const monthlyOnly = applyPresetFilters(allKeys, universe, {
      ...createInitialFilterState(ranges),
      frequencies: ['monthly']
    });
    expect(monthlyOnly.length).toBeGreaterThan(0);
    expect(monthlyOnly.length).toBeLessThan(allKeys.length);
    expect(monthlyOnly.every((key) => universe[key].frequency === 'monthly')).toBe(true);
  });

  it('derivePresetRanges 는 실제 주가에서 유한한 범위를 뽑는다', () => {
    const ranges = derivePresetRanges(universe);
    expect(Number.isFinite(ranges.priceMin)).toBe(true);
    expect(Number.isFinite(ranges.priceMax)).toBe(true);
    expect(ranges.priceMin).toBeLessThanOrEqual(ranges.priceMax);
    expect(ranges.dyMax).toBe(DIVIDEND_YIELD_CAP);
    expect(ranges.etrMax).toBe(EXPECTED_TOTAL_RETURN_CAP);
  });
});
