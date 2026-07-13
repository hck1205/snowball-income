import { describe, expect, it } from 'vitest';
import { computeAnnualGrowthRate, removeScenarioTab, reorderTabs } from '@/pages/Main/utils';
import { resolveSelectedYear } from '@/components/MonthlyCashflow';

const tabs = [{ id: 'one' }, { id: 'two' }, { id: 'three' }];

describe('reorderTabs', () => {
  it('moves a tab forward to the drop position', () => {
    expect(reorderTabs(tabs, 'one', 'three')).toEqual([{ id: 'two' }, { id: 'three' }, { id: 'one' }]);
  });

  it('moves a tab backward to the drop position', () => {
    expect(reorderTabs(tabs, 'three', 'one')).toEqual([{ id: 'three' }, { id: 'one' }, { id: 'two' }]);
  });

  it('returns null when the source and target are the same', () => {
    expect(reorderTabs(tabs, 'two', 'two')).toBeNull();
  });

  it('returns null for unknown ids', () => {
    expect(reorderTabs(tabs, 'zzz', 'one')).toBeNull();
    expect(reorderTabs(tabs, 'one', 'zzz')).toBeNull();
  });

  it('does not mutate the input array', () => {
    reorderTabs(tabs, 'one', 'three');

    expect(tabs.map((tab) => tab.id)).toEqual(['one', 'two', 'three']);
  });
});

describe('removeScenarioTab', () => {
  it('activates the left neighbour when the active tab is deleted', () => {
    const removal = removeScenarioTab({ tabs, deletingId: 'two', activeId: 'two' });

    expect(removal?.tabs.map((tab) => tab.id)).toEqual(['one', 'three']);
    expect(removal?.nextActiveTab.id).toBe('one');
  });

  it('activates the new first tab when the leftmost active tab is deleted', () => {
    const removal = removeScenarioTab({ tabs, deletingId: 'one', activeId: 'one' });

    expect(removal?.nextActiveTab.id).toBe('two');
  });

  it('keeps the active tab when a different tab is deleted', () => {
    const removal = removeScenarioTab({ tabs, deletingId: 'three', activeId: 'one' });

    expect(removal?.tabs.map((tab) => tab.id)).toEqual(['one', 'two']);
    expect(removal?.nextActiveTab.id).toBe('one');
  });

  it('returns null for an unknown tab', () => {
    expect(removeScenarioTab({ tabs, deletingId: 'zzz', activeId: 'one' })).toBeNull();
  });

  it('returns null when nothing would be left to activate', () => {
    expect(removeScenarioTab({ tabs: [{ id: 'only' }], deletingId: 'only', activeId: 'only' })).toBeNull();
  });

  it('does not mutate the input array', () => {
    removeScenarioTab({ tabs, deletingId: 'two', activeId: 'two' });

    expect(tabs.map((tab) => tab.id)).toEqual(['one', 'two', 'three']);
  });
});

describe('computeAnnualGrowthRate', () => {
  const rows = [{ value: 100 }, { value: 108 }, { value: 116.64 }];

  it('reads the growth between the first two rows', () => {
    expect(computeAnnualGrowthRate(rows, (row) => row.value)).toBeCloseTo(0.08, 10);
  });

  it('supports negative growth', () => {
    expect(computeAnnualGrowthRate([{ value: 100 }, { value: 90 }], (row) => row.value)).toBeCloseTo(-0.1, 10);
  });

  it('returns null with fewer than two rows', () => {
    expect(computeAnnualGrowthRate([], (row: { value: number }) => row.value)).toBeNull();
    expect(computeAnnualGrowthRate([{ value: 100 }], (row) => row.value)).toBeNull();
  });

  it('returns null when the base value is not positive', () => {
    expect(computeAnnualGrowthRate([{ value: 0 }, { value: 50 }], (row) => row.value)).toBeNull();
    expect(computeAnnualGrowthRate([{ value: -10 }, { value: 50 }], (row) => row.value)).toBeNull();
    expect(computeAnnualGrowthRate([{ value: Number.NaN }, { value: 50 }], (row) => row.value)).toBeNull();
  });
});

describe('resolveSelectedYear', () => {
  it('keeps the previous year while it still exists', () => {
    expect(resolveSelectedYear([2025, 2026, 2027], 2026)).toBe(2026);
  });

  it('falls back to the latest year when the previous one disappeared', () => {
    expect(resolveSelectedYear([2025, 2026], 2030)).toBe(2026);
  });

  it('picks the latest year when nothing was selected yet', () => {
    expect(resolveSelectedYear([2025, 2026], null)).toBe(2026);
  });

  it('returns null without any year', () => {
    expect(resolveSelectedYear([], 2026)).toBeNull();
    expect(resolveSelectedYear([], null)).toBeNull();
  });
});
