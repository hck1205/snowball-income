import { describe, expect, it } from 'vitest';
import { clampPercent, redistributeAllocationWeights } from '@/pages/Main/utils';

const sumOf = (map: Record<string, number>): number => Object.values(map).reduce((sum, value) => sum + value, 0);

describe('clampPercent', () => {
  it('keeps values inside the 0~100 range', () => {
    expect(clampPercent(42)).toBe(42);
    expect(clampPercent(0)).toBe(0);
    expect(clampPercent(100)).toBe(100);
  });

  it('clamps out-of-range values to the nearest bound', () => {
    expect(clampPercent(140)).toBe(100);
    expect(clampPercent(-20)).toBe(0);
  });

  it('falls back to 0 for non-finite values, including Infinity', () => {
    expect(clampPercent(Number.NaN)).toBe(0);
    expect(clampPercent(Number.POSITIVE_INFINITY)).toBe(0);
    expect(clampPercent(Number.NEGATIVE_INFINITY)).toBe(0);
  });
});

describe('redistributeAllocationWeights', () => {
  it('splits the remainder with one other mutable ticker (no fixed)', () => {
    const next = redistributeAllocationWeights({
      targetId: 'a',
      rawValue: 70,
      includedIds: ['a', 'b'],
      fixedById: {},
      percentExactById: { a: 50, b: 50 }
    });

    expect(next).toEqual({ a: 70, b: 30 });
    expect(sumOf(next)).toBeCloseTo(100, 10);
  });

  it('keeps fixed tickers untouched and spreads the rest proportionally', () => {
    const next = redistributeAllocationWeights({
      targetId: 'a',
      rawValue: 50,
      includedIds: ['a', 'b', 'c'],
      fixedById: { c: true },
      percentExactById: { a: 30, b: 30, c: 40 }
    });

    expect(next.c).toBe(40);
    expect(next.a).toBe(50);
    expect(next.b).toBeCloseTo(10, 10);
    expect(sumOf(next)).toBeCloseTo(100, 10);
  });

  it('respects the existing ratio between the other mutable tickers', () => {
    const next = redistributeAllocationWeights({
      targetId: 'a',
      rawValue: 40,
      includedIds: ['a', 'b', 'c'],
      fixedById: {},
      percentExactById: { a: 40, b: 45, c: 15 }
    });

    // remaining 60 shared 45:15 -> 3:1
    expect(next.a).toBe(40);
    expect(next.b).toBeCloseTo(45, 10);
    expect(next.c).toBeCloseTo(15, 10);
    expect(sumOf(next)).toBeCloseTo(100, 10);
  });

  it('forces the target to the whole budget when it is the only mutable ticker', () => {
    const next = redistributeAllocationWeights({
      targetId: 'a',
      rawValue: 10,
      includedIds: ['a', 'b'],
      fixedById: { b: true },
      percentExactById: { a: 60, b: 40 }
    });

    // maxTarget = 100 - 40 = 60; the slider value is ignored because nothing else can absorb the rest.
    expect(next).toEqual({ a: 60, b: 40 });
    expect(sumOf(next)).toBeCloseTo(100, 10);
  });

  it('splits equally when the other mutable tickers currently sum to 0', () => {
    const next = redistributeAllocationWeights({
      targetId: 'a',
      rawValue: 40,
      includedIds: ['a', 'b', 'c'],
      fixedById: {},
      percentExactById: { a: 100, b: 0, c: 0 }
    });

    expect(next.a).toBe(40);
    expect(next.b).toBeCloseTo(30, 10);
    expect(next.c).toBeCloseTo(30, 10);
    expect(sumOf(next)).toBeCloseTo(100, 10);
  });

  it('treats NaN slider input as 0', () => {
    const next = redistributeAllocationWeights({
      targetId: 'a',
      rawValue: Number.NaN,
      includedIds: ['a', 'b'],
      fixedById: {},
      percentExactById: { a: 50, b: 50 }
    });

    expect(next).toEqual({ a: 0, b: 100 });
    expect(sumOf(next)).toBeCloseTo(100, 10);
  });

  it('clamps slider input above 100', () => {
    const next = redistributeAllocationWeights({
      targetId: 'a',
      rawValue: 320,
      includedIds: ['a', 'b'],
      fixedById: {},
      percentExactById: { a: 50, b: 50 }
    });

    expect(next).toEqual({ a: 100, b: 0 });
    expect(sumOf(next)).toBeCloseTo(100, 10);
  });

  it('zeroes every mutable ticker when the fixed tickers already take 100%', () => {
    const next = redistributeAllocationWeights({
      targetId: 'a',
      rawValue: 80,
      includedIds: ['a', 'b', 'c'],
      fixedById: { b: true, c: true },
      percentExactById: { a: 0, b: 70, c: 30 }
    });

    expect(next).toEqual({ a: 0, b: 70, c: 30 });
    expect(sumOf(next)).toBeCloseTo(100, 10);
  });

  it('defaults missing percents to 0', () => {
    const next = redistributeAllocationWeights({
      targetId: 'a',
      rawValue: 25,
      includedIds: ['a', 'b'],
      fixedById: {},
      percentExactById: {}
    });

    expect(next).toEqual({ a: 25, b: 75 });
  });

  it('holds the invariants for every slider position', () => {
    const includedIds = ['a', 'b', 'c', 'd'];
    const fixedById = { d: true };
    const percentExactById = { a: 25, b: 30, c: 25, d: 20 };

    for (let rawValue = 0; rawValue <= 100; rawValue += 1) {
      const next = redistributeAllocationWeights({ targetId: 'a', rawValue, includedIds, fixedById, percentExactById });

      expect(sumOf(next)).toBeCloseTo(100, 10);
      expect(next.d).toBe(20);
      expect(Object.keys(next).sort()).toEqual(includedIds);
      Object.values(next).forEach((value) => expect(value).toBeGreaterThanOrEqual(0));
    }
  });

  it('does not mutate its inputs', () => {
    const fixedById = { b: true };
    const percentExactById = { a: 50, b: 50 };

    redistributeAllocationWeights({ targetId: 'a', rawValue: 10, includedIds: ['a', 'b'], fixedById, percentExactById });

    expect(fixedById).toEqual({ b: true });
    expect(percentExactById).toEqual({ a: 50, b: 50 });
  });
});
