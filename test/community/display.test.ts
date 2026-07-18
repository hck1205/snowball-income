import { describe, expect, it } from 'vitest';
import { formatCompactCount, formatRelativeTime, getAvatarInitial } from '@/shared/lib/community';

/** now를 주입해 결정적으로 검증한다. */
describe('formatRelativeTime', () => {
  const now = new Date('2026-07-15T12:00:00Z');
  const ago = (seconds: number) => new Date(now.getTime() - seconds * 1000).toISOString();

  it('1분 미만은 "방금 전"', () => {
    expect(formatRelativeTime(ago(10), now)).toBe('방금 전');
    expect(formatRelativeTime(ago(59), now)).toBe('방금 전');
  });

  it('분/시간/일/주/개월/년 단위로 표기한다', () => {
    expect(formatRelativeTime(ago(5 * 60), now)).toBe('5분 전');
    expect(formatRelativeTime(ago(3 * 3600), now)).toBe('3시간 전');
    expect(formatRelativeTime(ago(2 * 86400), now)).toBe('2일 전');
    expect(formatRelativeTime(ago(2 * 7 * 86400), now)).toBe('2주 전');
    expect(formatRelativeTime(ago(2 * 30 * 86400), now)).toBe('2개월 전');
    expect(formatRelativeTime(ago(2 * 365 * 86400), now)).toBe('2년 전');
  });

  it('미래 시각은 "방금 전"으로 방어한다', () => {
    expect(formatRelativeTime(new Date(now.getTime() + 60_000).toISOString(), now)).toBe('방금 전');
  });

  it('파싱 불가하면 빈 문자열 (호출부가 절대시간으로 폴백)', () => {
    expect(formatRelativeTime('not-a-date', now)).toBe('');
  });
});

describe('getAvatarInitial', () => {
  it('닉네임 첫 글자를 대문자로', () => {
    expect(getAvatarInitial('alice')).toBe('A');
    expect(getAvatarInitial('가나다')).toBe('가');
  });

  it('빈/공백/누락 이름은 "?"', () => {
    expect(getAvatarInitial('')).toBe('?');
    expect(getAvatarInitial('   ')).toBe('?');
    expect(getAvatarInitial(null)).toBe('?');
    expect(getAvatarInitial(undefined)).toBe('?');
  });

  it('이모지 서러게이트 쌍을 깨지 않는다', () => {
    expect(getAvatarInitial('😀 hi')).toBe('😀');
  });
});

describe('formatCompactCount', () => {
  it('1000 미만은 정수 그대로', () => {
    expect(formatCompactCount(0)).toBe('0');
    expect(formatCompactCount(999)).toBe('999');
  });

  it('천 단위 축약 (딱 떨어지면 소수점 없음)', () => {
    expect(formatCompactCount(1000)).toBe('1천');
    expect(formatCompactCount(1500)).toBe('1.5천');
    expect(formatCompactCount(1234)).toBe('1.2천');
  });

  it('만 단위 축약', () => {
    expect(formatCompactCount(10000)).toBe('1만');
    expect(formatCompactCount(12345)).toBe('1.2만');
  });

  it('음수/NaN은 "0"으로 방어', () => {
    expect(formatCompactCount(-5)).toBe('0');
    expect(formatCompactCount(Number.NaN)).toBe('0');
  });
});
