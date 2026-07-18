import { describe, expect, it } from 'vitest';
import {
  applyTickerRemoval,
  buildTickerProfileFromDraft,
  isTickerDraftValid,
  type TickerPortfolioState
} from '@/pages/Main/utils';
import type { TickerDraft, TickerProfile } from '@/shared/types/snowball';

const draft: TickerDraft = {
  ticker: 'SCHD',
  name: 'Schwab US Dividend Equity ETF',
  initialPrice: 27,
  dividendYield: 3.6,
  dividendGrowth: 8,
  expectedTotalReturn: 10,
  frequency: 'quarterly'
};

const profile = (id: string, ticker: string): TickerProfile => ({ ...draft, id, ticker, name: '' });

const state: TickerPortfolioState = {
  tickerProfiles: [profile('a', 'SCHD'), profile('b', 'JEPI'), profile('c', 'VYM')],
  includedTickerIds: ['a', 'b', 'c'],
  weightByTickerId: { a: 50, b: 30, c: 20 },
  fixedByTickerId: { a: false, b: true, c: false },
  selectedTickerId: 'a'
};

describe('isTickerDraftValid', () => {
  it('accepts a complete draft', () => {
    expect(isTickerDraftValid(draft)).toBe(true);
  });

  it('rejects a blank ticker', () => {
    expect(isTickerDraftValid({ ...draft, ticker: '' })).toBe(false);
    expect(isTickerDraftValid({ ...draft, ticker: '   ' })).toBe(false);
  });

  it('rejects NaN in any numeric field', () => {
    expect(isTickerDraftValid({ ...draft, initialPrice: Number.NaN })).toBe(false);
    expect(isTickerDraftValid({ ...draft, dividendYield: Number.NaN })).toBe(false);
    expect(isTickerDraftValid({ ...draft, dividendGrowth: Number.NaN })).toBe(false);
    expect(isTickerDraftValid({ ...draft, expectedTotalReturn: Number.NaN })).toBe(false);
  });

  it('rejects infinite values', () => {
    expect(isTickerDraftValid({ ...draft, initialPrice: Number.POSITIVE_INFINITY })).toBe(false);
  });

  // 회귀: 새 드래프트의 기본 주가가 0 이라, 티커명만 채우고 "생성"을 누르면 티커는 만들어지는데
  // 엔진의 zod(`initialPrice.positive()`)가 폼을 거부해 결과 화면이 통째로 오류로 바뀌었다.
  // 사용자에겐 "티커를 만들었더니 결과가 사라짐"으로 보인다.
  it('rejects a price of 0 or less, matching what the engine accepts', () => {
    expect(isTickerDraftValid({ ...draft, initialPrice: 0 })).toBe(false);
    expect(isTickerDraftValid({ ...draft, initialPrice: -10 })).toBe(false);
  });

  it('rejects percentages the engine would reject', () => {
    expect(isTickerDraftValid({ ...draft, dividendYield: -1 })).toBe(false);
    expect(isTickerDraftValid({ ...draft, dividendYield: 101 })).toBe(false);
    expect(isTickerDraftValid({ ...draft, dividendGrowth: 101 })).toBe(false);
  });

  it('accepts a negative dividend growth (covered-call NAV erosion)', () => {
    expect(isTickerDraftValid({ ...draft, dividendGrowth: -5 })).toBe(true);
  });
});

