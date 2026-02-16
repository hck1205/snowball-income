import { describe, expect, it } from 'vitest';
import { shouldDeleteLegacyState } from '@/jotai/snowball/persistence/appStateStorage';

describe('shouldDeleteLegacyState', () => {
  const cutoffAt = Date.parse('2026-02-16T02:30:00.000Z');

  it('deletes records saved before cutoff', () => {
    expect(shouldDeleteLegacyState(cutoffAt - 1)).toBe(true);
  });

  it('keeps records saved at or after cutoff', () => {
    expect(shouldDeleteLegacyState(cutoffAt)).toBe(false);
    expect(shouldDeleteLegacyState(cutoffAt + 1)).toBe(false);
  });

  it('deletes records when timestamp is invalid', () => {
    expect(shouldDeleteLegacyState(undefined)).toBe(true);
    expect(shouldDeleteLegacyState('not-a-number')).toBe(true);
    expect(shouldDeleteLegacyState(0)).toBe(true);
  });
});
