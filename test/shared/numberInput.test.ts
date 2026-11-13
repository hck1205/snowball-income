import { describe, expect, it } from 'vitest';
import { formatRatePercent, manInputToWon, parsePositiveInput } from '@/shared/utils';

/** 계산기 입력 변환(2026-11-13 추출) — 세금·은퇴 소득 계산기가 같은 규칙으로 입력을 읽는다. */
describe('숫자 입력 변환', () => {
  it('쉼표를 지우고 양수만 — 빈 칸·음수·숫자 아님은 0', () => {
    expect(parsePositiveInput('1,500')).toBe(1500);
    expect(parsePositiveInput('3.5')).toBe(3.5);
    for (const bad of ['', '-5', 'abc', '0']) expect(parsePositiveInput(bad)).toBe(0);
  });

  it('만원 입력 → 원', () => {
    expect(manInputToWon('150')).toBe(1_500_000);
    expect(manInputToWon('')).toBe(0);
  });

  it('비율 → 퍼센트 글자(끝의 0은 지운다)', () => {
    expect(formatRatePercent(0.055)).toBe('5.5%');
    expect(formatRatePercent(0.15)).toBe('15%');
    expect(formatRatePercent(0.165)).toBe('16.5%');
  });
});