describe('buildTickerProfileFromDraft', () => {
  const generateId = () => 'generated-id';

  it('generates an id when creating', () => {
    const next = buildTickerProfileFromDraft({ draft, mode: 'create', isCustomPreset: true, editingTickerId: null, generateId });

    expect(next.id).toBe('generated-id');
  });

  it('keeps the edited id instead of generating one', () => {
    const next = buildTickerProfileFromDraft({ draft, mode: 'edit', isCustomPreset: true, editingTickerId: 'existing', generateId });

    expect(next.id).toBe('existing');
  });

  it('trims the ticker symbol', () => {
    const next = buildTickerProfileFromDraft({
      draft: { ...draft, ticker: '  SCHD  ' },
      mode: 'create',
      isCustomPreset: true,
      editingTickerId: null,
      generateId
    });

    expect(next.ticker).toBe('SCHD');
  });

  it('drops the display name when creating from a preset', () => {
    const next = buildTickerProfileFromDraft({ draft, mode: 'create', isCustomPreset: false, editingTickerId: null, generateId });

    expect(next.name).toBe('');
  });

  it('keeps the trimmed display name for a custom create', () => {
    const next = buildTickerProfileFromDraft({
      draft: { ...draft, name: '  내 티커  ' },
      mode: 'create',
      isCustomPreset: true,
      editingTickerId: null,
      generateId
    });

    expect(next.name).toBe('내 티커');
  });

  it('keeps the display name when editing even from a preset', () => {
    const next = buildTickerProfileFromDraft({
      draft: { ...draft, name: '내 티커' },
      mode: 'edit',
      isCustomPreset: false,
      editingTickerId: 'existing',
      generateId
    });

    expect(next.name).toBe('내 티커');
  });
});

describe('applyTickerRemoval', () => {
  it('deletes the profile and both map entries', () => {
    const next = applyTickerRemoval(state, 'b', 'delete');

    expect(next.tickerProfiles.map((item) => item.id)).toEqual(['a', 'c']);
    expect(next.includedTickerIds).toEqual(['a', 'c']);
    expect(next.weightByTickerId).toEqual({ a: 50, c: 20 });
    expect(next.fixedByTickerId).toEqual({ a: false, c: false });
    expect(next.removedProfile?.ticker).toBe('JEPI');
  });

  it('keeps the profile and the weight when excluding', () => {
    const next = applyTickerRemoval(state, 'b', 'exclude');

    expect(next.tickerProfiles.map((item) => item.id)).toEqual(['a', 'b', 'c']);
    expect(next.includedTickerIds).toEqual(['a', 'c']);
    expect(next.weightByTickerId).toEqual({ a: 50, b: 30, c: 20 });
    // Excluding always releases the fix flag so the ticker comes back adjustable.
    expect(next.fixedByTickerId).toEqual({ a: false, b: false, c: false });
  });

  it('leaves the selection alone when another ticker is removed', () => {
    const next = applyTickerRemoval(state, 'b', 'delete');

    expect(next.selectedTickerId).toBe('a');
    expect(next.didChangeSelection).toBe(false);
    expect(next.nextSelectedProfile).toBeNull();
  });

  it('falls back to the first remaining ticker when the selected one is removed', () => {
    const next = applyTickerRemoval(state, 'a', 'delete');

    expect(next.selectedTickerId).toBe('b');
    expect(next.didChangeSelection).toBe(true);
    expect(next.nextSelectedProfile?.id).toBe('b');
  });

  it('clears the selection when the last included ticker is removed', () => {
    const single: TickerPortfolioState = {
      tickerProfiles: [profile('a', 'SCHD')],
      includedTickerIds: ['a'],
      weightByTickerId: { a: 100 },
      fixedByTickerId: { a: false },
      selectedTickerId: 'a'
    };

    const next = applyTickerRemoval(single, 'a', 'delete');

    expect(next.selectedTickerId).toBeNull();
    expect(next.didChangeSelection).toBe(true);
    expect(next.nextSelectedProfile).toBeNull();
  });

  it('reports no removed profile for an unknown id', () => {
    const next = applyTickerRemoval(state, 'zzz', 'delete');

    expect(next.removedProfile).toBeNull();
    expect(next.includedTickerIds).toEqual(['a', 'b', 'c']);
    expect(next.selectedTickerId).toBe('a');
  });

  it('does not mutate the input state', () => {
    applyTickerRemoval(state, 'a', 'delete');

    expect(state.tickerProfiles).toHaveLength(3);
    expect(state.includedTickerIds).toEqual(['a', 'b', 'c']);
    expect(state.weightByTickerId).toEqual({ a: 50, b: 30, c: 20 });
    expect(state.fixedByTickerId).toEqual({ a: false, b: true, c: false });
  });
});
