import { describe, expect, it } from 'vitest';
import { formatChangePercent } from '@/shared/utils';

// `clampPercent` 는 test/main/allocation.test.ts 가 이미 덮는다 — 여기서 중복하지 않는다.

describe('formatChangePercent — 전일 대비 변동률 단일 포맷터', () => {
  it('상승/하락은 부호를 붙이고 절댓값을 소수 2자리로 찍는다', () => {
    expect(formatChangePercent({ percent: 0.15, direction: 'up' })).toBe('+0.15%');
    expect(formatChangePercent({ percent: -4.81, direction: 'down' })).toBe('-4.81%');
    expect(formatChangePercent({ percent: 0.5, direction: 'up' })).toBe('+0.50%');
  });

  it('보합은 부호 없이 0.00%', () => {
    expect(formatChangePercent({ percent: 0, direction: 'flat' })).toBe('0.00%');
  });

  it('음의 0 도 부호 없는 0.00% 로 눕는다 (부호는 direction 에서만 뽑기 때문)', () => {
    expect(formatChangePercent({ percent: -0, direction: 'flat' })).toBe('0.00%');
  });

  it('반올림 안 된 원값(IndexChange)도 direction 이 방향을 쥐므로 표시가 어긋나지 않는다', () => {
    // shared/lib/marketIndices 의 IndexChange 는 원값을 담고 direction 만 표시 정밀도 기준이다.
    expect(formatChangePercent({ percent: -0.0031, direction: 'flat' })).toBe('0.00%');
    expect(formatChangePercent({ percent: 0.7349, direction: 'up' })).toBe('+0.73%');
  });
});
