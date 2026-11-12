import { describe, expect, it } from 'vitest';
import { calculateDividendTax, progressiveTax, type DividendTaxInput } from '@/shared/lib/dividendTax';

/**
 * 미국 배당 세금·건보료(2026-11-12). 기대값은 shared/lib/dividendTax/RULES.md 의 규칙으로 **손으로 계산**했다.
 * 상수를 바꾸면 이 표도 손으로 다시 계산해 고친다(엔진 출력을 그대로 복사해 넣지 않는다).
 */
const base: DividendTaxInput = {
  usDividendAnnual: 0,
  otherFinancialAnnual: 0,
  otherTaxBase: 0,
  health: 'regional',
  otherIncomeForDependent: 0,
  isaSeomin: false
};

describe('종합소득세 누진세율', () => {
  it('구간 경계 — 1,400만 84만원, 5,000만 624만원, 8,800만 1,536만원', () => {
    expect(progressiveTax(0)).toBe(0);
    expect(progressiveTax(14_000_000)).toBeCloseTo(840_000);
    expect(progressiveTax(50_000_000)).toBeCloseTo(6_240_000);
    expect(progressiveTax(88_000_000)).toBeCloseTo(15_360_000);
  });
});

describe('미국 배당과 금융소득종합과세', () => {
  it('🔴 2,000만원 이하: 미국 15% 원천징수로 끝, 종합과세 아님', () => {
    const r = calculateDividendTax({ ...base, usDividendAnnual: 12_000_000 });
    expect(r.usWithheld).toBe(1_800_000);
    expect(r.usNetAfterWithholding).toBe(10_200_000);
    expect(r.comprehensive).toBe(false);
    expect(r.extraIncomeTax).toBe(0);
  });

  it('🔴 다른 소득이 없으면 종합과세 대상이어도 미국 15%가 국내 몫보다 커서 추가 세금 0', () => {
    // ① 280만 + 누진(1,000만)=60만 → 340만 / ② 3,000만×14%=420만 → 몫 420만 < 이미 낸 450만
    const r = calculateDividendTax({ ...base, usDividendAnnual: 30_000_000 });
    expect(r.comprehensive).toBe(true);
    expect(r.extraIncomeTax).toBe(0);
  });

  it('🔴 다른 과표 6,000만 + 미국 배당 5,000만: 비교과세 ① 선택, 추가 국세 272만 × 1.1', () => {
    // 누진(6,000만)=864만. ① 280만+누진(9,000만)=280만+1,606만=1,886만 / ② 700만+864만=1,564만
    // 몫=1,886만−864만=1,022만, 이미 낸 750만 → 272만 → 지방세 포함 299.2만
    const r = calculateDividendTax({ ...base, usDividendAnnual: 50_000_000, otherTaxBase: 60_000_000 });
    expect(r.extraIncomeTax).toBe(2_992_000);
    expect(r.estimated).toContain('comprehensive');
  });
});

describe('건강보험', () => {
  it('🔴 지역가입자: 금융소득 1,000만원 이하면 미반영, 넘으면 전액 × 7.19% × (1+13.14%)', () => {
    expect(calculateDividendTax({ ...base, usDividendAnnual: 10_000_000 }).health.monthlyIncrease).toBe(0);
    const r = calculateDividendTax({ ...base, usDividendAnnual: 30_000_000 });
    expect(r.health.countedIncome).toBe(30_000_000);
    expect(r.health.monthlyIncrease).toBe(203_369); // 250만 × 0.0719 × 1.1314
  });

  it('🔴 직장가입자: 보수 외 소득 2,000만원 초과분만', () => {
    const r = calculateDividendTax({ ...base, usDividendAnnual: 30_000_000, health: 'employee' });
    expect(r.health.countedIncome).toBe(10_000_000);
    expect(r.health.monthlyIncrease).toBe(67_790); // 83.33만 × 0.0719 × 1.1314
  });

  it('🔴 피부양자: 금융소득 + 다른 소득(공적연금 100%)이 2,000만원을 넘으면 탈락(보수: 금융소득 전액 합산)', () => {
    expect(calculateDividendTax({ ...base, health: 'dependent', usDividendAnnual: 15_000_000, otherIncomeForDependent: 6_000_000 }).health.dependentLost).toBe(true);
    expect(calculateDividendTax({ ...base, health: 'dependent', usDividendAnnual: 15_000_000, otherIncomeForDependent: 4_000_000 }).health.dependentLost).toBe(false);
  });
});

describe('일반계좌 vs ISA', () => {
  it('🔴 일반 15.4%(보수) vs ISA 비과세 200만원 초과분 9.9% — 서민형은 400만원', () => {
    const r = calculateDividendTax({ ...base, usDividendAnnual: 10_000_000 });
    expect(r.isa.generalTax).toBe(1_540_000);
    expect(r.isa.isaTax).toBe(792_000);
    expect(calculateDividendTax({ ...base, usDividendAnnual: 10_000_000, isaSeomin: true }).isa.isaTax).toBe(594_000);
  });
});
